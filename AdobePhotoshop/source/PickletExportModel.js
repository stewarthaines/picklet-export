PickletExportModel = function() {
  this.EXPORT_SETTINGS_GLOBAL_NAME = "Picklet-Export-Settings-Global";
  this.EXPORT_SETTINGS_PREFIX = "Picklet-Export-Settings-";

  this.global_info = new Object();
  this.document_info = new Object();
  
  // a default. pre all other defaults. why? who knows.
  this.global_info.current_language = 'en';
};

PickletExportModel.prototype.getActionDisplay = function() {
  return this.document_info.action_display;
};

PickletExportModel.prototype.setActionDisplay = function(val) {
  this.document_info.action_display = val;
};

PickletExportModel.prototype.finish = function() {
  // alert('finish with: ' + this.document_info.action_display);
  var d1 = objectToDescriptor(this.global_info);
  // d.putString( app.charIDToTypeID( 'Msge' ), strMessage );
  app.putCustomOptions(this.EXPORT_SETTINGS_GLOBAL_NAME, d1);

  var d2 = objectToDescriptor(this.document_info);
  // d.putString( app.charIDToTypeID( 'Msge' ), strMessage );
  app.putCustomOptions(this.EXPORT_SETTINGS_PREFIX + app.activeDocument.fullName, d2);
};

PickletExportModel.prototype.setLanguage = function(language) {
  this.global_info.current_language = language;
};

PickletExportModel.prototype.init = function() {
  // provide defaults for all data

  // try to get persisted values for model
  try {
    var d = app.getCustomOptions(this.EXPORT_SETTINGS_GLOBAL_NAME);
    descriptorToObject(this.export_info, d);
  }
  catch(e) {
    // alert('didn\'t load global defaults');
    // it's ok if we don't have any options, continue with defaults
  }
  
  // document-level settings
  this.document_info.action_display = 0;
  this.document_info.selectionOnly = false;
  this.document_info.exportThumbnails = true;
  this.document_info.fileType = 0; //pngIndex;
  this.document_info.saveRetinaResolution = true;
  this.document_info.exportCovers = true;
  this.document_info.savePickletTemplate = true;
  this.document_info.exportSelectedFullsize = true;
  this.document_info.exportOrangeAs8Bit = true;
  try {
      this.document_info.destination = Folder(app.activeDocument.fullName.parent).fsName;
      // destination folder
      var tmp = app.activeDocument.fullName.name;
      this.document_info.fileNamePrefix = decodeURI(tmp.substring(0, tmp.indexOf(".")));
  } catch(someError) {
      this.document_info.destination = new String("");
      this.document_info.fileNamePrefix = app.activeDocument.name;
  }

  // try to get persisted values for model
  try {
    var d = app.getCustomOptions(this.EXPORT_SETTINGS_PREFIX + app.activeDocument.fullName);
    descriptorToObject(this.document_info, d);
  }
  catch(e) {
    // alert('didn\'t load document defaults');
    // it's ok if we don't have any options, continue with defaults
  }
  
};

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
function descriptorToObject(o, d) {
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
function objectToDescriptor(o) {
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

