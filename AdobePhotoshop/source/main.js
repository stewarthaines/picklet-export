// #target photoshop

/*
  the function 'define' is needed by the requirejs build system
  though we're not using its module loading stuff.
  just 'optimizing' source files into a single PickletExport.jsx
*/
function define(name, f) {};

var model = new PickletExportModel();
var view = new PickletExportView();
var controller = new PickletExportController();

controller.setModel(model);
view.setController(controller);
view.setModel(model);

model.init();
view.show();

this.model.finish(); // to save dialog settings for next run
