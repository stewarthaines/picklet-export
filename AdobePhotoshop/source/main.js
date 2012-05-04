// #target photoshop

/*
  the function 'define' is needed by the requirejs build system
  though we're not using its module loading stuff.
  just 'optimizing' source files into a single PickletExport.jsx
*/
function define(name, f) {};

// app.displayDialogs = DialogModes.NO; // suppress all dialogs

var view = new PickletExportView();
view.show();
