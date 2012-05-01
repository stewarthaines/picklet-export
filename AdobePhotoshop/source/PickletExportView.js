var json_locale_set = [];

PickletExportView = function() {

  // these language names get localized, with unicode text pulled from external file
  LC_LANGUAGES = [
    {'code': 'en', 'name': 'English'},
    {'code': 'fr', 'name': 'French'},
    {'code': 'zh', 'name': 'Standard Chinese'}
  ];

  var main_window;
  var close_btn;

  // sidebar
  var script_name_txt;
  var actions_list;

  // help panel
  var update_txt;
  var update_btn;
  var documentation_txt;
  var documentation_btn;
  var script_txt;
  var script_btn;
  var footer_txt;
  var action_txt;
  
  var create_btn;
  var panel_count_txt;
  var picklet_title_txt;
  var guides_label;
  var guides_checkbox;
  var prompt_save_label;
  var prompt_save_checkbox;

  var export_btn;
  var optimize_btn;
  var create_txt;
  var language_txt;
  var language_btn;
  
  var group_action_radio;
  var group_create;
  var group_export;
  var group_optimize;
  var group_help;
  var group_log;
  
  var english_item;
  var french_item;
  var standard_chinese_item;
  var language_list;
  
  var controller = null;
  var model = null;

  var documentName = 'dummy_name';
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

  global_options = new CustomOptions('Picklet-Settings');

  // $.locale is something like 'en_AU' we just want 'en'
  var default_language = $.locale.replace(/^([a-z]{2})_([A-Z]{2}).*$/, '$1')
  selected_language = global_options.get('language', default_language);

  var init = function() {
      main_window = new Window("dialog{orientation:'column',alignChildren:'fill'}");

      var content = main_window.add("group{alignChildren:'top'}");
      var buttons = main_window.add("group{\
          orientation:'stack',\
          group_right:Group{\
            alignment:['right', 'bottom'],\
            button_close:Button{name:'close_btn'}\
          },\
          footer:Group{\
            alignment:'left',\
            orientation:'column',\
            text_script_name:StaticText{alignment:'left'},\
            text_by:StaticText{alignment:'bottom'},\
          },\
      }");

      close_btn = buttons.group_right.button_close;

      script_name_txt = buttons.footer.text_script_name;
      footer_txt = buttons.footer.text_by;
      var font = ScriptUI.newFont (footer_txt.graphics.font.name, 10);
      footer_txt.graphics.font = font;

      close_btn.addEventListener('click',
      function() {
          put_options();
          main_window.close();
      });

      var sidebar = content.add("group{\
        orientation:'column',\
        list_actions:ListBox{preferredSize:[150, 250], properties:{scrolling:false}},\
      }");

      actions_list = sidebar.list_actions;
      var font = ScriptUI.newFont (actions_list.graphics.font.name, 14);
      actions_list.graphics.font = font;

      actions_list.view = this;
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
      panel:Panel{\
        text:'New document',\
        alignChildren:'right',\
        title:Group{\
          label_title:StaticText{text:'Picklet title:'},\
          text_title:EditText{text:'',characters:15,active:true},\
        },\
        panel_count:Group{\
          label_panel_count:StaticText{text:'Number of panels:'},\
          text_panel_count:EditText{text:'',characters:15,active:true},\
        },\
        guides:Group{\
          label_guides:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_title:EditText{text:'',characters:15,active:true,visible:false},\
            checkbox_guides:Checkbox{alignment:'left'},\
          }\
        },\
        save:Group{\
          label_save:StaticText{},\
          thing:Group{\
            orientation:'stack',\
            alignment:'left',\
            text_save:EditText{text:'',characters:15,active:true,visible:false},\
            checkbox_save:Checkbox{alignment:'left'},\
          }\
        },\
        button_create:Button{alignment:'right'},\
      }}");

      create_txt = group_create.panel;
      panel_count_txt = group_create.panel.panel_count.text_panel_count;
      picklet_title_txt = group_create.panel.title.text_title;

      guides_label = group_create.panel.guides.label_guides;
      guides_checkbox = group_create.panel.guides.thing.checkbox_guides;
      guides_checkbox.value = global_options.get('include_guides', true);

      prompt_save_label = group_create.panel.save.label_save;
      prompt_save_checkbox = group_create.panel.save.thing.checkbox_save;
      prompt_save_checkbox.value = global_options.get('prompt_save', true);

      create_btn = group_create.panel.button_create;
      create_btn.view = this;

      group_create.visible = false;

      group_export = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      panel:Panel{\
        size:[300,300],\
        text:'Export',\
        text1:EditText{text:'',characters:25,active:true},\
        icon1:IconButton{title:'Create', image:'Step1Icon'},\
        button0:RadioButton{text:'Create',icon:'Step1Icon'},\
        list0:ListBox{multiselect:true},\
        dropdown0:DropDownList{},\
        progress0:Progressbar{preferredSize:[250,30]}\
      }}");
      group_create.visible = false;

      group_optimize = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      panel:Panel{\
        size:[300,300],\
        text:'Optimize',\
        text1:EditText{text:'',characters:25,active:true},\
        icon1:IconButton{title:'Create', image:'Step1Icon'},\
        button0:RadioButton{text:'Create',icon:'Step1Icon'},\
        list0:ListBox{multiselect:true},\
        dropdown0:DropDownList{},\
        progress0:Progressbar{preferredSize:[250,30]}\
      }}");
      group_optimize.visible = false;

      group_help = group_action.add("group{\
      orientation:'column',\
      alignment:'top',\
      panel:Panel{\
        text:'Help',\
        size:[300,300],\
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

      update_txt = group_help.panel.text_update;
      update_btn = group_help.panel.button_update;
      documentation_txt = group_help.panel.text_documentation;
      documentation_btn = group_help.panel.button_documentation;
      script_txt = group_help.panel.text_script;
      script_btn = group_help.panel.button_script;
      language_txt = group_help.panel.group0.text_language;

      language_list = group_help.panel.group0.list_language;
      for (i = 0; i < LC_LANGUAGES.length; i++) {
        var item = language_list.add('item', '');
        item.code = LC_LANGUAGES[i].code;
        if (selected_language == item.code) {
          language_list.selection = item;
        }
      }
      language_list.view = this;
      language_list.addEventListener('change',
        function(evt) {
          var lang = language_list.selection.code;
          selected_language = lang;
          global_options.set('language', lang);
          reset();
        });

      group_help.visible = false;

      group_log = group_action.add("group{\
      orientation:'column',\
      text_language:EditText{size:[300,300],multiline:true},\
      }}");

      group_log.visible = false;

      if (model) {
        // actions_list.selection.index = model.getActionDisplay();
        action_selection = document_options.get('action_display', 0);
      }

      updateActionDisplay();
  };

  var reset = function() {
    if (typeof main_window != "undefined") main_window.close();
    init(); // need to recreate the controls so autolayout works
    // action_selection = document_options.get('action_display', 0);
    updateHandlers();
    loadLanguage(selected_language);
    updateLabels();
    main_window.show();
  };

  var updateHandlers = function() {
    create_btn.addEventListener('click', function() {
      var properties = {
        'count': panel_count_txt.text,
        'name': picklet_title_txt.text,
        'guides': guides_checkbox.value,
        'save': prompt_save_checkbox.value
      };
      main_window.close();
      controller.createPicklet(properties);
    });
    main_window.cancelElement = close_btn;
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
    // model.setLanguage(language);
    global_options.set('language', language);
  };

  var updateActionDisplay = function() {
    group_create.visible = false;
    group_export.visible = false;
    group_optimize.visible = false;
    group_help.visible = false;
    group_log.visible = false;
    if (action_selection == 0) {
      group_create.visible = true;
      main_window.defaultElement = create_btn;
    } else if (action_selection == 1) {
      group_export.visible = true;
    } else if (action_selection == 2) {
      group_optimize.visible = true;
    } else if (action_selection == 3) {
      group_help.visible = true;
    } else {
      group_log.visible = true;
    }
    // model.setActionDisplay(action_selection);
    document_options.set('action_display', action_selection);
    actions_list.selection = action_selection;
    actions_list.active = true; // set keyboard focus to the list
  };
  
  var updateLabels = function() {
      var params = {
          "domain": "messages",
          "locale_data": json_locale_data
      };
      gt = new Gettext(params);
      function _(msgid) {
          return gt.gettext(msgid);
      }

      /// the title of the dialog
      main_window.text = _("Picklet Export");

      /// label for 'close' button on dialog
      close_btn.text = _("Close");

      var item = actions_list.add('item', _("Create"));
      item.icon = 'Step1Icon';
      actions_list.active = true; // set keyboard focus to the list
      item = actions_list.add('item', _("Export"));
      item.icon = 'Step2Icon';
      item = actions_list.add('item', _("Optimize"));
      item.icon = 'Step3Icon';
      actions_list.add('item', _("Help"));
      actions_list.add('item', _("Review"));
      // actions_list.selection = model.getActionDisplay();
      actions_list.selection = document_options.get('action_display', 0);

      /// script name and version identifier
      script_name_txt.text = _("PickletExport.jsx r13");

      /// text introducing button that queries the server for current version of script
      update_txt.text = _("Check for update");

      /// label on button that checks for udpates
      update_btn.text = _("Check");

      /// text prompting user to click the button to read online documentation
      documentation_txt.text = _("Read documentation online");

      /// button label that opens a browser on the documentation
      documentation_btn.text = _("Open");

      /// text prompt to reveal the script in the Finder
      script_txt.text = _("Reveal script in Finder");

      /// button label that opens the Finder to reveal the script
      script_btn.text = _("Show");

      /// footer text. credits.
      footer_txt.text = _("(c) 2012 RobotInaBox Pty Ltd");

      /// label for the group of options for the 'Create' action
      create_txt.text = _("New document");

      /// label for dropdown list to choose a language for the displayed dialog
      language_txt.text = _("Language");
      for (i = 0; i < language_list.items.length; i++) {
        language_list.items[i].text = _(LC_LANGUAGES[i]['name']);
      }

      /// button label to create a new picklet document
      create_btn.text = _("Create");

      guides_label.text = _("Include guides:");
      prompt_save_label.text = _("Prompt to save:");

      panel_count_txt.text = '1';
      picklet_title_txt.text = _("Untitled Picklet");

  };
  
  var put_options = function() {
    // get CustomOptions to save their storable options.
    global_options.set('include_guides', guides_checkbox.value);
    global_options.set('prompt_save', prompt_save_checkbox.value);

    global_options.put();
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




