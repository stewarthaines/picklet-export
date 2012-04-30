var json_locale_set = [];

PickletExportView = function() {

  // these language names get localized, with unicode text pulled from external file
  this.LC_LANGUAGES = [
    {'code': 'en', 'name': 'English'},
    {'code': 'fr', 'name': 'French'},
    {'code': 'zh', 'name': 'Standard Chinese'}
  ];

  var main_window;
  var close_btn;

  // sidebar
  var script_name_txt;
  this.actions_list;

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
  var export_btn;
  var optimize_btn;
  var create_txt;
  var language_txt;
  var language_btn;
  
  // create
  var create_btn;
  
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
  var selected_language = 'en';
  
  this.action_selection = 0;
  this.controller = null;
  this.model = null;

  return this;
};

PickletExportView.prototype.setModel = function(model) {
  this.model = model;
};

PickletExportView.prototype.setController = function(controller) {
  this.controller = controller;
};

PickletExportView.prototype.init = function() {

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
        main_window.close();
    });

    var sidebar = content.add("group{\
      orientation:'column',\
      list_actions:ListBox{preferredSize:[150, 250], properties:{scrolling:false}},\
    }");

    this.actions_list = sidebar.list_actions;
    var font = ScriptUI.newFont (this.actions_list.graphics.font.name, 14);
    this.actions_list.graphics.font = font;

    this.actions_list.view = this;
    this.actions_list.addEventListener('change', function () {
      if (this.selection == null) {
        // preserve the selection. don't allow it to be set to null
        this.selection = this.view.action_selection;
      }
      // action_selection is the index, rather than the text, for i18n purposes
      this.view.action_selection = this.selection.index;
      this.view.updateActionDisplay();
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
      panel_count:Group{\
        label_panel_count:StaticText{text:'Number of panels:'},\
        text_panel_count:EditText{text:'',characters:15,active:true},\
      },\
      title:Group{\
        label_title:StaticText{text:'Picklet title:'},\
        text_title:EditText{text:'',characters:15,active:true},\
      },\
      button_create:Button{},\
    }}");

    create_txt = group_create.panel;
    create_btn = group_create.panel.button_create;

    group_create.visible = false;

    group_export = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    panel:Panel{\
      text:'Export',\
      text1:EditText{text:'',characters:30,active:true},\
      icon1:IconButton{title:'Create', image:'Step1Icon'},\
      button0:RadioButton{text:'Create',icon:'Step1Icon'},\
      list0:ListBox{multiselect:true},\
      dropdown0:DropDownList{},\
      progress0:Progressbar{preferredSize:[300,30]}\
    }}");
    group_create.visible = false;

    group_optimize = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    panel:Panel{\
      text:'Optimize',\
      text1:EditText{text:'',characters:30,active:true},\
      icon1:IconButton{title:'Create', image:'Step1Icon'},\
      button0:RadioButton{text:'Create',icon:'Step1Icon'},\
      list0:ListBox{multiselect:true},\
      dropdown0:DropDownList{},\
      progress0:Progressbar{preferredSize:[300,30]}\
    }}");
    group_optimize.visible = false;

    group_help = group_action.add("group{\
    orientation:'column',\
    alignment:'top',\
    panel:Panel{\
      text:'Help',\
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
    for (i = 0; i < this.LC_LANGUAGES.length; i++) {
      var item = language_list.add('item', '');
      item.code = this.LC_LANGUAGES[i].code;
      if (this.selected_language === item.code) {
        language_list.selection = item;
      }
    }
    language_list.view = this;
    language_list.addEventListener('change',
      function(evt) {
        var lang = language_list.selection.code;
        this.view.selected_language = lang;
        this.view.reset();
      });
  
    group_help.visible = false;

    group_log = group_action.add("group{\
    orientation:'column',\
    text_language:EditText{size:[300,300],multiline:true},\
    }}");

    group_log.visible = false;

    if (this.model) {
      // this.actions_list.selection.index = this.model.getActionDisplay();
      this.action_selection = this.model.getActionDisplay();
    }

    this.updateActionDisplay();
};

PickletExportView.prototype.reset = function() {
  if (typeof main_window != "undefined") main_window.close();
  this.init();
  this.action_selection = this.model.getActionDisplay();
  this.loadLanguage(this.selected_language);
  this.updateLabels();
  main_window.show();
};

PickletExportView.prototype.show = function(lang) {
  if (typeof lang == 'undefined') { lang = 'en'; }
  this.selected_language = lang;
  this.reset();
};

PickletExportView.prototype.loadLanguage = function(language) {
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
  this.model.setLanguage(language);
}


PickletExportView.prototype.updateActionDisplay = function() {
  group_create.visible = false;
  group_export.visible = false;
  group_optimize.visible = false;
  group_help.visible = false;
  group_log.visible = false;
  if (this.action_selection == 0) {
    group_create.visible = true;
  } else if (this.action_selection == 1) {
    group_export.visible = true;
  } else if (this.action_selection == 2) {
    group_optimize.visible = true;
  } else if (this.action_selection == 3) {
    group_help.visible = true;
  } else {
    group_log.visible = true;
  }
  this.model.setActionDisplay(this.action_selection);
  this.actions_list.selection = this.action_selection;
};

PickletExportView.prototype.updateLabels = function() {
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

    var item = this.actions_list.add('item', _("Create"));
    item.icon = 'Step1Icon';
    this.actions_list.active = true; // set keyboard focus to the list
    item = this.actions_list.add('item', _("Export"));
    item.icon = 'Step2Icon';
    item = this.actions_list.add('item', _("Optimize"));
    item.icon = 'Step3Icon';
    this.actions_list.add('item', _("Help"));
    this.actions_list.add('item', _("Review"));
    // this.actions_list.selection = 0;
    this.actions_list.selection = this.model.getActionDisplay();

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
      language_list.items[i].text = _(this.LC_LANGUAGES[i]['name']);
    }

    /// button label to create a new picklet document
    create_btn.text = _("Create");
};