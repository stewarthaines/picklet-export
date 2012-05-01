CustomOptions = function(id) {
  this.options_id = id;

  this.custom_options = new Object();
  
  this.init();
};

CustomOptions.prototype.get = function(key, default_value) {
  if (typeof (this.custom_options[key]) == 'undefined') {
    this.custom_options[key] = default_value;
  }
  return this.custom_options[key];
};

CustomOptions.prototype.set = function(key, val) {
  this.custom_options[key] = val;
};

CustomOptions.prototype.put = function() {
  var d1 = this.objectToDescriptor(this.custom_options);
  app.putCustomOptions(this.options_id, d1);
};

CustomOptions.prototype.init = function() {
  // try to get persisted values for model
  try {
    var d = app.getCustomOptions(this.options_id);
    this.descriptorToObject(this.custom_options, d);
  }
  catch(e) {
    // alert('didn\'t load global defaults');
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
CustomOptions.prototype.descriptorToObject = function (o, d) {
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
CustomOptions.prototype.objectToDescriptor = function(o) {
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

