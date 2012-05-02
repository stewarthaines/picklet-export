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
  
  var controller = new PickletExportController();

  function _(msgid) {
      return gt.gettext(msgid);
  }
  
  var findElement = function (el, name) {
    // recursive function to locate a named element child of element
    if (el.name == name) return el;
    if (typeof el.children == 'undefined') return null;
    for (var i = 0; i < el.children.length; i++) {
      elem = findElement(el.children[i], name);
      if (elem) return elem;
    }
    return null;
  };

  var createPicklet = function() {
    var properties = {
      'count': panel_count_txt.text,
      'name': picklet_title_txt.text,
      'guides': guides_checkbox.value,
      'save': prompt_save_checkbox.value
    };
    put_options();
    main_window.close();
    controller.createPicklet(properties);
  };

  var closeWindow = function() {
    put_options();
    main_window.close();
  };

  var changeLanguage = function() {
    selected_language = language_list.selection.code;
    reset();
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

      var content = main_window.add("group{alignChildren:'top'}");
      var buttons = main_window.add("group{\
          orientation:'stack',\
          group_right:Group{\
            alignment:['right', 'bottom'],\
            button_close:Button{}\
          },\
          footer:Group{\
            alignment:'left',\
            orientation:'column',\
            name:StaticText{alignment:'left'},\
            text_by:StaticText{alignment:'bottom'},\
          },\
      }");

      close_btn = buttons.group_right.button_close;
      /// label for 'close' button on dialog
      close_btn.text = _("Close");
      close_btn.addEventListener('click', closeWindow);
      main_window.cancelElement = close_btn;

      /// script name and version identifier
      buttons.footer.name.text = _("PickletExport.jsx r13");

      var font = ScriptUI.newFont (buttons.footer.text_by.graphics.font.name, 10);
      buttons.footer.text_by.graphics.font = font;
      /// footer text. copyright notice.
      buttons.footer.text_by.text = _("(c) 2012 RobotInaBox Pty Ltd");

      var sidebar = content.add("group{\
        orientation:'column',\
        list_actions:ListBox{preferredSize:[150, 250], properties:{scrolling:false}},\
      }");

      actions_list = sidebar.list_actions;
      var font = ScriptUI.newFont (actions_list.graphics.font.name, 14);
      actions_list.graphics.font = font;

      var item = actions_list.add('item', _("Create"));
      item.icon = 'Step1Icon';
      item = actions_list.add('item', _("Export"));
      item.icon = 'Step2Icon';
      item = actions_list.add('item', _("Optimize"));
      item.icon = 'Step3Icon';
      actions_list.add('item', _("Help"));
      actions_list.add('item', _("Review"));
      actions_list.selection = document_options.get('action_display', 0);

      actions_list.addEventListener('change', updateActionDisplay);

      // group_action holds the 3 states corresponding to the radio button selection
      var group_action = content.add("group{\
        orientation:'stack'\
      }");

      group_create = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
        minimumSize:[300,100],\
        margins:[5, 16, 5, 10],\
        alignChildren:'right',\
        title:Group{\
          label_title:StaticText{},\
          text_title:EditText{characters:15,active:true},\
        },\
        panel_count:Group{\
          label_panel_count:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_title:EditText{characters:15,visible:false},\
            text_panel_count:EditText{name:'text_panel_count',characters:4,alignment:'left'},\
          },\
        },\
        guides:Group{\
          label_guides:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_title:EditText{characters:15,visible:false},\
            checkbox_guides:Checkbox{alignment:'left'},\
          }\
        },\
        save:Group{\
          label_save:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_save:EditText{characters:15,visible:false},\
            checkbox_save:Checkbox{alignment:'left'},\
          }\
        },\
        button_create:Button{alignment:'right'},\
      }}");

      /// label for the group of options for the 'Create' action
      group_create.panel.text = _("New document");

      /// label for option
      group_create.panel.title.label_title.text = _("Picklet title:");

      panel_count_txt = findElement(group_create, 'text_panel_count'); //.panel.panel_count.text_panel_count;
      panel_count_txt.text = '1';

      /// label for option
      group_create.panel.panel_count.label_panel_count.text = _("Number of panels:");

      picklet_title_txt = group_create.panel.title.text_title;
      /// default title for picklet
      picklet_title_txt.text = _("Untitled Picklet");

      /// label for option
      group_create.panel.guides.label_guides.text = _("Include guides:");

      guides_checkbox = group_create.panel.guides.thing.checkbox_guides;
      guides_checkbox.value = global_options.get('include_guides', true);

      /// label for option
      group_create.panel.save.label_save.text = _("Prompt to save:");

      prompt_save_checkbox = group_create.panel.save.thing.checkbox_save;
      prompt_save_checkbox.value = global_options.get('prompt_save', true);

      create_btn = group_create.panel.button_create;
      /// button label to create a new picklet document
      create_btn.text = _("Create");
      create_btn.addEventListener('click', createPicklet);

      group_export = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
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
              cover_check:Checkbox{},\
              cover_label:StaticText{},\
            }\
            group1:Group{\
              orientation:'row',\
              alignment:'right',\
              list:DropDownList{},\
              input:EditText{name:'cover_image_jpeg_quality',characters:4},\
            }\
            group2:Group{\
              orientation:'row',\
              alignment:'left',\
              template_check:Checkbox{},\
              template_label:StaticText{},\
            }\
            group3:Group{\
              orientation:'row',\
              alignment:'right',\
              input:EditText{characters:12},\
            }\
            group4:Group{\
              orientation:'row',\
              alignment:'left',\
              layers_check:Checkbox{},\
              layers_label:StaticText{},\
            },\
            group5:Group{\
              orientation:'row',\
              alignment:'left',\
              margins:[30,0,0,0],\
              fullsize_check:Checkbox{},\
              fullsize_label:StaticText{},\
            },\
          }\
          group1:Group{\
            orientation:'column',\
            alignChildren:'fill',\
            group:Group{\
              orientation:'column',\
              margins:[5, 0, 5, 0],\
              alignment:'fill',\
              list0:DropDownList{alignment:'fill'},\
            },\
            thumb:Group{\
              orientation:'row',\
              alignment:'left',\
              thumbnails_check:Checkbox{},\
              thumbnails_label:StaticText{},\
            }\
            list1:ListBox{preferredSize:[150, 103], properties:{scrolling:true}},\
          }\
        }\
        destination_label:StaticText{alignment:'left'},\
        group1:Group{\
          alignment:'fill',\
          group0:Group{\
            destination_input:EditText{characters:20}\
            button:Button{alignment:'right'},\
          }\
        }\
        group2:Group{\
          alignment:'fill',\
          slug:Group{\
            checkbox:Checkbox{},\
            label:StaticText{},\
            input:EditText{characters:12},\
          }\
        }\
        button:Button{alignment:'right'},\
      }\
      }");

      group_export.panel.group0.group0.group0.cover_label.text = _("Cover image");

      cover_image_checkbox = group_export.panel.group0.group0.group0.cover_check;
      cover_image_checkbox.value = document_options.get('cover_image', true);

      image_types_list = group_export.panel.group0.group0.group1.list;
      item = image_types_list.add('item', 'JPEG');
      image_types_list.selection = item;

      // main_window.findElement('cover_image_jpeg_quality').text = '7';
      group_export.panel.group0.group0.group1.input.text = '8';

      group_export.panel.group0.group0.group2.template_label.text = _("Template file");

      template_checkbox = group_export.panel.group0.group0.group2.template_check;
      template_checkbox.value = document_options.get('template', true);

      template_name_txt = group_export.panel.group0.group0.group3.input;
      template_name_txt.text = "picklet.json";

      group_export.panel.group0.group0.group4.layers_label.text = _("Layers");

      layers_checkbox = group_export.panel.group0.group0.group4.layers_check;
      layers_checkbox.value = document_options.get('layers', true);

      group_export.panel.group0.group0.group5.fullsize_label.text = _("Fullsize");

      layers_checkbox = group_export.panel.group0.group0.group5.fullsize_check;
      layers_checkbox.value = document_options.get('fullsize', true);

      panels_list = group_export.panel.group0.group1.group.list0;
      item = panels_list.add('item', 'Panels');
      panels_list.selection = item;
      
      thumbnails_checkbox = group_export.panel.group0.group1.thumb.thumbnails_check;
      thumbnails_checkbox.value = document_options.get('thumbnails', true);

      group_export.panel.group0.group1.thumb.thumbnails_label.text = _("Thumbnails");

      // label for 'export' group controls
      group_export.panel.text = _("Export '%s'").replace('%s', document_name);

      /// label for destination
      group_export.panel.destination_label.text = _("Export to destination:");

      group_export.panel.group1.group0.button.text = _("Browse...");

      group_export.panel.group2.slug.checkbox.value = document_options.get('as_slug', true)
      group_export.panel.group2.slug.label.text = _("in folder:");
      group_export.panel.group2.slug.input.text = "untitled_picklet";

      export_btn = group_export.panel.button;
      /// button text
      export_btn.text = _("Export");

      group_optimize = group_action.add("group{\
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

      /// label for 'optimize' group controls
      group_optimize.panel.text = _("Optimize");
      
      layer_export_types_list = findElement(group_optimize, 'layer_export_types');
      item = layer_export_types_list.add('item', 'JPEG');
      layer_export_types_list.selection = item;

      layer_export_quality = findElement(group_optimize, 'layer_export_quality');
      layer_export_quality.text = '8';

      findElement(group_optimize, 'layer_export_label').text = _("Fullsize");

      layer_export_fullsize = findElement(group_optimize, 'layer_export_fullsize');
      layer_export_fullsize.value = document_options.get('layer_export_fullsize', true);

      layer_export_btn = findElement(group_optimize, 'layer_export_action');
      layer_export_btn.text = _("Export");

      group_help = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
        text:'Help',\
        minimumSize:[300,300],\
        margins:[5, 16, 5, 10],\
        group0:Group{\
          orientation:'row',\
          text_language:StaticText{},\
          list_language:DropDownList{},\
        },\
        text_update:StaticText{},\
        button_update:Button{},\
        text_documentation:StaticText{},\
        button_documentation:Button{},\
        text_script:StaticText{},\
        button_script:Button{},\
      }}");

      /// text for button that queries the server for current version of script
      group_help.panel.text_update.text = _("Check for update");

      update_btn = group_help.panel.button_update;
      /// label on button that checks for udpates
      update_btn.text = _("Check");

      /// text prompting user to click the button to read online documentation
      group_help.panel.text_documentation.text = _("Read documentation online");

      documentation_btn = group_help.panel.button_documentation;
      /// button label that opens a browser on the documentation
      documentation_btn.text = _("Open");

      /// text prompt to reveal the script in the Finder
      group_help.panel.text_script.text = _("Reveal script in Finder");

      script_btn = group_help.panel.button_script;
      /// button label that opens the Finder to reveal the script
      script_btn.text = _("Show");

      /// label for dropdown list to choose a language for the displayed dialog
      group_help.panel.group0.text_language.text = _("Language");

      language_list = group_help.panel.group0.list_language;
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

      group_log = group_action.add("group{\
      orientation:'column',\
      visible:false,\
      text_language:EditText{size:[300,300],multiline:true},\
      }}");
  };

  var reset = function() {
    if (typeof main_window != "undefined") {
      put_options();
      main_window.close();
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
    if (this.selection == null) {
      // preserve the selection. don't allow it to be set to null
      this.selection = action_selection;
    }
    // action_selection is the index, rather than the text, for i18n purposes
    action_selection = this.selection.index;

    var g = [group_create, group_export, group_optimize, group_help, group_log];
    var actions = [create_btn, export_btn, layer_export_btn, null, null];
    for (i in g) {
      if (i == action_selection) {
        g[action_selection].visible = true;
        main_window.defaultElement = actions[action_selection];
      } else {
        g[i].visible = false;
      }
    }
    actions_list.selection = action_selection;
    actions_list.active = true; // set keyboard focus to the list
  };
  
  var put_options = function() {
    // get CustomOptions to save their storable options.
    global_options.set('include_guides', guides_checkbox.value);
    global_options.set('prompt_save', prompt_save_checkbox.value);
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
