(function ($) {


    /**
     * findValue
     * Finds a value in parent (object) using the dot notation passed in dotNot.
     *
     * @name findValue
     * @function
     * @param {Object} parent The object containing the searched value
     * @param {String} dotNot Path to the value
     * @return {Anything} Found value or undefined
     */
    function findValue(parent, dotNot) {

        if (!dotNot || !dotNot) return undefined;

        var splits = dotNot.split(".");
        var value;

        for (var i = 0; i < splits.length; ++i) {
            value = parent[splits[i]];
            if (value === undefined) return undefined;
            if (typeof value === "object") parent = value;
        }

        return value;
    }

    /**
     * flattenObject
     * Converts an object to a flat one
     *
     * @name flattenObject
     * @function
     * @param {Object} obj The object that should be converted
     * @return {Object} Flatten object
     */
    function flattenObject(obj) {

        var result = {};

        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            if (obj[key] && obj[key].constructor === Object) {
                var flat = flattenObject (obj[key]);
                for (var x in flat) {
                    if (!flat.hasOwnProperty(x)) {
                         continue;
                    }

                    result[key + '.' + x] = flat[x];
                }
            } else {
                result[key] = obj[key];
            }
        }
        return result;
    }

    /**
     * unflattenObject
     * Converts a flat object to an unflatten one
     *
     * @name unflattenObject
     * @function
     * @param {Object} flat The flat object that should be converted
     * @return {Object} Unflatten object
     */
    function unflattenObject(flat) {

        var result = {};
        var parentObj = result;

        var keys = Object.keys(flat);
        for (var i = 0; i < keys.length; ++i) {

            var key = keys[i];
            var subkeys = key.split('.');
            var last = subkeys.pop();

            for (var ii = 0; ii < subkeys.length; ++ii) {
                var subkey = subkeys[ii];
                parentObj[subkey] = typeof parentObj[subkey] === 'undefined' ? {} : parentObj[subkey];
                parentObj = parentObj[subkey];
            }

            parentObj[last] = flat[key];
            parentObj = result;
        }

        return result;
    }

    function getTypeOf(o) {

        var types = {
            "undefined"                          : "undefined",
            "number"                             : "number",
            "boolean"                            : "boolean",
            "string"                             : "string",
            "[object Function]"                  : "function",
            "[object RegExp]"                    : "regexp",
            "function Array() { [native code] }" : "array",
            "function Date() { [native code] }"  : "date",
            "[object Error]"                     : "error"
        };

        return types[o && o.constructor] || types[typeof o] || types[o] || (o ? "object" : "null");
    }

    function mergeRecursive (obj1, obj2) {
        for (var p in obj2) {
            try {
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                obj1[p] = obj2[p];
            }
        }

        return obj1;
    }

    var JsonEdit = $.fn.jsonEdit = function (opt_options) {

        var settings = $.extend({
            data: {},
            schema: {},
            container: this,
            autoInit: true
        }, opt_options);

        var self = {
            ui: $.extend(JsonEdit.ui, opt_options.ui),
            labels: $.extend(JsonEdit.labels, opt_options.labels),
            groups: $.extend(JsonEdit.groups, opt_options.groups),
            inputs: $.extend(JsonEdit.inputs, opt_options.inputs),
            converters: $.extend(JsonEdit.converters, opt_options.converters),
            createGroup: function (field) {

                // Create form group
                var $group = self.groups[field.type].clone(true);

                // TODO Configurable
                // Add label
                $group.find("label").append(self.labels[field.type].clone(true).text(field.label));

                // Add input
                var $input = null;
                if (field.type == "array") {
                    // TODO Configurable
                    var $headers = null;
                    var $tbody = null;
                    $input = $("<table>").append([
                        $headers = $("<thead>").append("<tr>"),
                        $tbody = $("<tbody>")
                    ]);

                   var fieldData = self.getValue(field.path);
                   var headers = [];
                   // headers
                   for (var k in field.schema) {
                       var c = field.schema[k];
                       headers.push(c.name);
                       $headers.append(
                            $("<th>", { text: c.label || "Values" })
                       );
                   }

                   for (var i = 0; i < fieldData.length; ++i) {
                      var cFieldData = fieldData[i];
                      var $tr = $("<tr>").appendTo($tbody);
                      if (typeof field.schema.type === "string") {
                         $tr.append($("<td>").append(self.createGroup({
                             type: getTypeOf(cFieldData),
                             path: field.path + "." + i
                         })));
                      } else {
                          for (var ii = 0; ii < headers.length; ++ii) {
                             var sch = field.schema[headers[ii]];
                             $tr.append($("<td>").append(self.createGroup({
                                 type: sch.type,
                                 path: sch.path.replace(new RegExp("^.?" + field.name + "."), field.name + "." + i + ".")
                             })));
                          }
                      }
                      // TODO
                   }

                } else if (field.type === "object") {
                    $input = [];
                    for (var k in field.schema) {
                        $input.push(self.createGroup(field.schema[k]));
                    }
                } else {
                    $input = self.inputs[field.type].clone(true).attr({
                        "data-json-editor-path": field.path
                    });

                    // Set value in input
                    var value = self.getValue(field.path);
                    if (field.type === "boolean") {
                        $input.prop("checked", value);
                    } else if (field.type === "date") {
                        $input[0].valueAsDate = value;
                    } else {
                        $input.val(value);
                    }
                }

                $group.find("label").append($input);


                return $group;
            },
            elms: {}
        };

        self.getValue = function (fieldPath) {
            return findValue(settings.data, fieldPath);
        };

        self.initUi = function () {

            function create(obj) {
                for (var k in obj) {
                    var c = obj[k];
                    settings.container.append(self.createGroup(c));
                }
            }

            create(settings.schema);
        };

        function sch(obj, out, path) {

            var schema = out || {};
            path = path || "";

            var t = getTypeOf(obj);
            if (t !== "object") {
                return {
                    type: t
                };
            } else {
                for (var k in obj) {
                    var c = obj[k];
                    t = getTypeOf(c)

                    if (t === "array" || t === "object") {
                        schema[path + k] = {
                            schema: t === "array" ? sch(c[0]) : sch(c),
                            type: t
                        };
                        continue;
                    }

                    schema[path + k] = {
                        type: t
                    };
                }
            }

            return schema;
        }

        settings.schema = mergeRecursive(sch(settings.data), settings.schema);

        // Set fields in schema
        function visit(obj, path) {
            path = path || "";
            for (var k in obj) {
                var c = obj[k];
                if ((c.type === "array" && typeof Object(c.schema).type !== "string") || c.type === "object") {
                    visit(c.schema, path + k + ".");
                }
                c.label = c.label || k;
                c.path = path + k;
                c.name = k;
            }
        }

        visit(settings.schema);
        if (settings.autoInit === true) {
            self.initUi();
        }

        self.getData = function () {
            var data = {};
            $("[data-json-editor-path]", settings.container).each(function () {
                var $this = $(this);
                var path = $this.attr("data-json-editor-path");
                if ($this.attr("type") === "checkbox") {
                    data[path] = $this.prop("checked");
                } else {
                    data[path] = $this.val();
                }

                var converter = self.converters[settings.schema[path].type];
                if (typeof converter === "function") {
                    data[path] = converter(data[path]);
                }
            });
            return unflattenObject(data);
        };

        return self;
    };

    JsonEdit.converters = {
        boolean: function (value) {
            return (value === true || value === "true" || value === "on" || typeof value == "number" && value > 0 || value === "1");
        },
        string: function (value) {
            return value.toString();
        },
        number: function (value) {
            return Number (value);
        },
        regexp: function (value) {
            return new RegExp(value);
        },
        date: function (value) {
            return new Date(value);
        }
    };

    JsonEdit.groups = {
        "number":   $("<div>").append($("<label>")),
        "boolean":  $("<div>").append($("<label>")),
        "string":   $("<div>").append($("<label>")),
        "regexp":   $("<div>").append($("<label>")),
        "array":    $("<div>").append($("<label>")),
        "object":   $("<div>").append($("<label>")),
        "date":     $("<div>").append($("<label>"))
    };

    JsonEdit.labels = {
        "number": $("<span>"),
        "boolean": $("<span>"),
        "string": $("<span>"),
        "regexp": $("<span>"),
        "date": $("<span>"),
        "object": $("<h3>"),
        "array": $("<h3>")
    };

    JsonEdit.inputs = {
        "number": $("<input>", {type: "number"}),
        "boolean": $("<input>", {type: "checkbox"}),
        "string": $("<input>", {type: "text"}),
        "regexp": $("<input>", {type: "text"}),
        "date": $("<input>", {type: "date"}),
        "array": $("<input>", {type: "text"}),
    };
})($);

