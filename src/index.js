
/*@flow*/


//---------------------------------------
//
// settings
//
//---------------------------------------

var bluebird: any = require('bluebird');

if (process.env.NODE_ENV !== 'production') {
  bluebird.longStackTraces();
}

if (process.env.NODE_ENV === 'production') {
  bluebird.onPossiblyUnhandledRejection(e =>  e);
}

//---------------------------------------
//
// Imports
//
//---------------------------------------

var FileSystem = brackets.getModule('filesystem/FileSystem');
var CodeInspection = brackets.getModule('language/CodeInspection');
var ProjectManager = brackets.getModule('project/ProjectManager');
var CodeHintManager = brackets.getModule('editor/CodeHintManager');
var EditorManager = brackets.getModule('editor/EditorManager');

var FlowErrorProvider = require('./errorProvider');
var FlowHintProvider = require('./hintProvider');
var inlineEditProvider = require('./inlineEditProvider');
var jumpToDefinitionProvider = require('./jumpToDefinitionProvider');
var flow = require('./flow');

declare var brackets: any;


//---------------------------------------
//
// Constants
//
//---------------------------------------

var projectRoot: string = '';
var configFileName = '.flowconfig';

//---------------------------------------
//
// Private
//
//---------------------------------------

function checkForFile(file, handler) {
  function run() {
    var file = FileSystem.getFileForPath(projectRoot + '/' + configFileName);
    file.exists(function (err, exists) {
      if(exists) {
        handler(true);
      } else {
        handler(false);
      }
    });
  }
  run();
  FileSystem.on('change', run);
  FileSystem.on('rename', run);

  return {
    dispose: function () {
      FileSystem.off('change', run);
      FileSystem.off('rename', run);
    }
  };
}

function updateProject() {
  if (fileSystemSubsription) {
    fileSystemSubsription.dispose();
  }
  projectRoot = ProjectManager.getProjectRoot().fullPath;
  fileSystemSubsription = checkForFile(configFileName, (hasFile) => hasFile && flow.start(projectRoot));
}


//---------------------------------------
//
// State
//
//---------------------------------------

var fileSystemSubsription: ?{ dispose:() => void };
//---------------------------------------
//
// Public
//
//---------------------------------------

function init(connection: any) {
  flow.setNodeConnection(connection);
  updateProject();
  CodeInspection.register('javascript', FlowErrorProvider); 
  CodeHintManager.registerHintProvider(FlowHintProvider, ['javascript'], 1);
  EditorManager.registerInlineEditProvider(inlineEditProvider, 1);
  EditorManager.registerJumpToDefProvider(jumpToDefinitionProvider, 1);
  $(ProjectManager).on('projectOpen', updateProject);
}





module.exports = init;