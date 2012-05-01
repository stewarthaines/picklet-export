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
  
  var controller;

  var json_locale_data;

  var documentName = 'dummy_name';

  var global_options = new CustomOptions('Picklet-Settings');
  var document_options;

  // $.locale is something like 'en_AU' we just want 'en'
  var default_language = $.locale.replace(/^([a-z]{2})_([A-Z]{2}).*$/, '$1');

  // get the global_options language, fallback to LOCALE language
  selected_language = global_options.get('language', default_language);

  var init = function() {
    if (app.documents.length > 0) {
      if (app.activeDocument) {
        try {
          documentName = app.activeDocument.fullName;
        } catch(e) {
          documentName = app.activeDocument;
        }
      }
    }

    document_options = new CustomOptions('Picklet-Settings-' + documentName);
    action_selection = document_options.get('action_display', 0);

    var params = {
        "domain": "messages",
        "locale_data": json_locale_data
    };
    gt = new Gettext(params);
    function _(msgid) {
        return gt.gettext(msgid);
    }

    /*
    In case you're curious, my principle in deciding how to create these
    interface elements is that it's in the resource string unless
    a. I need to set a text label on it (for localization), or
    b. I need to persist the value of the control (using CustomOptions)
    In which cases I have an instance variable with the value needed
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
      close_btn.addEventListener('click', function() {
        put_options();
        main_window.close();
      });
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

      actions_list.addEventListener('change', function () {
        if (this.selection == null) {
          // preserve the selection. don't allow it to be set to null
          this.selection = action_selection;
        }
        // action_selection is the index, rather than the text, for i18n purposes
        action_selection = this.selection.index;
        updateActionDisplay();
      });

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
        alignChildren:'right',\
        title:Group{\
          label_title:StaticText{},\
          text_title:EditText{characters:15,active:true},\
        },\
        panel_count:Group{\
          label_panel_count:StaticText{},\
          text_panel_count:EditText{characters:15,active:true},\
        },\
        guides:Group{\
          label_guides:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_title:EditText{characters:15,active:true,visible:false},\
            checkbox_guides:Checkbox{alignment:'left'},\
          }\
        },\
        save:Group{\
          label_save:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_save:EditText{characters:15,active:true,visible:false},\
            checkbox_save:Checkbox{alignment:'left'},\
          }\
        },\
        button_create:Button{alignment:'right'},\
      }}");

      /// label for the group of options for the 'Create' action
      group_create.panel.text = _("New document");

      /// label for option
      group_create.panel.title.label_title.text = _("Picklet title:");

      panel_count_txt = group_create.panel.panel_count.text_panel_count;
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
      create_btn.addEventListener('click', function() {
        var properties = {
          'count': panel_count_txt.text,
          'name': picklet_title_txt.text,
          'guides': guides_checkbox.value,
          'save': prompt_save_checkbox.value
        };
        put_options();
        main_window.close();
        controller.createPicklet(properties);
      });

      group_export = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
        minimumSize:[300,300],\
        text1:EditText{characters:25,active:true},\
        icon1:IconButton{title:'Create', image:'Step1Icon'},\
        button0:RadioButton{text:'Create',icon:'Step1Icon'},\
        list0:ListBox{multiselect:true},\
        dropdown0:DropDownList{},\
        progress0:Progressbar{preferredSize:[250,30]},\
        button:Button{alignment:'right'},\
      }\
      }");

      // label for 'export' group controls
      group_export.panel.text = _("Export");

      export_btn = group_export.panel.button;
      /// button text
      export_btn.text = _("Export");

      group_optimize = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
        minimumSize:[300,300],\
        text:'Optimize',\
        text1:EditText{text:'',characters:25,active:true},\
        icon1:IconButton{title:'Create', image:'Step1Icon'},\
        button0:RadioButton{text:'Create',icon:'Step1Icon'},\
        list0:ListBox{multiselect:true},\
        dropdown0:DropDownList{},\
        progress0:Progressbar{preferredSize:[250,30]}\
      }}");

      group_help = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      visible:false,\
      panel:Panel{\
        text:'Help',\
        minimumSize:[300,300],\
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
      language_list.addEventListener('change', function(evt) {
        var lang = language_list.selection.code;
        selected_language = lang;
        reset();
      });

      group_log = group_action.add("group{\
      orientation:'column',\
      visible:false,\
      text_language:EditText{size:[300,300],multiline:true},\
      }}");

      updateActionDisplay();
  };

  var reset = function() {
    if (typeof main_window != "undefined") {
      put_options();
      main_window.close();
    }
    loadLanguage(selected_language);
    init(); // need to recreate the controls so autolayout works
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
    var g = [group_create, group_export, group_optimize, group_help, group_log];
    var actions = [create_btn, export_btn, null, null, null];
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
    setController: function(c) {
      controller = c;
    },
    show: function() {
      reset();
    }
  };
};
