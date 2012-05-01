PickletDocument = function(w, h, n) {
  var width = w;
  var height = h;
  var name = n;

  return {
    width: width,
    height: height,
    name: name
  };
};

PickletExportController = function() {
  return {
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
    }
  };
};
