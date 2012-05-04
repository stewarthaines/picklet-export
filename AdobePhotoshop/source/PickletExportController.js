PickletExportController = function() {

  var strRevisionNumber = "r13";
  var strScriptName = "PickletExport.jsx";

  var PickletDocument = function(w, h, n) {
    var width = w;
    var height = h;
    var name = n;

    return {
      'width': width,
      'height': height,
      'name': name
    };
  };
  
  var thumbnails = {
    'width': 64,
    'height': 96,
    'name': 'thumbnails'
  };

  ///////////////////////////////////////////////////////////////////////////////
  // selectAllLayers - select all layers (Select > All Layers)
  ///////////////////////////////////////////////////////////////////////////////
  var selectAllLayers = function() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    var desc = new ActionDescriptor();
    desc.putReference(cTID('null'), ref);
    executeAction(sTID('selectAllLayers'), desc, DialogModes.NO);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // hideLayers - hide all selected layers (Layer > Hide Layers)
  ///////////////////////////////////////////////////////////////////////////////
  var hideLayers = function() {
    var ref = new ActionReference();
    ref.putEnumerated(cTID('Lyr '), cTID('Ordn'), cTID('Trgt'));
    var list = new ActionList();
    list.putReference(ref);
    var desc = new ActionDescriptor();
    desc.putList(cTID('null'), list);
    executeAction(cTID('Hd  '), desc, DialogModes.NO);
  }

  var cTID = function(s) {return app.charIDToTypeID(s);}
  var sTID = function(s) {return app.stringIDToTypeID(s);}

  var types = ['jpg', 'png', 'png'];

  var saveFile = function(docRef, filename, destination, options) {
    var extension = types[options.type];

    if (options.type == 1 || options.type == 2) {
      var file = new File(destination + '/' + filename + '.png');
      pngSaveOptions = new ExportOptionsSaveForWeb();
      pngSaveOptions.format = SaveDocumentType.PNG;
      pngSaveOptions.interlaced = false;
      pngSaveOptions.quality = 100;
      var str8bit = '';
      if (options.type == 1) {
        pngSaveOptions.PNG8 = true;
        str8bit = ' 8bit'
      } else {
        // 24 bit PNG
        pngSaveOptions.PNG8 = false;
      }
      pngSaveOptions.transparency = true;
      if (file.exists) file.remove();
      docRef.exportDocument(file, ExportType.SAVEFORWEB, pngSaveOptions);
    } else if (options.type == 0) {
      var file = new File(destination + '/' + filename + '.jpg');
      var jpgSaveOptions = new ExportOptionsSaveForWeb();
      jpgSaveOptions.quality = options.quality * 10;
      jpgSaveOptions.format = SaveDocumentType.JPEG;
      if (file.exists) file.remove();
      docRef.exportDocument(file, ExportType.SAVEFORWEB, jpgSaveOptions);
    }
    var savefile_error = false;

    var size_warning = '';
    var file_size = saveFile.length;
    if (saveFile.length > 1000000) {
      size_warning = ' * file size must be < 1000000 Bytes';
    }

    var dimensions_warning = '';
    var SB = docRef.activeLayer.bounds;
    var width = parseInt(SB[2] - SB[0], 10);
    var height = parseInt(SB[3] - SB[1], 10);
    if (width*height > 3*1024*1024) {
      dimensions_warning = ' * layer dimensions (' + width + 'x' + height + ') exceed limit (3145728)';
      savefile_error = true;
    }

    var name_warning = '';
/*
    if (typeof files_saved[saveFile] != 'undefined') {
      name_warning = ' * file removed - layer name collision'
      files_saved[saveFile] = 'collision';
      savefile_error = true;
    } else {
      files_saved[saveFile] = 'ok';
    }
*/
    var status_message = '';
    if (savefile_error) {
      if (saveFile.exists) {
        saveFile.remove();
      }
      status_message = 'error: ';
      // var msg = slugify(exportInfo.fileNamePrefix) + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit;
      // var index = output_status['failed'].push(msg)
    } else {
      status_message = 'saved: ';
      // var msg = slugify(exportInfo.fileNamePrefix) + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit;
      // output_status['saved'].push(msg)
    }
    // output_log += status_message + exportInfo.fileNamePrefix + '/' + directory + filename + '.png ' + file_size + ' bytes' + size_warning + name_warning + dimensions_warning + str8bit + '\n';
  }

  function initPickletFromDoc(docRef, docName) {
    var obj = {};
    docName = docName.replace(/\.psd/i, ""); // ignoring case

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

      var thumbnail_url = docName + '/thumbnails/' + name + '.png';
      obj.panels[compsIndex] = { "name": name, thumbnail: thumbnail_url, "layers": [] };

      // var fileNameBody = exportInfo.fileNamePrefix;

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

  var slugify = function(s) {
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

    return slug;
  };

  return {
    exportThumbnails: function(p) {
      // configuration passed as properties of 'p'
      // panels, doc, destination, name
      var panels = p.panels;
      var doc = p.doc;
      var destination = p.destination;

      if (!panels) return;

      doc.resizeImage(thumbnails.width, thumbnails.height);

      // make a folder called 'thumbnails' if it doesn't already exist
      var thumbnails_folder = new Folder (destination + "/" + thumbnails.name);
      if (! thumbnails_folder.exists) {
        thumbnails_folder.create();
      }

      var compsIndex;
      var compsCount = doc.layerComps.length;
      var options = {'type': 0, 'quality': 6};
      for (var p in panels) {
        var compRef = doc.layerComps[panels[p]];
        compRef.apply();
        saveFile(doc, compRef.name, thumbnails_folder, options);
      }
    },
    exportCovers: function(p) {
      var panels = p.panels;
      var doc = p.doc;
      var name = p.name;
      var destination = p.destination;
      var options = {
        'quality': p.quality,
        'type': p.type,
      };

      var pd = PickletDocument(640, 960, p.name);

      // FIXME:
      // check that there is a 'cover' layercomp.

      try {
        compRef = doc.layerComps['cover'];
      } catch (e) {
        // fallback to the first layer comp
        compRef = doc.layerComps[0];
      }
      compRef.apply();

      // so we don't spend time resizing a bunch of layers that aren't
      // part of the cover we apply the 'cover' layerComp then copy merged
      // to a new document and do the resizing and saving of that document

      doc.selection.selectAll();
      // copy merged
      doc.selection.copy(true);

      doc.selection.select([[0,0], [0,0], [0,0], [0,0]]);

      // create a new document
      var cover_doc = app.documents.add(pd.width, pd.height, 72 , "cover_tmp", NewDocumentMode.RGB, DocumentFill.WHITE, 1);
      app.activeDocument = cover_doc;
      try {
        cover_doc.activeLayer = cover_doc.layers[0];
        cover_doc.paste();

        // export fullsize cover
        saveFile(cover_doc, 'cover@2x', destination, options);

        // export original phone size
        cover_doc.resizeImage(pd.width / 2, pd.height / 2);
        saveFile(cover_doc, 'cover', destination, options);
      
        // export retina thumbail
        cover_doc.resizeImage(pd.width / 5, pd.height / 5);
        saveFile(cover_doc, 'cover_thumbnail@2x', destination, options);
      
        // export small thumbnail
        cover_doc.resizeImage(pd.width / 10, pd.height / 10);
        saveFile(cover_doc, 'cover_thumbnail', destination, options);
      } finally {
        cover_doc.close(SaveOptions.DONOTSAVECHANGES);
      }
    },
    exportLayers: function(p) {
      var doc = p.doc;
      var panels = p.panels;
      var destination = p.destination;
      var slug =  p.slug;
      var prefix = p.prefix;

      var compsIndex;
      var compsCount = doc.layerComps.length;

      for (var p = 0; p < panels.length; p++) {
        var compRef = doc.layerComps[panels[p]];

        var name = compRef.name;

        var layerSet = null;
        if (name == 'cover'){
          // handle 'cover' layer set elsewhere
          continue;
        } else {
          try {
            layerSet = doc.layerSets[name].layers;
          } catch(e) {
            alert("No Layer Set matching Layer Comp named '" + name + "' found.");
            return "cancel";
          }
        }
        
        if (layerSet.length == 0) {
          // ignore layer sets that have no child layers
          continue;
        }

        // make another copy of the duplicateRef because we're going to 
        // delete some layers
        docRef = doc.duplicate();

        layerSet = docRef.layerSets[name].layers;

        // delete other layerSets than the one being exported (optimisation for speed)
        for (var otherLayer = docRef.layerSets.length - 1; otherLayer >= 0; otherLayer--) {
          if (name != docRef.layerSets[otherLayer].name) {
            if (docRef.layerSets[otherLayer].length > 0) {
              // if the layer set has children remove it
              docRef.layerSets[otherLayer].remove();
            }
          }
        }

        var fileNameBody = slug; //exportInfo.fileNamePrefix;

        var folder;

        if (prefix && prefix != '') {
          folder = new Folder(destination + '/' + name + prefix);
        } else {
          folder = new Folder (destination + '/' + name);
        }
        if (!folder.exists) {
          folder.create();
        }

        compRef.apply();

        var layerIndex;
        for (layerIndex = 0; layerIndex < layerSet.length; layerIndex++) {

            app.activeDocument = docRef;

            docRef.activeLayer = layerSet[layerIndex];
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

            var filename =docRef.activeLayer.name;
            // if (exportInfo.slugify) {
            filename = slugify(filename);
            // }
            saveFile(docRef, filename, folder);
        }
        docRef.close(SaveOptions.DONOTSAVECHANGES);
      }
    },
    exportJSON: function(p) {
      // doc, destination, slug, json_filename
      var destination = p.destination;
      var doc = p.doc;
      var slug = p.slug;
      var json_filename = p.json_filename;

      var pickletText = new File(destination + '/' + json_filename);
      pickletText.open('w');
      var picklet = initPickletFromDoc(doc, slug);
      var output = unescape(JSON.stringify(picklet, null, 2).replace(/\\u/g, '%u'));
      pickletText.write(output);
      pickletText.close();
    },
    createPicklet: function(p) {
      // expects these vars in 'p'
      var panel_count = p.count;
      var name = p.name;
      var guides = p.guides;
      var save = p.save;
      
      var pd = new PickletDocument(640, 960, name);

      var docRef = app.documents.add(pd.width, pd.height, 72, name);
      app.activeDocument = docRef;

      if (guides) {
    /*
        // CS5 and later only
        var guides = docRef.guides;
        guides.add(Direction.HORIZONTAL, 40);
        guides.add(Direction.HORIZONTAL, 128);
        guides.add(Direction.HORIZONTAL, 772);
    */
        var layerRef = docRef.artLayers.add();
        layerRef.name = 'region_guide';
        layerRef.blendMode = BlendMode.NORMAL;

        var blackColor = new SolidColor();
        blackColor.rgb.red = 0;
        blackColor.rgb.green = 0;
        blackColor.rgb.blue = 0;

        // create a grey status bar
        docRef.selection.select([[0,0], [pd.width,0], [pd.width,40], [0,40]]);
        docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 35, false);

        // create a block representing the nav controls
        docRef.selection.select([[0,40], [pd.width,40], [pd.width,128], [0,128]]);
        docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 25, false);

        // create a block representing the slider on home screen dimensions
        docRef.selection.select([[0,772], [pd.width,772], [pd.width,pd.height], [0,pd.height]]);
        docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 12, false);
        
        // create a block representing the start position of the slider
        docRef.selection.select([[440,772], [pd.width,772], [pd.width,pd.height], [440,pd.height]]);
        docRef.selection.fill(blackColor, ColorBlendMode.NORMAL, 25, false);

        docRef.selection.select([]);
      }

      var workingSetRef = docRef.layerSets.add();
      workingSetRef.name = 'working';

      if (guides) {
        // Move the new layer to the end of the working layer
        layerRef.move(workingSetRef, ElementPlacement.PLACEATEND);
      }

    /*
      // set some document info properties
      docInfoRef = docRef.info;
      docInfoRef.copyrighted = CopyrightedType.COPYRIGHTEDWORK;
      //docInfoRef.ownerUrl = "http://picklet.net";
    */
      var previousSetRef;
      for (var count = 1; count <= panel_count; count++) {
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
      if (save) {
        try {
          executeAction( charIDToTypeID( "save" ), undefined, DialogModes.ALL );
        } catch(e) {
          // just notification that user cancelled 'save'
        }
      }
    },
    slugify: function(s) { slugify(s); }
  };
};
