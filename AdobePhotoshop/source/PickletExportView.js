PickletExportView = function() {

  // these language names get localized, with unicode text pulled from external file
  var LC_LANGUAGES = [
    {'code': 'en', 'name': 'English'},
    {'code': 'fr', 'name': 'French'},
    {'code': 'zh', 'name': 'Standard Chinese'}
  ];

  var main_window;
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
  var prompt_save_checkbox;

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
      'save': prompt_save_checkbox.value
    };
    put_options();
    var group = main_window.add("group{\
    orientation:'column',\
    alignment:'top',\
    visible:false,\
    panel:Panel{\
      minimumSize:[300,100],\
      margins:[5, 16, 5, 10],\
      alignChildren:'right',\
      title:Group{\
        label_title:StaticText{name:'title_label'},\
        title:EditText{name:'title_txt',characters:15,active:true},\
      },\
    }}");
    /*
    main_window.close();
    controller.createPicklet(properties);
    */
  };

  var closeWindow = function() {
    put_options();
    main_window.close();
  };

  var changeLanguage = function() {
    selected_language = language_list.selection.code;
    reset();
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
        title:EditText{name:'title_txt',characters:15,active:true},\
      },\
      panel_count:Group{\
        label_panel_count:StaticText{name:'panel_count_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_title:EditText{characters:15,visible:false},\
          text_panel_count:EditText{name:'text_panel_count',characters:4,alignment:'left'},\
        },\
      },\
      guides:Group{\
        label_guides:StaticText{name:'guides_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_title:EditText{characters:15,visible:false},\
          checkbox:Checkbox{name:'guides_checkbox',alignment:'left'},\
        }\
      },\
      save:Group{\
        label:StaticText{name:'save_label'},\
        thing:Group{\
          orientation:'stack',\
          alignment:'left',\
          text_save:EditText{characters:15,visible:false},\
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

    prompt_save_checkbox = e.save_checkbox;
    prompt_save_checkbox.value = global_options.get('prompt_save', true);

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
            cover_label:StaticText{name:'cover_label'},\
          }\
          group1:Group{\
            orientation:'row',\
            alignment:'right',\
            list:DropDownList{name:'image_types_list'},\
            input:EditText{name:'cover_image_jpeg_quality',characters:4},\
          }\
          group2:Group{\
            orientation:'row',\
            alignment:'left',\
            template_check:Checkbox{name:'template_check'},\
            template_label:StaticText{name:'template_label'},\
          }\
          group3:Group{\
            orientation:'row',\
            alignment:'right',\
            input:EditText{name:'template_name_txt',characters:12},\
          }\
          group4:Group{\
            orientation:'row',\
            alignment:'left',\
            layers_check:Checkbox{name:'layers_check'},\
            layers_label:StaticText{name:'layers_label'},\
          },\
          group5:Group{\
            orientation:'row',\
            alignment:'left',\
            margins:[30,0,0,0],\
            fullsize_check:Checkbox{name:'fullsize_check'},\
            fullsize_label:StaticText{name:'fullsize_label'},\
          },\
        }\
        group1:Group{\
          orientation:'column',\
          alignChildren:'fill',\
          group:Group{\
            orientation:'column',\
            margins:[5, 0, 5, 0],\
            alignment:'fill',\
            list0:DropDownList{name:'panels_list',alignment:'fill'},\
          },\
          thumb:Group{\
            orientation:'row',\
            alignment:'left',\
            thumbnails_check:Checkbox{name:'thumbnails_check'},\
            thumbnails_label:StaticText{name:'thumbnails_label'},\
          }\
          list1:ListBox{preferredSize:[150, 103], properties:{scrolling:true}},\
        }\
      }\
      destination_label:StaticText{name:'destination_label',alignment:'left'},\
      group1:Group{\
        alignment:'fill',\
        group0:Group{\
          destination_input:EditText{characters:20}\
          button:Button{name:'browse_btn',alignment:'right'},\
        }\
      }\
      group2:Group{\
        alignment:'fill',\
        slug:Group{\
          checkbox:Checkbox{name:'slug_check'},\
          label:StaticText{name:'slug_label'},\
          input:EditText{name:'slug_input',characters:12},\
        }\
      }\
      button:Button{name:'export_btn',alignment:'right'},\
    }\
    }");

    var e = ElementMap(group);

    /// label for option to include cover image in export
    e.cover_label.text = _("Cover image");

    cover_image_checkbox = e.cover_check;
    cover_image_checkbox.value = document_options.get('cover_image', true);

    image_types_list = e.image_types_list;
    item = image_types_list.add('item', 'JPEG');
    image_types_list.selection = item;

    e.cover_image_jpeg_quality.text = '8';

    /// label for option to include the template file in export
    e.template_label.text = _("Template file");

    template_checkbox = e.template_check;
    template_checkbox.value = document_options.get('template', true);

    template_name_txt = e.template_name_txt;
    template_name_txt.text = "picklet.json";

    /// label for option to include layer images in export
    e.layers_label.text = _("Layers");

    layers_checkbox = e.layers_check;
    layers_checkbox.value = document_options.get('layers', true);

    /// label for option to include fullsize layer images in export
    e.fullsize_label.text = _("Fullsize");

    fullsize_checkbox = e.fullsize_check;
    fullsize_checkbox.value = document_options.get('fullsize', true);

    panels_list = e.panels_list;
    item = panels_list.add('item', 'Panels');
    panels_list.selection = item;
    
    thumbnails_checkbox = e.thumbnails_check;
    thumbnails_checkbox.value = document_options.get('thumbnails', true);

    /// label for option to include panel thumbnail images in export
    e.thumbnails_label.text = _("Thumbnails");

    /// label for group controls related to exporting picklet files
    e.panel.text = _("Export '%s'").replace('%s', document_name);

    /// label for input to save files to destination directory
    e.destination_label.text = _("Export to destination:");

    /// label for button to browse for destination directory 
    e.browse_btn.text = _("Browse...");

    e.slug_check.value = document_options.get('as_slug', true)

    /// label for option to use named sub-directory below the destination directory
    e.slug_label.text = _("in folder:");

    e.slug_input.text = "untitled_picklet";

    export_btn = e.export_btn;
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
          label:StaticText{name:'layer_export_label'},\
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
    e.layer_export_label.text = _("Fullsize");

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
    action_selection = document_options.get('action_display', 0);

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

      actions_list.selection = document_options.get('action_display', 0);
      actions_list.addEventListener('change', updateActionDisplay);

      // group_action holds the groups corresponding to the radio button selection
      group_action = content.add("group{\
        orientation:'stack',\
        group:Group{\
          visible:false,\
          minimumSize:[300,300],\
        },\
      }");

      // content views corresponding to actions are lazy loaded
      // in actions_list handler updateActionDisplay
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
    init(); // need to recreate the controls so autolayout works
    actions_list.notify('onChange');
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
    main_window.defaultElement = actions[action_selection];

    actions_list.selection = action_selection;
    actions_list.active = true; // set keyboard focus to the list
    previous_action = action_selection;
  };
  
  var put_options = function() {
    // get CustomOptions to save their storable options.
    if (group_create) {
      global_options.set('include_guides', group_create.guides_checkbox.value);
      global_options.set('prompt_save', group_create.save_checkbox.value);
    }
    global_options.set('language', selected_language);

    global_options.put();

    // store document-level options
    document_options.set('action_display', action_selection);

    document_options.put();
  };

  return {
    show: function() {
      reset();
    }
  };
};
