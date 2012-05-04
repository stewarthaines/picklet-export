PickletExportView = function() {

  // these language names get localized, with unicode text pulled from external file
  var LC_LANGUAGES = [
    {'code': 'en', 'name': 'English'},
    {'code': 'fr', 'name': 'French'},
    {'code': 'zh', 'name': 'Standard Chinese'}
  ];

  var main_window;
  var save_units;
  var close_btn;

  // sidebar
  var actions_list;
  var group_action;

  // help panel
  var update_btn;
  var documentation_btn;
  var script_btn;
  
  var create_btn;
  var picklet_title_txt;
  var panel_count_txt;
  var guides_checkbox;
  var save_checkbox;

  var optimize_btn;
  
  var group_create;
  var group_export;
  var group_optimize;
  var group_help;
  var group_log;
  
  var groups = {
    'create': null,
    'export': null,
    'optimize': null,
    'help': null,
    'log': null
  };

  // export group
  var export_btn;
  
  var language_list;
  
  // optimize group
  var layer_export_btn;

  var json_locale_data;

  var document_name = 'dummy_name';

  var global_options = new CustomOptions('Picklet-Settings');
  var document_options;

  // $.locale is something like 'en_AU' we just want 'en'
  var default_language = $.locale.replace(/^([a-z]{2})_([A-Z]{2}).*$/, '$1');

  // get the global_options language, fallback to LOCALE language
  selected_language = global_options.get('language', default_language);

  var gt;
  
  var previous_action = 0;

  var controller = new PickletExportController();

  function _(msgid) {
      return gt.gettext(msgid);
  }

  var ElementMap = function(el) {
    var obj = {};
    // var out = 'Check this\n';
    // walk the el.children tree, gathering named elements
    // essentially pulling a flat map of names to elements from
    // the messy hierarchy of resource elements
    var addNamedChildrenToObj = function (el, obj) {
      if (el.name) {obj[el.name] = el; /*out+=el.name+'\n';*/}
      if (!el.children) return;
      for (var i = 0; i < el.children.length; i++) {
        addNamedChildrenToObj(el.children[i], obj);
      }
    };
    addNamedChildrenToObj(el, obj);
    // alert(out);
    return obj;
  };

  var createPicklet = function() {
    var properties = {
      'count': panel_count_txt.text,
      'name': picklet_title_txt.text,
      'guides': guides_checkbox.value,
      'save': save_checkbox.value
    };
    put_options();
    main_window.close();
    controller.createPicklet(properties);
  };

  var doExport = function() {
    // duplicate the document because it's going to get changed
    var destination = destination_txt.text;
    if (slug_checkbox.value) {
      destination += '/' + slug_input_txt.text;
    }
    var folder = new Folder(destination);
    if (!folder.exists) {
      folder.create();
    }
    var path_components = destination.split('/');
    var slug = path_components[path_components.length - 1];
    put_options();
    main_window.close();
    if (!covers_checkbox.value
      && !layers_checkbox.value
      && !template_checkbox.value
      && !thumbnails_checkbox.value) {
        // there's nothing to do
      } else {
        try {
          var duplicate;
          if (covers_checkbox.value) {
            // use original document because exportCovers() won't modify it
            if (!duplicate) duplicate = app.activeDocument.duplicate();
            var properties = {
              'panels': panels_list.selection,
              'doc': duplicate,
              'destination': destination,
              'name': document_name,
              'type': image_types_list.selection.index,
              'quality': cover_quality_txt.text,
            };
            controller.exportCovers(properties);
          }
          if (layers_checkbox.value) {
            // duplicate the active document because exportLayers() is going to mess with it
            // FIXME:
            // log and display this condition
            if (!panels_list.selection) return;

            if (!duplicate) duplicate = app.activeDocument.duplicate();
            var properties = {
              'panels': panels_list.selection,
              'doc': duplicate,
              'destination': destination,
              'slug': slug,
            };
            if (fullsize_checkbox.value) {
              properties['prefix'] = '/x2';
              controller.exportLayers(properties);
            }
            duplicate.resizeImage(320, 480);
            properties['prefix'] = '';
            controller.exportLayers(properties);
          }
          if (template_checkbox.value) {
            var properties = {
              'doc': app.activeDocument,
              'destination': destination,
              'json_filename': template_name_txt.text,
              'slug': slug,
            };
            controller.exportJSON(properties);
          }
          if (thumbnails_checkbox.value) {
            // only create a new duplicate if it wasn't created for layers export
            if (!duplicate) duplicate = app.activeDocument.duplicate();
            var properties = {
              'panels': panels_list.selection,
              'doc': duplicate,
              'destination': destination,
              'name': document_name,
            };
            controller.exportThumbnails(properties);
          }
        } catch(e) {
          // alert(e);
          alert('Error\n ' + e.fileName + ' line ' + e.line + '\n' + e.message);
        } finally {
          if (duplicate) {
            duplicate.close(SaveOptions.DONOTSAVECHANGES);
          }
        }
      }
  };

  var getDestination = function() {
    var prompt = _("Export picklet files to");

    var testFolder = new Folder(destination_txt.text);
    if (destination_txt.text == '' || !testFolder.exists) destination_txt.text = "~";
    var selFolder = Folder.selectDialog(prompt, destination_txt.text);
    if (selFolder != null) {
        destination_txt.text = selFolder.fsName;
    }
    main_window.defaultElement.active = true;
  };

  var closeWindow = function() {
    put_options();
    main_window.close();
  };

  var changeLanguage = function() {
    selected_language = language_list.selection.code;
    reset();
  };
  
  var getLayerCompSelection = function() {
    var selection = [];
    if (app.documents.length > 0) {
      for (var i = 0; i < app.activeDocument.layerComps.length; i++) {
        comp = app.activeDocument.layerComps[i];
        if (comp.selected) {
          selection[selection.length] = comp.name;
        }
      }
    }
    return selection;
  };


  var contains = function(a, obj) {
      var i = a.length;
      while (i--) {
         if (a[i] === obj) {
             return true;
         }
      }
      return false;
  };
  
  var initPanelsList = function() {
    // use either the panel selection from last run
    // or, if the layercomp selection has changed use that.
    var stored_comp_selection = document_options.get('layer_comp_selection', '');
    var selection = getLayerCompSelection();
    var use_current = false;
    if (stored_comp_selection != selection.join(',')) {
      // layercomp selection changed. use it.
      use_current = true;
    }
    var stored_panel_selection = document_options.get('panel_selection', stored_comp_selection);
    
    // show an entry in this dropdown list for each layer comp (ignore 'cover')
    var item;
    if (app.documents.length > 0 && app.activeDocument) {
      var comp;
      var selected = [];
      var stored_panels = stored_panel_selection.split(',');
      for (var i = 0; i < app.activeDocument.layerComps.length; i++) {
        comp = app.activeDocument.layerComps[i];
        if (comp.name != 'cover') { // ignore 'cover' layer comp
          item = panels_list.add('item', comp.name);
          if (use_current) {
            if (comp.selected) {
              selected[selected.length] = item;
            }
          } else {
            if (contains(stored_panels, comp.name)) {
              selected[selected.length] = item;
            }
          }
        }
      }
      panels_list.selection = selected;
    } else {
      item = panels_list.add('item', 'No panels');
      panels_list.enabled = false;
      // panels_list.selection = item; // should be persisted in document_options
    }
  };

  var updatePanelsList = function() {
/*    for (var i = 0; i < app.activeDocument.layerComps.length; i++) {
      if (indexOf(panels_list.selection, app.activeDocument.layerComps[i].name) != -1) {
        // app.activeDocument.layerComps[i].selected = true;
      } else {
        // app.activeDocument.layerComps[i].selected = false;
      }
    }*/
  };
  
  var getCreateGroup = function() {
    if (groups['create']) return groups['create'];

    var group = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    visible:false,\
    panel:Panel{\
      minimumSize:[300,100],\
      margins:[5, 16, 5, 10],\
      alignChildren:'right',\
      title:Group{\
        label_title:StaticText{name:'title_label'},\
        title:EditText{name:'title_txt',characters:25,active:true},\
      },\
      panel_count:Group{\
        label_panel_count:StaticText{name:'panel_count_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_title:EditText{characters:25,visible:false},\
          text_panel_count:EditText{name:'text_panel_count',characters:4,alignment:'left'},\
        },\
      },\
      guides:Group{\
        label_guides:StaticText{name:'guides_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_title:EditText{characters:25,visible:false},\
          checkbox:Checkbox{name:'guides_checkbox',alignment:'left'},\
        }\
      },\
      save:Group{\
        label:StaticText{name:'save_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_save:EditText{characters:25,visible:false},\
          checkbox:Checkbox{name:'save_checkbox',alignment:'left'},\
        }\
      },\
      button:Button{name:'create_btn',alignment:'right'},\
    }}");

    var e = ElementMap(group);

    /// label for the group relating to the 'Create' action
    group.panel.text = _("New document");

    /// label for input to give new document a title
    e.title_label.text = _("Picklet title:");

    picklet_title_txt = e.title_txt;

    /// default title for picklet
    picklet_title_txt.text = _("Untitled Picklet");

    panel_count_txt = e.text_panel_count;
    panel_count_txt.text = '1';

    /// label for input to specify number of panels to create in new document
    e.panel_count_label.text = _("Number of panels:");

    /// label for option to draw guides in the newly created document
    e.guides_label.text = _("Include guides:");

    guides_checkbox = e.guides_checkbox;
    guides_checkbox.value = global_options.get('include_guides', true);

    /// label for option to prompt the user to save the newly created document
    e.save_label.text = _("Prompt to save:");

    save_checkbox = e.save_checkbox;
    save_checkbox.value = global_options.get('prompt_save', true);

    create_btn = e.create_btn;
    create_btn.addEventListener('click', createPicklet);

    /// label for button to create a new picklet document
    create_btn.text = _("Create");
    
    groups['create'] = group;
    return group;
  };
  
  var getExportGroup = function() {
    if (groups['export']) return groups['export'];
    var group = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    visible:false,\
    panel:Panel{\
      name:'panel',\
      minimumSize:[300,300],\
      margins:[5, 16, 5, 10],\
      group0:Group{\
        orientation:'row',\
        alignChildren:'top',\
        group0:Group{\
          orientation:'column',\
          group0:Group{\
            orientation:'row',\
            alignment:'left',\
            cover_check:Checkbox{name:'cover_check'},\
            list:DropDownList{name:'image_types_list'},\
            input:EditText{name:'cover_quality',characters:4},\
          }\
          group2:Group{\
            orientation:'row',\
            alignment:'left',\
            template_check:Checkbox{name:'template_check'},\
            input:EditText{name:'template_name_txt',characters:12},\
          }\
          group4:Group{\
            orientation:'row',\
            alignment:'left',\
            layers_check:Checkbox{name:'layers_check'},\
            fullsize_check:Checkbox{name:'fullsize_check'},\
          },\
          thumb:Group{\
            orientation:'row',\
            alignment:'left',\
            thumbnails_check:Checkbox{name:'thumbnails_check'},\
          }\
        }\
        group1:Group{\
          orientation:'column',\
          alignChildren:'fill',\
          label:StaticText{name:'panels_label'},\
          list1:ListBox{name:'panels_list',preferredSize:[150, 123], properties:{multiselect:true,scrolling:true}},\
        }\
      }\
      group_aa:Group{\
        alignment:'left',\
        destination_label:StaticText{name:'destination_label',alignment:'left'},\
        button:Button{name:'browse_btn',alignment:'right'},\
      },\
      group1:Group{\
        alignment:'fill',\
        group0:Group{\
          destination_input:EditText{name:'destination_txt',enabled:false,characters:42}\
        }\
      }\
      group2:Group{\
        alignment:'fill',\
        slug:Group{\
          checkbox:Checkbox{name:'slug_check'},\
          input:EditText{name:'slug_input',characters:20},\
        }\
      }\
      button:Button{name:'export_btn',alignment:'right'},\
    }\
    }");

    var e = ElementMap(group);

    /// label for group controls related to exporting picklet files
    e.panel.text = _("Export '%s'").replace('%s', document_name);

    covers_checkbox = e.cover_check;
    covers_checkbox.value = document_options.get('cover_image', true);

    /// label for option to include cover image in export
    e.cover_check.text = _("Covers");

    image_types_list = e.image_types_list;
    item = image_types_list.add('item', 'JPEG');
    // image_types_list.selection = item;
    item = image_types_list.add('item', 'PNG_8');
    image_types_list.enabled = covers_checkbox.value;

    cover_types_selection = document_options.get('cover_image_type', 0);
    image_types_list.selection = cover_types_selection; //image_types_list.items[cover_types_selection];

    cover_quality_txt = e.cover_quality;
    cover_quality_txt.text = document_options.get('cover_jpeg_quality', '8');
    cover_quality_txt.enabled = covers_checkbox.value;

    cover_quality_txt.addEventListener('change', function() {
      // bounds checking 0 - 10
      if (parseFloat(this.text, 10) <= 0) { this.text = '1'; }
      else if (parseFloat(this.text, 10) >= 10) { this.text = '10'; }
      else if (! parseFloat(this.text, 10)) { this.text = '8'; }
    });

    covers_checkbox.addEventListener('click', function() {
      // just update appearance
      image_types_list.enabled = this.value;
      cover_quality_txt.enabled = this.value;
    });

    image_types_list.addEventListener('change', function() {
      cover_quality_txt.visible = (0 == this.selection.index);
    });

    /// label for option to include the template file in export
    e.template_check.text = _("Template file");

    template_checkbox = e.template_check;
    template_checkbox.value = document_options.get('template', true);

    template_name_txt = e.template_name_txt;
    template_name_txt.text = document_options.get('template_json', 'picklet.json');
    template_name_txt.enabled = template_checkbox.value;

    template_checkbox.addEventListener('click', function() {
      // just update appearance
      template_name_txt.enabled = this.value;
    });

    /// label for option to include layer images in export
    e.layers_check.text = _("Layers");

    layers_checkbox = e.layers_check;
    layers_checkbox.value = document_options.get('layers', true);

    /// label for option to include fullsize layer images in export
    e.fullsize_check.text = _("include fullsize");

    fullsize_checkbox = e.fullsize_check;
    fullsize_checkbox.value = document_options.get('fullsize', true);
    fullsize_checkbox.enabled = layers_checkbox.value;

    layers_checkbox.addEventListener('click', function() {
      fullsize_checkbox.enabled = this.value;
    });

    /// label for list displaying panel names
    e.panels_label.text = _("Panels to export:");

    panels_list = e.panels_list;
    panels_list.addEventListener('change', updatePanelsList);
    
    thumbnails_checkbox = e.thumbnails_check;
    thumbnails_checkbox.value = document_options.get('thumbnails', true);

    /// label for option to include panel thumbnail images in export
    thumbnails_checkbox.text = _("Thumbnails");

    // selection_list = e.selection_list;

    /// label for input to save files to destination directory
    e.destination_label.text = _("Save to (usually in ~/Dropbox/Public):");

    destination_txt = e.destination_txt;
    var global_destination = global_options.get('destination', '~');
    var destination = new Folder(document_options.get('destination', global_destination));
    destination_txt.text = destination.fsName;

    /// label for button to browse for destination directory 
    e.browse_btn.text = _("Browse...");
    e.browse_btn.addEventListener('click', getDestination);

    slug_checkbox = e.slug_check;
    slug_checkbox.value = document_options.get('as_slug', true)

    /// label for option to use named sub-directory below the destination directory
    slug_checkbox.text = _("in folder:");

    slug_input_txt = e.slug_input;
    var slug = controller.slugify(document_name.replace(/^(.*)\.psd$/i, '$1'));
    slug_input_txt.text = document_options.get('slug_input', slug);
    slug_input_txt.enabled = slug_checkbox.value;

    slug_checkbox.addEventListener('click', function() {
      slug_input_txt.enabled = this.value;
    });

    export_btn = e.export_btn;
    export_btn.addEventListener('click', function() {
      app.activeDocument.suspendHistory('Picklet Export', 'doExport()');
    });
    /// label for button to start the export of picklet files
    export_btn.text = _("Export");

    groups['export'] = group;
    return group;
  };
  
  var getOptimizeGroup = function() {
    if (groups['optimize']) return groups['optimize'];

    var group = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    visible:false,\
    panel:Panel{\
      minimumSize:[300,50],\
      margins:[5, 16, 5, 10],\
      optimize:Group{\
        alignment:'fill',\
        orientation:'row',\
        layer:Group{\
          list:DropDownList{name:'layer_export_types'},\
          input:EditText{characters:4, name:'layer_export_quality'},\
          checkbox:Checkbox{name:'layer_export_fullsize'},\
          button:Button{name:'layer_export_action'},\
        }\
      }\
    }}");

    var e = ElementMap(group);

    /// label for 'optimize' group controls
    group.panel.text = _("Optimize");
    
    layer_export_types_list = e.layer_export_types;
    item = layer_export_types_list.add('item', 'JPEG');
    layer_export_types_list.selection = item;

    layer_export_quality = e.layer_export_quality;
    layer_export_quality.text = '8';

    /// label for option to export fullsize images
    e.layer_export_fullsize.text = _("Fullsize");

    layer_export_fullsize = e.layer_export_fullsize;
    layer_export_fullsize.value = document_options.get('layer_export_fullsize', true);

    layer_export_btn = e.layer_export_action;

    /// label for button to start export of layer image
    layer_export_btn.text = _("Export");

    groups['optimize'] = group;
    return group;
  };
  
  var getHelpGroup = function() {
    if (groups['help']) return groups['help'];

    var group = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    visible: false,\
    panel:Panel{\
      text:'Help',\
      minimumSize:[300,300],\
      margins:[5, 16, 5, 10],\
      group0:Group{\
        orientation:'row',\
        text_language:StaticText{name:'language_label'},\
        list_language:DropDownList{name:'language_list'},\
      },\
      text_update:StaticText{name:'update_label'},\
      button_update:Button{name:'update_btn'},\
      text_documentation:StaticText{name:'documentation_label'},\
      button_documentation:Button{name:'documentation_btn'},\
      text_script:StaticText{name:'script_label'},\
      button_script:Button{name:'script_btn'},\
    }}");

    var e = ElementMap(group);

    /// text for button that queries the server for current version of script
    e.update_label.text = _("Check for update");

    update_btn = e.update_btn;
    /// label on button that checks for udpates
    update_btn.text = _("Check");

    /// text prompting user to click the button to read online documentation
    e.documentation_label.text = _("Read documentation online");

    documentation_btn = e.documentation_btn;
    /// button label that opens a browser on the documentation
    documentation_btn.text = _("Open");

    /// text prompt to reveal the script in the Finder
    e.script_label.text = _("Reveal script in Finder");

    script_btn = e.script_btn;
    /// button label that opens the Finder to reveal the script
    script_btn.text = _("Show");

    /// label for dropdown list to choose a language for the displayed dialog
    e.language_label.text = _("Language");

    language_list = e.language_list;
    for (i = 0; i < LC_LANGUAGES.length; i++) {
      var item = language_list.add('item', '');
      item.code = LC_LANGUAGES[i].code;
      if (selected_language == item.code) {
        language_list.selection = item;
      }
    }
    for (i = 0; i < language_list.items.length; i++) {
      language_list.items[i].text = _(LC_LANGUAGES[i]['name']);
    }
    language_list.addEventListener('change', changeLanguage);

    groups['help'] = group;
    return group;
  };
  
  var getLogGroup = function() {
    if (groups['log']) return groups['log'];

    var group = group_action.add("group{\
    orientation:'column',\
    visible: false,\
    text_language:EditText{size:[300,300],multiline:true},\
    }}");
    var e = ElementMap(group);
    groups['log'] = group;
    return group;
  };

  var init = function() {
    loadLanguage(selected_language);
    
    var params = {
        "domain": "messages",
        "locale_data": json_locale_data
    };
    gt = new Gettext(params);

    if (app.documents.length > 0) {
      if (app.activeDocument) {
        document_name = app.activeDocument.name;
      }
    }

    document_options = new CustomOptions('Picklet-Settings-' + document_name);

    if (app.documents.length > 0) {
      action_selection = document_options.get('action_display', 0);
    } else {
      // default to displaying 'create' if there's no open document
      action_selection = 0;
    }

    /*
    In case you're curious, my principle in deciding how to create these
    interface elements is that it's in the resource string unless
    a. I need to persist the value of the control (using CustomOptions), or
    b. it's an active interface element that needs a handler or something
    in which cases I make an instance variable with the value needed
    instead of storing hierarchies.
    The compactness of the resource style appeals and lets me change layout
    quickly and easily, and it's an almost clean separation of presentation/function.
    */
      main_window = new Window("dialog{orientation:'column',alignChildren:'fill'}");

      /// the title of the dialog
      main_window.text = _("Picklet Export");

      var e; // this is the ElementMap local instance. gets re-used.

      var content = main_window.add("group{alignChildren:'top'}");
      var buttons = main_window.add("group{\
          orientation:'stack',\
          group_right:Group{\
            alignment:['right', 'bottom'],\
            button:Button{name:'close_btn'}\
          },\
          footer:Group{\
            alignment:'left',\
            orientation:'column',\
            name:StaticText{alignment:'left'},\
            text_by:StaticText{alignment:'bottom'},\
          },\
      }");

      e = ElementMap(buttons);

      close_btn = e.close_btn;
      close_btn.addEventListener('click', closeWindow);
      main_window.cancelElement = close_btn;

      /// label for 'close' button on dialog
      close_btn.text = _("Close");

      /// script name and version identifier
      buttons.footer.name.text = _("PickletExport.jsx r13");

      var font = ScriptUI.newFont (buttons.footer.text_by.graphics.font.name, 10);
      buttons.footer.text_by.graphics.font = font;

      /// footer text. copyright notice.
      buttons.footer.text_by.text = _("(c) 2012 RobotInaBox Pty Ltd");

      var sidebar = content.add("group{\
        orientation:'column',\
        list_actions:ListBox{name:'actions_list',minimumSize:[150, 250]},\
      }");

      e = ElementMap(sidebar);

      actions_list = e.actions_list;
      var font = ScriptUI.newFont (actions_list.graphics.font.name, 14);
      actions_list.graphics.font = font;

      /// label for create action
      var item = actions_list.add('item', _("Create"));
      item.icon = 'Step1Icon';

      /// label for export action
      item = actions_list.add('item', _("Export"));
      item.icon = 'Step2Icon';

      /// label for optimize action
      item = actions_list.add('item', _("Optimize"));
      item.icon = 'Step3Icon';

      /// label for help action
      actions_list.add('item', _("Help"));

      /// label for review action
      actions_list.add('item', _("Review"));

      // actions_list.selection = document_options.get('action_display', 0);
      actions_list.selection = action_selection;
      actions_list.addEventListener('change', updateActionDisplay);

      // group_action holds the groups corresponding to the radio button selection
      group_action = content.add("group{\
        orientation:'stack',\
        group:Group{\
          visible:false,\
          minimumSize:[300,300],\
        },\
      }");

      // content views corresponding to actions are initialized here
      getCreateGroup();
      getExportGroup();
      getOptimizeGroup();
      getHelpGroup();
      getLogGroup();
  };

  var reset = function() {
    if (typeof main_window != "undefined") {
      put_options();
      main_window.close();
      for (var i in groups) {
        groups[i] = null;
      }
    }
    init(); // recreate the interface so autolayout accounts for localized labels
    actions_list.notify('onChange');
    initPanelsList();
    if (app.documents.length == 0) {
      groups['export'].enabled = false;
      groups['optimize'].enabled = false;
    }
    main_window.show();
  };

  var loadLanguage = function(language) {
    // CAREFUL. assumes this file has a directory LC_MESSAGES/ at the same level
    var script_file = new File($.fileName);
    var language_filename = script_file.parent + '/LC_MESSAGES/' + language + '_po.json';
    var messages_file = new File(language_filename);
    if (! messages_file.exists) {
      alert('no translation for: ' + language);
      // try to get one.
      json_locale_data = {"messages": {"":{}}};
    } else {
      messages_file.open();
      var messages_string = messages_file.read();
      eval("json_locale_data = " + messages_string);
    }
  };

  var updateActionDisplay = function() {
    if (actions_list.selection == null) {
      // preserve the selection. don't allow it to be set to null
      actions_list.selection = action_selection;
    }
    // action_selection is the index, rather than the text, for i18n purposes
    action_selection = actions_list.selection.index;

    var names = ['create', 'export', 'optimize', 'help', 'log'];
    var actions = [create_btn, export_btn, layer_export_btn, null, null];
    var getter = [getCreateGroup, getExportGroup, getOptimizeGroup, getHelpGroup, getLogGroup];
    if (groups[names[previous_action]]) {
      groups[names[previous_action]].visible = false;
    }

    groups[names[action_selection]].visible = true;
    if (groups[names[action_selection]].enabled) {
      main_window.defaultElement = actions[action_selection];
    } else {
      main_window.defaultElement = null;
    }

    // individual visible toggles
    cover_quality_txt.visible = (image_types_list.selection == 0);

    actions_list.selection = action_selection;
    actions_list.active = true; // set keyboard focus to the list
    previous_action = action_selection;
  };
  
  var put_options = function() {
    // get CustomOptions to save their storable options.
    global_options.set('include_guides', guides_checkbox.value);
    global_options.set('prompt_save', save_checkbox.value);
    global_options.set('destination', destination_txt.text); // use as default for new documents

    global_options.set('language', selected_language);

    global_options.put();

    // store document-level options
    document_options.set('action_display', action_selection);
    document_options.set('destination', destination_txt.text);

    document_options.set('layer_comp_selection', getLayerCompSelection().join(','));
    if (panels_list.selection) {
      document_options.set('panel_selection', panels_list.selection.join(','));
    } else {
      document_options.set('panel_selection', '');
    }
    document_options.set('cover_image', covers_checkbox.value);
    document_options.set('cover_jpeg_quality', cover_quality_txt.text);
    document_options.set('template', template_checkbox.value);
    document_options.set('template_json', template_name_txt.text);
    document_options.set('layers', layers_checkbox.value);
    document_options.set('fullsize', fullsize_checkbox.value);
    document_options.set('thumbnails', thumbnails_checkbox.value);
    document_options.set('as_slug', slug_checkbox.value);
    document_options.set('slug_input', slug_input_txt.text);
    document_options.set('cover_image_type', image_types_list.selection.index);

    document_options.put();
  };

  return {
    show: function() {
      save_units = preferences.rulerUnits;
      preferences.rulerUnits = Units.PIXELS;
      try {
        reset();
      } catch(e) {
        var msg = '';
        for (var i in e) {
          msg += i + '\n';
        }
        alert('Error\n ' + e.fileName + ' line ' + e.line + '\n' + e.message);
      }
      preferences.rulerUnits = save_units;
    }
  };
};
