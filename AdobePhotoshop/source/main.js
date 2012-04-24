/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>Picklet Export Layer Comps</name>
<about>Outputs Layer Comps in the current document to named folders.</about>
<category>layercomps</category>
<enableinfo>true</enableinfo>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING

*/

// #target photoshop

/*
  the function 'define' is required by the requirejs build system
  though we're not using its module loading stuff.
  just 'optimizing' source files into a single PickletExport.jsx
*/
function define(name, f) {};

/*
  This script can be set up to run from a function key shortcut;

  0) ensure there are no open documents in Photoshop
  1) open the Actions panel
  2) click 'Create new action' button (starts recording action immediately)
  3) from the menu choose File | Scripts | Browse and locate the PickletExport.jsx script
  4) click 'Cancel' on the PickletExport dialog
  5) click the 'Stop playing/recording' button in the Actions panel
  6) double-click the Action in the Actions panel to bring up Action Options
  7) give the action a Function Key shortcut
*/

// UI strings to be localized
var strShortcutBinding = "A PickletExport action has been added to the Actions panel. It is strongly advised that you bind this action to a function key to run it easily. (To do this, double-click in the space right of the 'PickletExport' action in the Actions panel and select a Function Key.)";
var strRevisionNumber = "r12";
var strScriptName = "PickletExport.jsx";
var strCopyrightNotice = "by RobotInaBox";
var strTitle = "Picklet Export";
var strButtonRun = "Export";
var strButtonCancel = "Cancel";
var strButtonCreate = "Generate new template";
var strHelpText = "Specify the destination for all layer comp folders. Layer names are converted to lowercase with no spaces for filenames.";
var strLabelDestination = "Export to destination:";
var strButtonBrowse = "&Browse...";
var strLabelFileNamePrefix = "File Name Prefix:";
var strCheckboxSelectionOnly = "Export &Selected Layer Comp Only";
var strCheckboxExportThumbnails = "Export Panel &Thumbnails";
var strLabelFileType = "File Type:";
var strCheckboxIncludeICCProfile = "&Include ICC Profile";
var strJPEGOptions = "JPEG Options:";
var strLabelQuality = "Quality:";
var strPSDOptions = "PSD Options:";
var strCheckboxMaximizeCompatibility = "&Maximize Compatibility";
var strTIFFOptions = "TIFF Options:";
var strLabelImageCompression = "Image Compression:";
var strNone = "None";
var strPDFOptions = "PDF Options:";
// var strLabelEncoding = "Encoding:";
// var strTargaOptions = "Targa Options:";
// var strLabelDepth = "Depth:";
// var strRadiobutton16bit = "16bit";
// var strRadiobutton24bit = "24bit";
// var strRadiobutton32bit = "32bit";
// var strBMPOptions = "BMP Options:";
// var strPNGOptions = "PNG Options:";
var strAlertSpecifyDestination = "Please specify destination.";
var strAlertDestinationNotExist = "Destination does not exist.";
var strTitleSelectDestination = "Select Destination";
var strAlertDocumentMustBeOpened = "You must have a document open to export.";
var strAlertNoLayerCompsFound = "No layer comps found in document.";
var strAlertWasSuccessful = " was successful.";
var strUnexpectedError = "Unexpected error";
var strMessage = "Picklet Export Layer Comps To Folders action settings";
var strPickletTemplate = "Export picklet template file";
var stretQuality = "30";
var stretDestination = "300";
var strddFileType = "100";
var strpnlOptions = "100";
var output_log = "";
var output_status = { 'saved': [], 'failed': [] };
var files_saved = {};

var bmpIndex = 0;
var jpegIndex = 1;
var pdfIndex = 2;
var psdIndex = 3;
var targaIndex = 4;
var tiffIndex = 5;
var pngIndex = 6;

// the drop down list indexes for tiff compression
var compNoneIndex = 0;
var compLZWIndex = 1;
var compZIPIndex = 2;
var compJPEGIndex = 3;

// ok and cancel button
var runButtonID = 1;
var cancelButtonID = 2;

var exportInfo = null;
var duplicateRef = null;

var basePickletWidth = 320;
var basePickletHeight = 480;

var retinaPickletWidth = 2 * basePickletWidth;
var retinaPickletHeight = 2 * basePickletHeight;

var thumbnailWidth = 64;
var thumbnailHeight = 96;

var filenameSuffix = '';
var filenamePrefix = '';
var saveUnits;
var toplevelFolder;
var originalDocument;

displayDialogs = DialogModes.NO;
//app.activeDocument.suspendHistory('Picklet Export', 'main();');
main();
//saveLayerSet('page_01');

///////////////////////////////////////////////////////////////////////////////
// selectAllLayers - select all layers (Select > All Layers)
///////////////////////////////////////////////////////////////////////////////
function selectAllLayers() {
  var ref = new ActionReference();
  ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
  var desc = new ActionDescriptor();
  desc.putReference(cTID('null'), ref);
  executeAction(sTID('selectAllLayers'), desc, DialogModes.NO);
}

///////////////////////////////////////////////////////////////////////////////
// hideLayers - hide all selected layers (Layer > Hide Layers)
///////////////////////////////////////////////////////////////////////////////
function hideLayers() {
  var ref = new ActionReference();
  ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
  var list = new ActionList();
  list.putReference(ref);
  var desc = new ActionDescriptor();
  desc.putList(cTID('null'), list);
  executeAction(cTID('Hd  '), desc, DialogModes.NO);
}

function cTID(s) {return app.charIDToTypeID(s);}
function sTID(s) {return app.stringIDToTypeID(s);}

function slugify(s)
{
  //s = 'Was wäre daß® für ein + unnützer Tést?';

  var slug = s;

  slug = slug.toLowerCase();
  slug = slug.replace(/\s+/g,'-');

  tr = {
    '\u00e4':'ae',
    '\u00fc':'ue',
    '\u00f6':'oe',
    '\u00df':'ss',
    '\u00df':'ss',
    '\u00e9':'e',
    '/':'-'
  };

  for ( var key in tr )
  {
    slug = slug.replace(new RegExp(key, 'g'), tr[key]);
  }

  slug = slug.replace(/[^_a-zA-Z0-9\-]/g,'');
  slug = slug.replace(/-+/g, '_');

  //alert(slug);
  // return(s);

  return slug;
}

// returns a string representation of the layer's color property
// (as set in the layers panel)
function getLayerPropertiesColor() {
  var ref = new ActionReference(); 
  ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") ); 
  var desc = executeActionGet(ref); 
  var idClr = charIDToTypeID( "Clr " );
  var idClr = charIDToTypeID( "Clr " );
  var theColor = typeIDToStringID(desc.getEnumerationValue(idClr, idClr));
  // alert (theColor);
  return desc.getEnumerationValue(idClr, idClr); // theColor;
}

// open a url in the default browser
function openURL(url) {
  var fname = "shortcut.url";
  var shortcut = new File(Folder.temp + '/' + fname);
  shortcut.open('w');
  shortcut.writeln('[InternetShortcut]');
  shortcut.writeln('URL=' + url);
  shortcut.writeln();
  shortcut.close();
  shortcut.execute();
  $.sleep(100); // not sure about this. mac os x 10.6 needed it.
  shortcut.remove();
};

function export_cover() {
  var docRef = duplicateRef;
  var compRef;

  // make sure there's a thumbnails folder
  // var thumbnailsFolder = new Folder (exportInfo.destination+'/thumbnails');
  // thumbnailsFolder.create();

  try {
    compRef = docRef.layerComps['cover'];
  } catch (e) {
    // fallback to the first layer comp
    compRef = docRef.layerComps[0];
  }

  compRef.apply();

  filenameSuffix = '@2x';
  filenamePrefix = '';
  if (docRef.width > retinaPickletWidth || docRef.height > retinaPickletHeight) {
    docRef.resizeImage(retinaPickletWidth, retinaPickletHeight);
  }
  saveFile(docRef, 'cover', exportInfo);

  filenameSuffix = '';
  docRef.resizeImage(basePickletWidth, basePickletHeight);
  saveFile(docRef, 'cover', exportInfo);

  filenameSuffix = '@2x';
  docRef.resizeImage(thumbnailWidth*2, thumbnailHeight*2);
  saveFile(docRef, 'cover_thumbnail', exportInfo);

  filenameSuffix = '';
  docRef.resizeImage(thumbnailWidth, thumbnailHeight);
  saveFile(docRef, 'cover_thumbnail', exportInfo);
}

function export_layers() {
  // var duppedDocument = app.activeDocument.duplicate();
  var docRef = duplicateRef;
  var compsIndex;
  var compsCount = docRef.layerComps.length;
  for (compsIndex = 0; compsIndex < compsCount; compsIndex++) {

    var compRef = duplicateRef.layerComps[compsIndex];

    if (exportInfo.selectionOnly && !compRef.selected) continue; // selected only

    var name = compRef.name;

    var layerSet = null;
    if (name == 'cover'){
      // handle cover set elsewhere
      continue;
    } else {
      try {
        layerSet = duplicateRef.layerSets[name].layers;
      } catch(e) {
        alert("No Layer Set matching Layer Comp named '" + name + "' found.");
        return "cancel";
      }
    }

    // make another copy of the duplicateRef because we're going to 
    // delete some layers from it each time through this loop
    docRef = duplicateRef.duplicate();

    layerSet = docRef.layerSets[name].layers;

    // delete other layerSets than the one being exported (optimisation for speed)
    for (var otherLayer = docRef.layerSets.length - 1; otherLayer >= 0; otherLayer--) {
      if (name != docRef.layerSets[otherLayer].name) {
        docRef.layerSets[otherLayer].remove();
      }
    }

    var fileNameBody = exportInfo.fileNamePrefix;

    var newFolder = name;
    // var CurrentFolder = originalDocument.path;
    var CurrentFolder = toplevelFolder;
    var tempFolder = new Folder (CurrentFolder+"/"+newFolder);
    tempFolder.create();
    if (filenamePrefix) {
      var retinaFolder = new Folder(CurrentFolder+"/"+newFolder+"/"+filenamePrefix);
      retinaFolder.create();
    }
    //var compRef = docRef.layerComps[ compsIndex ];
    //var compRef = docRef.layerComps[name];
    compRef.apply();

    // app.activeDocument = docRef;

    var layerIndex;
    for (layerIndex = 0; layerIndex < layerSet.length; layerIndex++) {

        app.activeDocument = docRef;

        //docRef.selection.selectAll();
        //app.activeDocument.selection.copy();
        //var SB = activeDocument.selection.bounds;
        docRef.activeLayer = layerSet[layerIndex];
        //var style = docRef.activeLayer.style;
        //docRef.activeLayer.copy();
        var SB = docRef.activeLayer.bounds;
        var res = docRef.resolution;
        var width = SB[2] - SB[0];
        var height = SB[3] - SB[1];
        // get the document resolution
        var docResolution = docRef.resolution;
        // create a new doc based on selection size
        //var newDocRef = app.documents.add(width, height, docResolution);
        docRef.resizeCanvas(width, height);
        // move the layer to the origin of new size

        selectAllLayers(docRef, 2);
        hideLayers();
        var background = docRef.layers[docRef.layers.length -1];
        if (background.isBackgroundLayer) {
          background.visible = false;
        }
        docRef.layerSets[name].visible = true;
        docRef.activeLayer = layerSet[layerIndex];
        docRef.activeLayer.visible = true;
        // if this is a LayerSet make sure it's child layers are visible
        if (docRef.activeLayer.typename == "LayerSet") {
          for (var i = 0; i < docRef.activeLayer.layers.length; i++) {
            docRef.activeLayer.layers[i].visible = true;
          }
        }

        var l = docRef.activeLayer;
        var SB = docRef.activeLayer.bounds;
        var width = SB[2] - SB[0];
        var height = SB[3] - SB[1];
        if (width == 0 || height == 0) continue; // ignore empty layers
        l.translate(-SB[0], -SB[1]);

        var fileNameBody = /*exportInfo.fileNamePrefix +*/ docRef.activeLayer.name;
        // fileNameBody = fileNameBody.replace(/[:\/\\*\?\"\<\>\|]/g, "_");
        if (exportInfo.slugify) {
          fileNameBody = slugify(fileNameBody);
        }
        //fileNameBody = fileNameBody + filenameSuffix;

        saveFile(docRef, newFolder + "/" + filenamePrefix + fileNameBody, exportInfo);
        //app.activeDocument = newDocRef;
        //newDocRef.paste();
        //newDocRef.layers['Background'].remove();
        //newDocRef.layers[0].applyStyle('Purple and Magenta');
    }
    docRef.close(SaveOptions.DONOTSAVECHANGES);
  }
}


function export_thumbnails() {
  var docRef = duplicateRef;

  // resize document to 50x75
  // docRef.resizeCanvas(50, 75);
  docRef.resizeImage(thumbnailWidth, thumbnailHeight);

  // make a folder called 'thumbnails' if it doesn't already exist
  var newFolder = 'thumbnails';
  var CurrentFolder = toplevelFolder;
  var tempFolder = new Folder (CurrentFolder+"/"+newFolder);
  tempFolder.create();

  var compsIndex;
  var compsCount = docRef.layerComps.length;
  for (compsIndex = 0; compsIndex < compsCount; compsIndex++) {

    var compRef = docRef.layerComps[compsIndex];

    if (exportInfo.selectionOnly && !compRef.selected) continue; // selected only

    if (compRef.name == 'cover'){
      // handle cover set elsewhere
      continue;
    } else {

      compRef.apply();

      var fileNameBody = compRef.name;
      // if (exportInfo.slugify) {
      //   fileNameBody = slugify(fileNameBody);
      // }
      saveFile(docRef, newFolder + "/" + fileNameBody, exportInfo);
    }
  }
}

function exportSelectedLayers() {

  // FIXME here
  // this is awful. how can you live with yourself?

  // get an array of selected layers in original doc
  // var layer = docRef.activeLayer;
  var layer = duplicateRef.activeLayer;
  // alert(duplicateRef.activeLayer);
  // if ( duplicateRef.activeLayer == 'undefined') return;
  // var index = getActiveLayerIndex(docRef);
  var index;
  
  // var duplicateRef = docRef.duplicate();
  
  app.activeDocument = duplicateRef;

  // check that we've selected a layer within a LayerSet
  var panel_name;
  if (layer.parent instanceof LayerSet) {
    panel_name = layer.parent.name;
  } else {
    panel_name = null;
    return;
  }

  var layer_index = -1;
  for (var i=0; i < layer.parent.layers.length; i++) {
    if (duplicateRef.activeLayer == layer.parent.layers[i]) {
      layer_index = i;
    }
  }

  if (layer_index == -1) return;

  // var layer = duplicateRef.activeLayer;

  // duplicateRef.activeLayer = layerSet[layerIndex];
  // var layerSet = docRef.layerSets[name].layers;

  // duplicateRef.activeLayer = duplicateRef.layers[layer.index];
  // duplicateRef.activeLayer.visible = true;

  var message;
  if (panel_name && layer_index >= 0) {
    // layer = duplicateRef.activeLayer = duplicateRef.layers[index];
    message = 'selected: ' + panel_name + '/' + layer.name;
  } else {
    message = 'no layer selected';
  }

  // hide all other layers
  app.activeDocument = duplicateRef;
  selectAllLayers();
  hideLayers();
  // hide background layer if present
  var background = duplicateRef.layers[duplicateRef.layers.length -1];
  if (background.isBackgroundLayer) {
    background.visible = false;
  }

  // set the activeLayer in the duplicate doc ready to export
  duplicateRef.activeLayer = duplicateRef.layers[panel_name].layers[layer_index];

  duplicateRef.activeLayer.visible = true;
  duplicateRef.activeLayer.parent.visible = true;
  // if this is a LayerSet make sure it's child layers are visible
  if (duplicateRef.activeLayer.typename == "LayerSet") {
    for (var i = 0; i < duplicateRef.activeLayer.layers.length; i++) {
      duplicateRef.activeLayer.layers[i].visible = true;
    }
  }

  // duplicateRef.resizeImage(basePickletWidth, basePickletHeight);

  var l = duplicateRef.activeLayer;
  var SB = duplicateRef.activeLayer.bounds;
  var width = SB[2] - SB[0];
  var height = SB[3] - SB[1];
  var filename;
  if (width == 0 || height == 0) {
    message = 'no content in layer. ignored.'; // ignore empty layers
  } else {
    duplicateRef.resizeCanvas(width, height);

    SB = duplicateRef.activeLayer.bounds;
    l.translate(-SB[0], -SB[1]);

    filename = panel_name + '/' + filenamePrefix + slugify(duplicateRef.activeLayer.name);
    message = 'saved: ' + filename + '.png';

    saveFile(duplicateRef, filename, exportInfo);
  }

/*
  if (DialogModes.ALL == app.playbackDisplayDialogs) {
    // only display the dialog if user hasn't selected 'toggle dialog on' in actions panel
    dlgLayers = new Window("dialog", "Export selected layers");

    dlgLayers.message = dlgLayers.add("statictext", undefined, message, {
        multiline: true
    });
    dlgLayers.message.preferredSize.width = 700;

    dlgLayers.btnCancel = dlgLayers.add("button", undefined, "Close");
    dlgLayers.btnCancel.onClick = function() {
        dlgLayers.close(cancelButtonID);
    };
    dlgLayers.defaultElement = dlgLayers.btnCancel;
    dlgLayers.cancelElement = dlgLayers.btnCancel;

    var result = dlgLayers.show();

    if (cancelButtonID == result) {
        return result;
    }
  } else {
    return;
  }
  */
}

function displayExportLog() {
  dlgExportLog = new Window("dialog", "PickletExport log");

  dlgExportLog.orientation = 'column';
  dlgExportLog.alignChildren = 'left';

  var output_msg = '';
  output_msg += 'Saved layers\n---------------------------\n';
  for (var m in output_status['saved']) {
    output_msg += output_status['saved'][m] + '\n';
  }
  if (output_status['failed'].length > 0) {
    output_msg += '\nIssues to be resolved\n---------------------------\n';
  }
  for (var m in output_status['failed']) {
    output_msg += output_status['failed'][m] + '\n';
  }
  
  // check that the proportions of the document are close to iPhone ratio
  if (Math.pow((app.activeDocument.height / app.activeDocument.width) - 1.5, 2) > 0.001) {
    output_msg += '\n\nWARNING: document does not have iPhone screen ratio. (320x480)';
  }

  dlgExportLog.etHelp = dlgExportLog.add("edittext", undefined, output_msg, {
      multiline: true
  });
  dlgExportLog.etHelp.alignment = 'fill';
  dlgExportLog.etHelp.preferredSize.width = 700;
  dlgExportLog.etHelp.preferredSize.height = 400;

  dlgExportLog.grpFourthLine = dlgExportLog.add("group");
  dlgExportLog.grpFourthLine.orientation = 'row';
  dlgExportLog.grpFourthLine.alignChildren = 'right';
  dlgExportLog.grpFourthLine.alignment = 'right';

  dlgExportLog.btnCancel = dlgExportLog.grpFourthLine.add("button", undefined, 'Close');
  dlgExportLog.btnCancel.onClick = function() {
      dlgExportLog.close(cancelButtonID);
  };

  dlgExportLog.defaultElement = dlgExportLog.btnCancel;
  dlgExportLog.cancelElement = dlgExportLog.btnCancel;

  var result = dlgExportLog.show();

  if (cancelButtonID == result) {
      return result;
      // close to quit
  }

}

function createPicklet() {
  dlgCreate = new Window("dialog", "Create Picklet document");

  dlgCreate.orientation = 'column';
  dlgCreate.alignChildren = 'left';

  // -- two groups, one for left and one for right ok, cancel
  dlgCreate.grpTop = dlgCreate.add("group");
  dlgCreate.grpTop.orientation = 'column';
  dlgCreate.grpTop.alignChildren = 'left';
  dlgCreate.grpTop.alignment = 'fill';

  dlgCreate.pnlHelp = dlgCreate.grpTop.add("panel");
  dlgCreate.pnlHelp.alignment = 'fill';

  dlgCreate.etHelp = dlgCreate.pnlHelp.add("statictext", undefined, "This script creates a new document with Layer Sets and Layer Comps ready to go.", {
      multiline: true
  });
  dlgCreate.etHelp.alignment = 'fill';

  // -- top of the dialog, first line
  //dlgCreate.grpTop.add("statictext", undefined, "No. of panels:");

  // -- group top left
  dlgCreate.grpFirstLine = dlgCreate.grpTop.add("group");
  dlgCreate.grpFirstLine.orientation = 'column';
  dlgCreate.grpFirstLine.alignChildren = 'left';
  dlgCreate.grpFirstLine.alignment = 'fill';

  // -- the second line in the dialog
  dlgCreate.grpSecondLine = dlgCreate.grpTop.add("group");
  dlgCreate.grpSecondLine.orientation = 'row';
  dlgCreate.grpSecondLine.alignChildren = 'center';

  dlgCreate.grpSecondLine.add("statictext", undefined, "No. of panels:");

  //dlgCreate.etDestination = dlgCreate.grpSecondLine.add("edittext", undefined, "12");
  dlgCreate.etDestination = dlgCreate.grpSecondLine.add("edittext", undefined, "1");
  dlgCreate.etDestination.preferredSize.width = 100;
  dlgCreate.etDestination.alignment = 'fill';

  dlgCreate.grpFourthLine = dlgCreate.grpTop.add("group");
  dlgCreate.grpFourthLine.orientation = 'row';
  dlgCreate.grpFourthLine.alignChildren = 'right';
  dlgCreate.grpFourthLine.alignment = 'right';

  dlgCreate.btnRun = dlgCreate.grpFourthLine.add("button", undefined, "Create");
  dlgCreate.btnRun.onClick = function() {
      // check if the setting is properly
      dlgCreate.close(runButtonID);

      // FIXME:
      // create a new document and make a layer set and layer comp for each
      // of the 'n' panels requested called 'panel_n' and a layer comp called 'cover'
      var docRef = app.documents.add(retinaPickletWidth, retinaPickletHeight, 72, "Untitled Picklet");
      app.activeDocument = docRef;

      var layerRef = docRef.artLayers.add();
      layerRef.name = 'region_guide';
      layerRef.blendMode = BlendMode.NORMAL;

//      docRef.layers['status_bar'].select();

      // create a black status bar
      var shapeRef = [[0,0], [retinaPickletWidth,0], [retinaPickletWidth,40], [0,40]];
      docRef.selection.select(shapeRef);
      var blackColor = new SolidColor();
      blackColor.rgb.red = 0;
      blackColor.rgb.green = 0;
      blackColor.rgb.blue = 0;
      docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 100, false);

      // create a block representing the nav controls
      docRef.selection.select([[0,40], [retinaPickletWidth,40], [retinaPickletWidth,128], [0,128]]);
      docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 25, false);

      // create a block representing the slider on home screen dimensions
      docRef.selection.select([[0,772], [retinaPickletWidth,772], [retinaPickletWidth,retinaPickletHeight], [0,retinaPickletHeight]]);
      docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 25, false);

      docRef.selection.select([]);

      var workingSetRef = docRef.layerSets.add();
      workingSetRef.name = 'working';
      // Move the new layer to the end of the working layer
      layerRef.move(workingSetRef, ElementPlacement.PLACEATEND);

/*
      // set some document info properties
      docInfoRef = docRef.info;
      docInfoRef.copyrighted = CopyrightedType.COPYRIGHTEDWORK;
      //docInfoRef.ownerUrl = "http://picklet.net";
*/
      var previousSetRef;
      for (var count = 1; count <= dlgCreate.etDestination.text; count++) {
        var name = 'panel_' + count;
        var panelComp = docRef.layerComps.add(name, null, false, false, true);
        // panelComp.name = name;
        var panelSetRef = docRef.layerSets.add();
        panelSetRef.name = name;
        if (previousSetRef) {
          panelSetRef.move(previousSetRef, ElementPlacement.PLACEAFTER);
        }
        previousSetRef = panelSetRef;
      }

      // and a layer comp for the cover image
      docRef.layerComps.add('cover', null, false, false, true);

      // open a Save As dialog
      executeAction( charIDToTypeID( "save" ), undefined, DialogModes.ALL );
  };

  dlgCreate.btnCancel = dlgCreate.grpFourthLine.add("button", undefined, strButtonCancel);
  dlgCreate.btnCancel.onClick = function() {
      dlgCreate.close(cancelButtonID);
  };

  dlgCreate.defaultElement = dlgCreate.btnRun;
  dlgCreate.cancelElement = dlgCreate.btnCancel;

  var result = dlgCreate.show();

  if (cancelButtonID == result) {
      return result;
      // close to quit
  }

}

function initPickletFromDoc(docRef, docName) {
  var obj = {};
  docName = docName.replace(/\.psd/g, "");
  
  obj.exporter = {
    'name': strScriptName,
    'revision': strRevisionNumber,
    'application': app.name,
    'application_version': app.version,
    'author': docRef.info.author,
    'title': docRef.info.title,
    'date': Date()
  };


  obj.panels = [];

  var compsIndex;
  var compsCount = docRef.layerComps.length;
  for (compsIndex = 0; compsIndex < compsCount; compsIndex++) {
    var compRef = docRef.layerComps[compsIndex];

    var name = compRef.name;
    var layerSet = null;
    if (name == 'cover'){
      // handle cover set elsewhere
      continue;
    } else {
      try {
        layerSet = docRef.layerSets[name].layers;
      } catch(e) {
        alert("No Layer Set matching Layer Comp named '" + name + "' found.");
        return;
      }
    }

    var thumbnail_url = slugify(docName) + '/thumbnails/' + name + '.png';
    obj.panels[compsIndex] = { "name": name, thumbnail: thumbnail_url, "layers": [] };
    
    var fileNameBody = exportInfo.fileNamePrefix;

    var newFolder = name;
    var CurrentFolder = toplevelFolder;
    var tempFolder = new Folder (CurrentFolder+"/"+newFolder);
    // compRef.apply();

    var layerIndex;
    for (layerIndex = 0; layerIndex < layerSet.length; layerIndex++) {
      var layer = {};

      app.activeDocument = docRef;
      docRef.activeLayer = layerSet[layerIndex];
      var SB = docRef.activeLayer.bounds;
      // var res = docRef.resolution;
      var width = SB[2].as('px') - SB[0].as('px');
      var height = SB[3].as('px') - SB[1].as('px');
      
      if (width == 0 || height == 0) continue;

      layer.name = slugify(layerSet[layerIndex].name);
      layer.image = slugify(docName) + '/' + compRef.name + '/' + layer.name + '.png';
      layer.width = width; //Math.floor(width);
      layer.height = height; //Math.floor(height);
      // layer.start_x = SB[0] + ', ' + SB[1] + ', ' + SB[2] + ', ' + SB[3]; //Math.floor(width / 2);
// alert(Number(layerSet[layerIndex].bounds[1]));
// alert(SB[2].value);
      layer.start_x = Number(SB[0]) + Math.floor(layer.width / 2);
      // layer.start_y = Math.floor(SB[1] + Math.floor(height / 2));
      layer.start_y = Number(SB[1]) + Math.floor(layer.height / 2);
      // layer.end_x = layer.start_x;
      // layer.end_y = layer.start_y;
      layer.origin_x = Math.floor(width / 2);
      layer.origin_y = Math.floor(height / 2);
      layer.origin_x_rel = null;
      layer.origin_y_rel = null;

      // push() layer onto array since we ignore empty layers and layerIndex isn't necessarily accurate
      obj.panels[compsIndex].layers.push(layer);
    }
  }
  return obj;
}

function restorePrefs() {
  preferences.rulerUnits = saveUnits;
}

function main() {
  saveUnits = preferences.rulerUnits;
  preferences.rulerUnits = Units.PIXELS;

  if ( app.documents.length <= 0 ) {
      if ( DialogModes.NO != app.playbackDisplayDialogs ) {
          //alert( strAlertDocumentMustBeOpened );
          // alternatively, open a dialog prompting to create a new picklet document
          createPicklet();
      }
    restorePrefs();
    //return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
    return;
  }

  exportInfo = new Object();
  initExportInfo(exportInfo);

  // look for last used params via Photoshop registry, getCustomOptions will throw if none exist
  try {
    var d = app.getCustomOptions("Picklet-Export-settings-" + app.activeDocument.fullName);
    descriptorToObject(exportInfo, d, postProcessExportInfo);
  }
  catch(e) {
    // it's ok if we don't have any options, continue with defaults
  }

  // see if I am getting descriptor parameters
  descriptorToObject(exportInfo, app.playbackParameters, postProcessExportInfo);

  originalDocument = app.activeDocument;
  toplevelFolder = exportInfo.destination + '/' + slugify(originalDocument.name.replace(/\.psd/g, ""));

  // check if we're running silent to export selected layers only
  if ( app.documents.length > 0 ) {
    // there's a document open
    // pre-flight check that we can export files
    // if there's at least one selected layer export only that one
    if (DialogModes.ERROR == app.playbackDisplayDialogs) {
      // var destination = dlgMain.etDestination.text;
      
      if (typeof exportInfo.destination == 'undefined' || exportInfo.destination == '') {
        // bail out if the destination folder isn't set
        // notify user of likely cause of error
        alert('No destination set for layer export\nSet \'Toggle dialog\' to \'on\' in the Actions panel to configure export options.');
        return;
      }
      if (app.activeDocument.activeLayer.parent.typename == 'LayerSet') {
        if (exportInfo.exportSelectedFullsize) {
          // save fullsize selected layer
          duplicateRef = app.activeDocument.duplicate();
          filenamePrefix = 'x2/';
          duplicateRef.suspendHistory('Picklet Export', 'exportSelectedLayers()');
          app.activeDocument = originalDocument;
          duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
        }

        duplicateRef = app.activeDocument.duplicate();
        duplicateRef.resizeImage(basePickletWidth, basePickletHeight);
        filenamePrefix = '';
        duplicateRef.suspendHistory('Picklet Export', 'exportSelectedLayers()');
        app.activeDocument = originalDocument;
        duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
        // exportSelectedLayers();
        
        restorePrefs();
      }
      return;
    }
  }

  if ( DialogModes.ALL == app.playbackDisplayDialogs | DialogModes.ERROR == app.playbackDisplayDialogs) {
    if (cancelButtonID == settingDialog(exportInfo)) {
      restorePrefs();
      return;
      //return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
    }
  }

  // remember exportInfo using Photoshop registry

  var d = objectToDescriptor(exportInfo, preProcessExportInfo);
  d.putString( app.charIDToTypeID( 'Msge' ), strMessage );
  app.putCustomOptions("Picklet-Export-settings-" + app.activeDocument.fullName, d);

  //make firstDocument the active document
  //var docRef = app.activeDocument;

  // get the corresponding layer set 'name'
  //var set = app.activeDocument.layers[name];
  // var originalDocument = app.activeDocument;

  // pre-flight check for Layer Comps and matching Layer Sets
  var compsCount = originalDocument.layerComps.length;
  if (compsCount < 1) {
    if (DialogModes.NO != app.playbackDisplayDialogs) {
        alert(strAlertNoLayerCompsFound);
    }
    restorePrefs();
    return 'cancel';
  }
  var compsIndex;
  for (compsIndex = 0; compsIndex < compsCount; compsIndex++) {

    var compRef = originalDocument.layerComps[compsIndex];

    if (exportInfo.selectionOnly && !compRef.selected) continue; // selected only

    var name = compRef.name;
    if (name == 'cover') {
      // export cover. doesn't require a layer set

    } else {
      // export regular panel layers
      try {
        var layerSet = originalDocument.layerSets[name].layers;
      } catch(e) {
        alert("No Layer Set matching Layer Comp named '" + name + "' found.");
        restorePrefs();
        return "cancel";
      }
    }
  }

  // create picklet toplevel folder
  toplevelFolder = exportInfo.destination + '/' + slugify(originalDocument.name.replace(/\.psd/g, ""));

  // good to go. save 320x480 size layers
  filenamePrefix = '';
  duplicateRef = originalDocument.duplicate();
  duplicateRef.resizeImage(basePickletWidth, basePickletHeight);
  duplicateRef.suspendHistory('Picklet Export', 'export_layers()');
  duplicateRef.close(SaveOptions.DONOTSAVECHANGES);

  if (exportInfo.savePickletTemplate) {
    // create a picklet.json file in the selected directory
    var pickletText = new File(toplevelFolder + '/picklet.json');
    pickletText.open('w');
    duplicateRef = originalDocument.duplicate();
    duplicateRef.resizeImage(basePickletWidth, basePickletHeight);
    var picklet = initPickletFromDoc(duplicateRef, originalDocument.name); //{ "name": "new picklet", "author": "Stewart Haines" };
    // var picklet = initPickletFromDoc(originalDocument, originalDocument.name); //{ "name": "new picklet", "author": "Stewart Haines" };
    var output = unescape(JSON.stringify(picklet, null, 2).replace(/\\u/g, '%u'));
    pickletText.write(output);
    pickletText.close();
    duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
  }


  if (exportInfo.saveRetinaResolution) {
    // export retina resolution layers
    duplicateRef = originalDocument.duplicate();
    // resize to retina dimensions, if original document is larger
    if (duplicateRef.width > retinaPickletWidth || duplicateRef.height > retinaPickletHeight) {
      duplicateRef.resizeImage(retinaPickletWidth, retinaPickletHeight);
    }
    // filenameSuffix = '@2x';
    filenamePrefix = 'x2/';
    duplicateRef.suspendHistory('Picklet Export', 'export_layers()');
    duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
    filenameSuffix = '';
  }

  if (exportInfo.exportThumbnails) {
    // export thumbnails
    filenamePrefix = '';
    duplicateRef = originalDocument.duplicate();
    duplicateRef.suspendHistory('Picklet Export Thumbnails', 'export_thumbnails()');
    duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
  }

  if (exportInfo.exportCovers) {
    // save out cover images at fullsize and thumbnail
    filenamePrefix = '';
    duplicateRef = originalDocument.duplicate();
    duplicateRef.suspendHistory('Picklet Export Cover', 'export_cover()');
    duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
  }

  // write a log file of the export activity
  var exportLog = new File(toplevelFolder + '/export.log');
  exportLog.open('w');
  exportLog.write(output_log);
  exportLog.close();

  // display export log messages if dialogs are enabled
  if ( DialogModes.NO != app.playbackDisplayDialogs ) {
    displayExportLog();
  }

  restorePrefs();
};

/*
function main() {
    //make firstDocument the active document
    var docRef = app.activeDocument;

    app.preferences.rulerUnits = Units.PIXELS;
    app.activeDocument.selection.selectAll();

    var compsCount = app.activeDocument.layerComps.length;
    if (compsCount <= 1) {
        if (DialogModes.NO != app.playbackDisplayDialogs) {
            alert(strAlertNoLayerCompsFound);
        }
        return 'cancel';
    } else {
        var compsIndex;
        for (compsIndex = 0; compsIndex < compsCount; compsIndex++) {
            var compRef = docRef.layerComps[compsIndex];
            compRef.apply();

            var duppedDocument = app.activeDocument.duplicate();
            var fileNameBody = exportInfo.fileNamePrefix;
            fileNameBody += "_" + zeroSuppress(compsIndex, 4);
            fileNameBody += "_" + compRef.name;
            if (null != compRef.comment) fileNameBody += "_" + compRef.comment;
            fileNameBody = fileNameBody.replace(/[:\/\\*\?\"\<\>\|]/g, "_");
            // '/\:*?"<>|' -> '_'
            if (fileNameBody.length > 120) fileNameBody = fileNameBody.substring(0, 120);
            saveFile(duppedDocument, fileNameBody, exportInfo);
            duppedDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
    }
}
*/
///////////////////////////////////////////////////////////////////////////////
// Function: settingDialog
// Usage: pop the ui and get user settings
// Input: exportInfo object containing our parameters
// Return: on ok, the dialog info is set to the exportInfo object
///////////////////////////////////////////////////////////////////////////////
function settingDialog(exportInfo)
 {
    dlgMain = new Window("dialog", strTitle);

    dlgMain.orientation = 'column';
    dlgMain.alignChildren = 'left';

    dlgMain.btnCreate = dlgMain.add("button", undefined, strButtonCreate);
    dlgMain.btnCreate.onClick = function() {
        // check if the setting is properly
        dlgMain.close(cancelButtonID);
        createPicklet();
        return 'cancel';
    };

    dlgMain.grpExportSelected = dlgMain.add("group");
    dlgMain.grpExportSelected.orientation = 'row';
    dlgMain.grpExportSelected.alignChildren = 'left';
    dlgMain.grpExportSelected.alignment = 'fill';
    dlgMain.btnLayerExport = dlgMain.grpExportSelected.add("button", undefined, "Export Selected Layer");
    dlgMain.cbExportFullsize = dlgMain.grpExportSelected.add("checkbox", undefined, "Fullsize");
    dlgMain.cbExportFullsize.value = exportInfo.exportSelectedFullsize;

    dlgMain.btnLayerExport.onClick = function() {
      exportInfo.exportSelectedFullsize = dlgMain.cbExportFullsize.value;
      dlgMain.close(cancelButtonID);
      if (app.activeDocument.activeLayer.parent.typename == 'LayerSet') {
        if (exportInfo.exportSelectedFullsize) {
          // save fullsize selected layer
          duplicateRef = app.activeDocument.duplicate();
          filenamePrefix = 'x2/';
          duplicateRef.suspendHistory('Picklet Export', 'exportSelectedLayers()');
          app.activeDocument = originalDocument;
          duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
        }

        duplicateRef = app.activeDocument.duplicate();
        duplicateRef.resizeImage(basePickletWidth, basePickletHeight);
        filenamePrefix = '';
        duplicateRef.suspendHistory('Picklet Export', 'exportSelectedLayers()');
        app.activeDocument = originalDocument;
        duplicateRef.close(SaveOptions.DONOTSAVECHANGES);
        // exportSelectedLayers();

        // remember settings related to fullsize export.
        var d = objectToDescriptor(exportInfo, preProcessExportInfo);
        d.putString( app.charIDToTypeID( 'Msge' ), strMessage );
        app.putCustomOptions("Picklet-Export-settings-" + app.activeDocument.fullName, d);
        
        // display export log messages if dialogs are enabled
        if ( DialogModes.NO != app.playbackDisplayDialogs ) {
          displayExportLog();
        }

        restorePrefs();
        return 'cancel';
      }
    };
    
/*
    dlgMain.btnActionCreate = dlgMain.add("button", undefined, "Create an Action for this script");
    dlgMain.btnActionCreate.onClick = function() {
      var id1 = stringIDToTypeID( "AdobeScriptAutomation Scripts" );
        var desc1 = new ActionDescriptor();
        var id2 = charIDToTypeID( "jsCt" );
        desc1.putPath( id2, new File( "/Users/stewart/Projects/picklet/picklet-builder/static/support/PickletExport.jsx" ) );
        var id3 = charIDToTypeID( "jsMs" );
        desc1.putString( id3, "undefined" );
      executeAction( id1, desc1, DialogModes.ALL );
      return 'cancel';
    };
*/
    // -- top of the dialog, first line
    dlgMain.add("statictext", undefined, strLabelDestination);

    // -- two groups, one for left and one for right ok, cancel
    dlgMain.grpTop = dlgMain.add("group");
    dlgMain.grpTop.orientation = 'column';
    dlgMain.grpTop.alignChildren = 'left';
    dlgMain.grpTop.alignment = 'fill';

    // -- group top left
    dlgMain.grpFirstLine = dlgMain.grpTop.add("group");
    dlgMain.grpFirstLine.orientation = 'column';
    dlgMain.grpFirstLine.alignChildren = 'left';
    dlgMain.grpFirstLine.alignment = 'fill';

    // -- the second line in the dialog
    dlgMain.grpSecondLine = dlgMain.grpTop.add("group");
    dlgMain.grpSecondLine.orientation = 'row';
    dlgMain.grpSecondLine.alignChildren = 'center';

    dlgMain.etDestination = dlgMain.grpSecondLine.add("edittext", undefined, exportInfo.destination.toString());
    dlgMain.etDestination.preferredSize.width = StrToIntWithDefault(stretDestination, 300);
    dlgMain.etDestination.alignment = 'fill';

    dlgMain.btnBrowse = dlgMain.grpSecondLine.add("button", undefined, strButtonBrowse);
    dlgMain.btnBrowse.onClick = function() {
        var defaultFolder = dlgMain.etDestination.text;
        var testFolder = new Folder(dlgMain.etDestination.text);
        if (!testFolder.exists) defaultFolder = "~/Dropbox/Public";
        var selFolder = Folder.selectDialog(strTitleSelectDestination, defaultFolder);
        if (selFolder != null) {
            dlgMain.etDestination.text = selFolder.fsName;
        }
        dlgMain.defaultElement.active = true;
    };

    // -- the third line in the dialog
    // dlgMain.grpTopLeft.add("statictext", undefined, strLabelFileNamePrefix);

    // -- group third line
    dlgMain.grpThirdLine = dlgMain.grpTop.add("group");
    dlgMain.grpThirdLine.orientation = 'column';
    dlgMain.grpThirdLine.alignChildren = 'left';
    dlgMain.grpThirdLine.alignment = 'fill';

    dlgMain.cbExportCovers = dlgMain.grpThirdLine.add("checkbox", undefined, "Export Cover Image");
    dlgMain.cbExportCovers.value = exportInfo.exportCovers;

    dlgMain.cbExportThumbnails = dlgMain.grpThirdLine.add("checkbox", undefined, strCheckboxExportThumbnails);
    dlgMain.cbExportThumbnails.value = exportInfo.exportThumbnails;

    dlgMain.cbSelection = dlgMain.grpThirdLine.add("checkbox", undefined, strCheckboxSelectionOnly);
    dlgMain.cbSelection.value = exportInfo.selectionOnly;

    // dlgMain.cbSlugify = dlgMain.grpThirdLine.add("checkbox", undefined, "Slugify layer names for folders");
    // dlgMain.cbSlugify.value = exportInfo.slugify;

    dlgMain.cbRetinaResolution = dlgMain.grpThirdLine.add("checkbox", undefined, "Export full resolution layers");
    dlgMain.cbRetinaResolution.value = exportInfo.saveRetinaResolution;

    dlgMain.cbPickletTemplate = dlgMain.grpThirdLine.add("checkbox", undefined, strPickletTemplate);
    dlgMain.cbPickletTemplate.value = exportInfo.savePickletTemplate;
    
    dlgMain.cbExportOrangeAs8Bit = dlgMain.grpThirdLine.add("checkbox", undefined, "Export Orange layers as 8bit PNG files");
    dlgMain.cbExportOrangeAs8Bit.value = exportInfo.exportOrangeAs8Bit;

    // -- the fourth line in the dialog
    // dlgMain.etFileNamePrefix = dlgMain.grpTopLeft.add("edittext", undefined, exportInfo.fileNamePrefix.toString());
    // dlgMain.etFileNamePrefix.alignment = 'fill';
    // dlgMain.etFileNamePrefix.preferredSize.width = StrToIntWithDefault(stretDestination, 160);

    // -- the fifth line in the dialog
    // dlgMain.cbSelection = dlgMain.grpTopLeft.add("checkbox", undefined, strCheckboxSelectionOnly);
    // dlgMain.cbSelection.value = exportInfo.selectionOnly;

    // -- the sixth line is the panel
    // dlgMain.pnlFileType = dlgMain.grpFirstLine.add("panel", undefined, strLabelFileType);
    // dlgMain.pnlFileType.alignment = 'fill';

    // -- now a dropdown list
    // dlgMain.ddFileType = dlgMain.pnlFileType.add("dropdownlist");
    // dlgMain.ddFileType.preferredSize.width = StrToIntWithDefault(strddFileType, 100);
    // dlgMain.ddFileType.alignment = 'left';
    //
    // dlgMain.ddFileType.add("item", "BMP");
    // dlgMain.ddFileType.add("item", "JPEG");
    // dlgMain.ddFileType.add("item", "PDF");
    // dlgMain.ddFileType.add("item", "PSD");
    // dlgMain.ddFileType.add("item", "Targa");
    // dlgMain.ddFileType.add("item", "TIFF");
    // dlgMain.ddFileType.add("item", "PNG");

/*
    dlgMain.ddFileType.onChange = function() {
        hideAllFileTypePanel();
        switch (this.selection.index) {
        case bmpIndex:
            dlgMain.pnlFileType.pnlOptions.text = strBMPOptions;
            dlgMain.pnlFileType.pnlOptions.grpBMPOptions.show();
            break;
        case jpegIndex:
            dlgMain.pnlFileType.pnlOptions.text = strJPEGOptions;
            dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.show();
            break;
        case tiffIndex:
            dlgMain.pnlFileType.pnlOptions.text = strTIFFOptions;
            dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.show();
            break;
        case pdfIndex:
            dlgMain.pnlFileType.pnlOptions.text = strPDFOptions;
            dlgMain.pnlFileType.pnlOptions.grpPDFOptions.show();
            break;
        case targaIndex:
            dlgMain.pnlFileType.pnlOptions.text = strTargaOptions;
            dlgMain.pnlFileType.pnlOptions.grpTargaOptions.show();
            break;
        case pngIndex:
            dlgMain.pnlFileType.pnlOptions.text = strPNGOptions;
            dlgMain.pnlFileType.pnlOptions.grpPNGOptions.show();
            break;
        case psdIndex:
        default:
            dlgMain.pnlFileType.pnlOptions.text = strPSDOptions;
            dlgMain.pnlFileType.pnlOptions.grpPSDOptions.show();
            break;
        }
    };

    dlgMain.ddFileType.items[exportInfo.fileType].selected = true;

    // -- now after all the radio buttons
    dlgMain.cbIcc = dlgMain.pnlFileType.add("checkbox", undefined, strCheckboxIncludeICCProfile);
    dlgMain.cbIcc.value = exportInfo.icc;
    dlgMain.cbIcc.alignment = 'left';

    // -- now the options panel that changes
    dlgMain.pnlFileType.pnlOptions = dlgMain.pnlFileType.add("panel", undefined, "Options");
    dlgMain.pnlFileType.pnlOptions.alignment = 'fill';
    dlgMain.pnlFileType.pnlOptions.orientation = 'stack';
    dlgMain.pnlFileType.pnlOptions.preferredSize.height = StrToIntWithDefault(strpnlOptions, 100);

    // PSD options
    dlgMain.pnlFileType.pnlOptions.grpPSDOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpPSDOptions.cbMax = dlgMain.pnlFileType.pnlOptions.grpPSDOptions.add("checkbox", undefined, strCheckboxMaximizeCompatibility);
    dlgMain.pnlFileType.pnlOptions.grpPSDOptions.cbMax.value = exportInfo.psdMaxComp;

    // JPEG options
    dlgMain.pnlFileType.pnlOptions.grpJPEGOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.add("statictext", undefined, strLabelQuality);
    dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality = dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.add("edittext", undefined, exportInfo.jpegQuality.toString());
    dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality.preferredSize.width = StrToIntWithDefault(stretQuality, 30);

    // TIFF options
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.orientation = 'column';

    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression = dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.alignment = 'left';
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.add("statictext", undefined, strLabelImageCompression);


    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression = dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.add("dropdownlist");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.add("item", strNone);
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.add("item", "LZW");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.add("item", "ZIP");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.add("item", "JPEG");

    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.onChange = function() {
        if (this.selection.index == compJPEGIndex) {
            dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.stQuality.enabled = true;
            dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.etQuality.enabled = true;
        } else {
            dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.stQuality.enabled = false;
            dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.etQuality.enabled = false;
        }
    };

    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality = dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.alignment = 'left';
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.stQuality = dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.add("statictext", undefined, strLabelQuality);
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.etQuality = dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.add("edittext", undefined, exportInfo.tiffJpegQuality.toString());
    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.etQuality.preferredSize.width = StrToIntWithDefault(stretQuality, 30);

    var index;
    switch (exportInfo.tiffCompression) {
    case TIFFEncoding.NONE:
        index = compNoneIndex;
        break;
    case TIFFEncoding.TIFFLZW:
        index = compLZWIndex;
        break;
    case TIFFEncoding.TIFFZIP:
        index = compZIPIndex;
        break;
    case TIFFEncoding.JPEG:
        index = compJPEGIndex;
        break;
    default:
        index = compNoneIndex;
        break;
    }

    dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpCompression.ddCompression.items[index].selected = true;

    if (TIFFEncoding.JPEG != exportInfo.tiffCompression) {
        // if not JPEG
        dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.stQuality.enabled = false;
        dlgMain.pnlFileType.pnlOptions.grpTIFFOptions.grpQuality.etQuality.enabled = false;
    }


    // PDF options
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.orientation = 'column';

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.alignment = 'left';
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.add("statictext", undefined, strLabelEncoding);

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbZip = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.add("radiobutton", undefined, "ZIP");
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbZip.onClick = function() {
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.stQuality.enabled = false;
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.etQuality.enabled = false;
    };

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbJpeg = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.add("radiobutton", undefined, "JPEG");
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbJpeg.onClick = function() {
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.stQuality.enabled = true;
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.etQuality.enabled = true;
    };

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.alignment = 'left';

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.stQuality = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.add("statictext", undefined, strLabelQuality);

    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.etQuality = dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.add("edittext", undefined, exportInfo.pdfJpegQuality.toString());
    dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.etQuality.preferredSize.width = StrToIntWithDefault(stretQuality, 30);

    switch (exportInfo.pdfEncoding) {
    case PDFEncoding.PDFZIP:
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbZip.value = true;
        break;
    case PDFEncoding.JPEG:
    default:
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpCompression.rbJpeg.value = true;
        break;
    }

    if (PDFEncoding.JPEG != exportInfo.pdfEncoding) {
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.stQuality.enabled = false;
        dlgMain.pnlFileType.pnlOptions.grpPDFOptions.grpQuality.etQuality.enabled = false;
    }

    // Targa options
    dlgMain.pnlFileType.pnlOptions.grpTargaOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpTargaOptions.add("statictext", undefined, strLabelDepth);

    dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb16bit = dlgMain.pnlFileType.pnlOptions.grpTargaOptions.add("radiobutton", undefined, strRadiobutton16bit);
    dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb24bit = dlgMain.pnlFileType.pnlOptions.grpTargaOptions.add("radiobutton", undefined, strRadiobutton24bit);
    dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb32bit = dlgMain.pnlFileType.pnlOptions.grpTargaOptions.add("radiobutton", undefined, strRadiobutton32bit);

    switch (exportInfo.targaDepth) {
    case TargaBitsPerPixels.SIXTEEN:
        dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb16bit.value = true;
        break;
    case TargaBitsPerPixels.TWENTYFOUR:
        dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb24bit.value = true;
        break;
    case TargaBitsPerPixels.THIRTYTWO:
        dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb32bit.value = true;
        break;
    default:
        dlgMain.pnlFileType.pnlOptions.grpTargaOptions.rb24bit.value = true;
        break;
    }


    // PNG options
    dlgMain.pnlFileType.pnlOptions.grpPNGOptions = dlgMain.pnlFileType.pnlOptions.add("group");

    // BMP options
    dlgMain.pnlFileType.pnlOptions.grpBMPOptions = dlgMain.pnlFileType.pnlOptions.add("group");
    dlgMain.pnlFileType.pnlOptions.grpBMPOptions.add("statictext", undefined, strLabelDepth);

    dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb16bit = dlgMain.pnlFileType.pnlOptions.grpBMPOptions.add("radiobutton", undefined, strRadiobutton16bit);
    dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb24bit = dlgMain.pnlFileType.pnlOptions.grpBMPOptions.add("radiobutton", undefined, strRadiobutton24bit);
    dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb32bit = dlgMain.pnlFileType.pnlOptions.grpBMPOptions.add("radiobutton", undefined, strRadiobutton32bit);

    switch (exportInfo.bmpDepth) {
    case BMPDepthType.SIXTEEN:
        dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb16bit.value = true;
        break;
    case BMPDepthType.TWENTYFOUR:
        dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb24bit.value = true;
        break;
    case BMPDepthType.THIRTYTWO:
        dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb32bit.value = true;
        break;
    default:
        dlgMain.pnlFileType.pnlOptions.grpBMPOptions.rb24bit.value = true;
        break;
    }
*/

    // -- group fourth line
    dlgMain.grpFourthLine = dlgMain.grpTop.add("group");
    dlgMain.grpFourthLine.orientation = 'row';
    dlgMain.grpFourthLine.alignChildren = 'right';
    dlgMain.grpFourthLine.alignment = 'right';

    // // the right side of the dialog, the ok and cancel buttons
    // dlgMain.grpTopRight = dlgMain.grpTop.add("group");
    // dlgMain.grpTopRight.orientation = 'column';
    // dlgMain.grpTopRight.alignChildren = 'fill';

    dlgMain.btnDocs = dlgMain.grpFourthLine.add("button", undefined, "Browse documentation");
    dlgMain.btnDocs.onClick = function() {
      openURL('http://picklet.net/picklet-export/');
    };

    dlgMain.btnRun = dlgMain.grpFourthLine.add("button", undefined, strButtonRun);
    dlgMain.btnRun.onClick = function() {
        // check if the setting is properly
        var destination = dlgMain.etDestination.text;
        if (destination.length == 0) {
            alert(strAlertSpecifyDestination);
            return;
        }
        var testFolder = new Folder(destination);
        if (!testFolder.exists) {
            alert(strAlertDestinationNotExist);
            return;
        }

        dlgMain.close(runButtonID);
    };

    dlgMain.btnCancel = dlgMain.grpFourthLine.add("button", undefined, strButtonCancel);
    dlgMain.btnCancel.onClick = function() {
        dlgMain.close(cancelButtonID);
    };

    dlgMain.defaultElement = dlgMain.btnRun;
    dlgMain.cancelElement = dlgMain.btnCancel;

    // the bottom of the dialog
    dlgMain.grpBottom = dlgMain.add("group");
    dlgMain.grpBottom.orientation = 'column';
    dlgMain.grpBottom.alignChildren = 'left';
    dlgMain.grpBottom.alignment = 'fill';

    dlgMain.pnlHelp = dlgMain.grpBottom.add("panel");
    dlgMain.pnlHelp.alignment = 'fill';

    dlgMain.etHelp = dlgMain.pnlHelp.add("statictext", undefined, strHelpText, {
        multiline: true
    });
    dlgMain.etHelp.alignment = 'fill';

    dlgMain.copyright = dlgMain.grpBottom.add("statictext", undefined, strScriptName + " " + strRevisionNumber + " " + strCopyrightNotice);


    dlgMain.onShow = function() {
        // dlgMain.ddFileType.onChange();
    };

    // in case we double clicked the file
    app.bringToFront();

    dlgMain.center();

    var result = dlgMain.show();

    if (cancelButtonID == result) {
        return result;
        // close to quit
    }

    // get setting from dialog
    exportInfo.destination = dlgMain.etDestination.text;
    // exportInfo.fileNamePrefix = dlgMain.etFileNamePrefix.text;
    exportInfo.exportThumbnails = dlgMain.cbExportThumbnails.value;
    exportInfo.exportCovers = dlgMain.cbExportCovers.value;
    exportInfo.selectionOnly = dlgMain.cbSelection.value;
    exportInfo.saveRetinaResolution = dlgMain.cbRetinaResolution.value;
    exportInfo.slugify = true; //dlgMain.cbSlugify.value;
    exportInfo.exportSelectedFullsize = dlgMain.cbExportFullsize.value;
    exportInfo.savePickletTemplate = dlgMain.cbPickletTemplate.value;
    exportInfo.exportOrangeAs8Bit = dlgMain.cbExportOrangeAs8Bit.value;

    // exportInfo.fileType = dlgMain.ddFileType.selection.index;
    // exportInfo.icc = dlgMain.cbIcc.value;
    // exportInfo.jpegQuality = dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality.text;
    // exportInfo.psdMaxComp = dlgMain.pnlFileType.pnlOptions.grpPSDOptions.cbMax.value;

    return result;
}

///////////////////////////////////////////////////////////////////////////////
// Function: initExportInfo
// Usage: create our default parameters
// Input: a new Object
// Return: a new object with params set to default
///////////////////////////////////////////////////////////////////////////////
function initExportInfo(exportInfo)
 {
    exportInfo.destination = new String("");
    exportInfo.fileNamePrefix = new String("untitled_");
    exportInfo.selectionOnly = false;
    exportInfo.exportThumbnails = true;
    exportInfo.fileType = pngIndex; //psdIndex;
    exportInfo.saveRetinaResolution = true;
    exportInfo.exportCovers = true;
    exportInfo.savePickletTemplate = true;
    exportInfo.exportSelectedFullsize = true;
    exportInfo.exportOrangeAs8Bit = true;
    // exportInfo.icc = true;
    //exportInfo.jpegQuality = 8;
    //exportInfo.psdMaxComp = true;
    //exportInfo.tiffCompression = TIFFEncoding.NONE;
    //exportInfo.tiffJpegQuality = 8;
    //exportInfo.pdfEncoding = PDFEncoding.JPEG;
    //exportInfo.pdfJpegQuality = 8;
    //exportInfo.targaDepth = TargaBitsPerPixels.TWENTYFOUR;
    //exportInfo.bmpDepth = BMPDepthType.TWENTYFOUR;

    try {
        exportInfo.destination = Folder(app.activeDocument.fullName.parent).fsName;
        // destination folder
        var tmp = app.activeDocument.fullName.name;
        exportInfo.fileNamePrefix = decodeURI(tmp.substring(0, tmp.indexOf(".")));
        // filename body part
    } catch(someError) {
        exportInfo.destination = new String("");
        exportInfo.fileNamePrefix = app.activeDocument.name;
        // filename body part
    }
}


///////////////////////////////////////////////////////////////////////////////
// Function: saveFile
// Usage: the worker routine, take our params and save the file accordingly
// Input: reference to the document, the name of the output file,
//        export info object containing more information
// Return: <none>, a file on disk
///////////////////////////////////////////////////////////////////////////////
function saveFile(docRef, fileNameBody, exportInfo)
 {
    switch (exportInfo.fileType) {
    case pngIndex:
        var filename;
        // var tempFolder = new Folder (exportInfo.destination  + "/" + filenamePrefix);
        // tempFolder.create();
        var lastIndex = fileNameBody.lastIndexOf('/');
        var directory = fileNameBody.substring(0, lastIndex);
        var filename = fileNameBody.substring(lastIndex);
        if (filename.length >= 24) {
          // filename = toplevelFolder + "/" + fileNameBody.substring(0, 23) + filenameSuffix;
          filename = filename.substring(0, 23) + filenameSuffix;
        } else {
          // filename = toplevelFolder + "/" + fileNameBody + filenameSuffix;
          filename = filename + filenameSuffix;
        }
        var saveFile = new File(toplevelFolder + "/" + directory + filename + ".png");

        pngSaveOptions = new ExportOptionsSaveForWeb();
        pngSaveOptions.format = SaveDocumentType.PNG;
        pngSaveOptions.interlaced = false;
        pngSaveOptions.quality = 100;
        //if (fileNameBody.indexOf("_24bit") == -1) {
          //pngSaveOptions.PNG8 = true;
          //pngSaveOptions.transparency = false;
          //pngSaveOptions.colors = 256;
          //pngSaveOptions.matte = MatteType.FOREGROUND;
          //pngSaveOptions.matte = MatteType.BLACK;
          //pngSaveOptions.matteColor = MatteType.BACKGROUND;
          //pngSaveOptions.includeProfile = false;
          //pngSaveOptions.optimized = true;
        //} else {
          var str8bit = '';
          if (exportInfo.exportOrangeAs8Bit && (getLayerPropertiesColor() == '1332899431')) {
            pngSaveOptions.PNG8 = true;
            str8bit = ' 8bit'
          } else {
            pngSaveOptions.PNG8 = false;
          }
          pngSaveOptions.transparency = true;
        //}
        if (saveFile.exists) saveFile.remove();
        docRef.exportDocument(saveFile, ExportType.SAVEFORWEB, pngSaveOptions);

        var savefile_error = false;

        var size_warning = '';
        var file_size = saveFile.length;
        if (saveFile.length > 1000000) {
          size_warning = ' * file size must be < 1000000 Bytes';
          //savefile_error = true;
        }

        var dimensions_warning = '';
        var SB = docRef.activeLayer.bounds;
        var width = parseInt(SB[2] - SB[0], 10);
        var height = parseInt(SB[3] - SB[1], 10);
        // output_log += '(' + parseInt(width, 10) + ', ' + parseInt(height, 10) + ')';
        if (width*height > 3*1024*1024) {
          dimensions_warning = ' * layer dimensions (' + width + 'x' + height + ') exceed limit (3145728)';
          savefile_error = true;
        }

        var name_warning = '';
        if (typeof files_saved[saveFile] != 'undefined') {
          name_warning = ' * file removed - layer name collision'
          files_saved[saveFile] = 'collision';
          savefile_error = true;
        } else {
          files_saved[saveFile] = 'ok';
        }

        var status_message = '';
        if (savefile_error) {
          if (saveFile.exists) {
            saveFile.remove();
          }
          status_message = 'error: ';
          var msg = slugify(exportInfo.fileNamePrefix) + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit;
          var index = output_status['failed'].push(msg)
        } else {
          status_message = 'saved: ';
          var msg = slugify(exportInfo.fileNamePrefix) + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit;
          output_status['saved'].push(msg)
        }

        output_log += status_message + exportInfo.fileNamePrefix + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit + '\n';

        // if (fileNameBody.length >= 24) {
          // saveFile.rename(filename + filenameSuffix + ".png");
        // }
        break;
    default:
        if (DialogModes.NO != app.playbackDisplayDialogs) {
          alert(strUnexpectedError);
        }
        break;
    }
}
///////////////////////////////////////////////////////////////////////////////
// Function: zeroSuppress
// Usage: return a string padded to digit(s)
// Input: num to convert, digit count needed
// Return: string padded to digit length
///////////////////////////////////////////////////////////////////////////////
function zeroSuppress(num, digit)
 {
    var tmp = num.toString();
    while (tmp.length < digit) {
        tmp = "0" + tmp;
    }
    return tmp;
}


///////////////////////////////////////////////////////////////////////////////
// Function: objectToDescriptor
// Usage: create an ActionDescriptor from a JavaScript Object
// Input: JavaScript Object (o)
//        Pre process converter (f)
// Return: ActionDescriptor
// NOTE: Only boolean, string, and number are supported, use a pre processor
//       to convert (f) other types to one of these forms.
///////////////////////////////////////////////////////////////////////////////
function objectToDescriptor(o, f) {
    if (undefined != f) {
        o = f(o);
    }
    var d = new ActionDescriptor;
    var l = o.reflect.properties.length;
    for (var i = 0; i < l; i++) {
        var k = o.reflect.properties[i].toString();
        if (k == "__proto__" || k == "__count__" || k == "__class__" || k == "reflect")
        continue;
        var v = o[k];
        k = app.stringIDToTypeID(k);
        switch (typeof(v)) {
        case "boolean":
            d.putBoolean(k, v);
            break;
        case "string":
            d.putString(k, v);
            break;
        case "number":
            d.putDouble(k, v);
            break;
        default:
            throw (new Error("Unsupported type in objectToDescriptor " + typeof(v) + " " + o.reflect.properties[i].toString()));
        }
    }
    return d;
}


///////////////////////////////////////////////////////////////////////////////
// Function: descriptorToObject
// Usage: update a JavaScript Object from an ActionDescriptor
// Input: JavaScript Object (o), current object to update (output)
//        Photoshop ActionDescriptor (d), descriptor to pull new params for object from
//        JavaScript Function (f), post process converter utility to convert
// Return: Nothing, update is applied to passed in JavaScript Object (o)
// NOTE: Only boolean, string, and number are supported, use a post processor
//       to convert (f) other types to one of these forms.
///////////////////////////////////////////////////////////////////////////////
function descriptorToObject(o, d, f) {
    if (! d) return;
    var l = d.count;
    for (var i = 0; i < l; i++) {
        var k = d.getKey(i);
        // i + 1 ?
        var t = d.getType(k);
        strk = app.typeIDToStringID(k);
        switch (t) {
        case DescValueType.BOOLEANTYPE:
            o[strk] = d.getBoolean(k);
            break;
        case DescValueType.STRINGTYPE:
            o[strk] = d.getString(k);
            break;
        case DescValueType.DOUBLETYPE:
            o[strk] = d.getDouble(k);
            break;
        case DescValueType.INTEGERTYPE:
        case DescValueType.ALIASTYPE:
        case DescValueType.CLASSTYPE:
        case DescValueType.ENUMERATEDTYPE:
        case DescValueType.LISTTYPE:
        case DescValueType.OBJECTTYPE:
        case DescValueType.RAWTYPE:
        case DescValueType.REFERENCETYPE:
        case DescValueType.UNITDOUBLE:
        default:
            throw (new Error("Unsupported type in descriptorToObject " + t));
        }
    }
    if (undefined != f) {
        o = f(o);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Function: preProcessExportInfo
// Usage: convert Photoshop enums to strings for storage
// Input: JavaScript Object of my params for this script
// Return: JavaScript Object with objects converted for storage
///////////////////////////////////////////////////////////////////////////////
function preProcessExportInfo(o) {
    // o.tiffCompression = o.tiffCompression.toString();
    // o.pdfEncoding = o.pdfEncoding.toString();
    // o.targaDepth = o.targaDepth.toString();
    // o.bmpDepth = o.bmpDepth.toString();
    return o;
}

///////////////////////////////////////////////////////////////////////////////
// Function: postProcessExportInfo
// Usage: convert strings from storage to Photoshop enums
// Input: JavaScript Object of my params in string form
// Return: JavaScript Object with objects in enum form
///////////////////////////////////////////////////////////////////////////////
function postProcessExportInfo(o) {
    // o.tiffCompression = eval(o.tiffCompression);
    // o.pdfEncoding = eval(o.pdfEncoding);
    // o.targaDepth = eval(o.targaDepth);
    // o.bmpDepth = eval(o.bmpDepth);
    return o;
}

///////////////////////////////////////////////////////////////////////////
// Function: StrToIntWithDefault
// Usage: convert a string to a number, first stripping all characters
// Input: string and a default number
// Return: a number
///////////////////////////////////////////////////////////////////////////
function StrToIntWithDefault(s, n) {
    var onlyNumbers = /[^0-9]/g;
    var t = s.replace(onlyNumbers, "");
    t = parseInt(t, 10);
    if (!isNaN(t)) {
        n = t;
    }
    return n;
}
// End Layer Comps To Files.jsx

