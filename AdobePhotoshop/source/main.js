// #target photoshop

/*
  the function 'define' is needed by the requirejs build system
  though we're not using its module loading stuff.
  just 'optimizing' source files into a single PickletExport.jsx
*/
function define(name, f) {};

var view = new PickletExportView();
var controller = new PickletExportController();

view.setController(controller);

view.show();
