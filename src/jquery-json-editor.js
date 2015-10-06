/*!
 *  jQuery JSON Editor
 *  ==================
 *  A jQuery plugin for editing JSON data.
 *
 *  Developed with JavaScript and <3 by jillix developers.
 *  Licensed under the MIT license.
 * */
(function ($) {

    /*!
     * ORDER_PROPERTY
     * Contains the name of the property in the schemas which contains the
     * order in which the fields from the schemas should be laid down in the
     * user interface.
     *
     * @name ORDER_PROPERTY
     * @constant
     * @type {String}
     * @default
     */
    var ORDER_PROPERTY = "order";

    /*!
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

        if (!dotNot) return undefined;

        var splits = dotNot.split(".");
        var value;

        for (var i = 0; i < splits.length; ++i) {
            value = parent[splits[i]];
            if (value === undefined) return undefined;
            if (typeof value === "object") parent = value;
        }

        return value;
    }

    /*!
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

    /*!
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

    /*!
     * handleArrays
     * Converts object like `{ 0: ..., 1: ..., 2: ... }` into `[..., ..., ...]`.
     *
     * @name handleArrays
     * @function
     * @param {Object} obj Object containing objects with numbers as keys.
     * @return {Object} The object with converted objects in arrays.
     */
    function handleArrays(obj) {
        var convert = true;
        var keys = Object.keys(obj).map(function (key) {
            var val = parseInt(key, 10);
            if (isNaN(val)) {
                convert = false;
            }
            return val;
        }).sort();

        var arr = convert ? [] : obj;
        if (!convert) {
            for (var k in obj) {
                if (obj[k] && obj[k].constructor === Object) {
                    arr[k] = handleArrays(obj[k]);
                }
            }
        } else {
            keys.forEach(function (key) {
                if (obj[key] && obj[key].constructor === Object) return (arr[key] = handleArrays(obj[key]));
                arr.push(obj[key]);
            });
        }
        return arr;
    }

    /*!
     * mergeRecursive
     * Merges the two objects in the first object.
     *
     * @name mergeRecursive
     * @function
     * @param {Object} obj1 The first object.
     * @param {The second object.} obj2
     * @return {Object} The two objects merged in the first one.
     */
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

    /*!
     * sch
     * Creates the schema object providing data.
     *
     * @name sch
     * @function
     * @param {Object} obj The current field object.
     * @param {Object} out The field that should be edited (default: `{}`).
     * @param {String} path The path to the field value.
     * @return {Object} The schema object.
     */
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
                t = getTypeOf(c);

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

    /*!
     * schemaContainsMoreFields
     * Determines if a schema contains other fields (defines an array of objects
     * with one or more fields or an object with one or more fields).
     *
     * @name schemaContainsMoreFields
     * @function
     * @param {Object} schema The schema to analyze.
     * @return {Boolean} True if the schema contains more fields, false otherwise.
     */
    function schemaContainsMoreFields(schema) {
        return (schema.type === "array" &&
                typeof Object(schema.schema).type !== "string") ||
            schema.type === "object";
    }

    /*!
     * schemaCoreFields
     * Sets the core fields in schema.
     *
     * @name schemaCoreFields
     * @function
     * @param {Object} obj The current field object.
     * @param {String} path The path to the field value.
     * @return {undefined}
     */
    function schemaCoreFields(obj, path) {
        path = path || "";
        for (var k in obj) {
            if (!obj.hasOwnProperty(k) || k === ORDER_PROPERTY) continue;

            var c = obj[k];
            if (schemaContainsMoreFields(c)) {
                schemaCoreFields(c.schema, path + k + ".");
            }
            c.label = c.label || k;
            c.path = path + k;
            c.name = k;

            // If the `c` schema contains more fields and it does not have the
            // order of its fields specified,
            if (schemaContainsMoreFields(c) &&
                    !Array.isArray(Object(c.schema)[ORDER_PROPERTY])) {
                c.schema = c.schema || {};
                // Generate the default order of its fields using Object.keys.
                c.schema[ORDER_PROPERTY] = Object.keys(c.schema);
            }
        }
    }

    /*!
     * getTypeOf
     * Returns the type of input variable.
     *
     * @name getTypeOf
     * @function
     * @param {Anything} o The input variable.
     * @return {String} The type of the input variable.
     */
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

    /*!
     * getDefaultValueForType
     * Returns a default value for the specified schema field type.
     *
     * @name getDefaultValueForType
     * @function
     * @param {String} type The input type string.
     * @return {Anything} The default value for the specified type.
     */
    function getDefaultValueForType(type) {

        return {
            "number" : 0,
            "boolean": false,
            "string" : "",
            "regexp" : new RegExp(""),
            "date"   : new Date(),
            "object" : {},
            "array"  : []
        }[type];
    }

    /**
     * $.fn.jsonEdit
     * Initializes the JSON editor on selected elements.
     *
     * @name $.fn.jsonEdit
     * @function
     * @param {Object} opt_options An object containing the following fields:
     *
     *  - `data` (Object): The input JSON data (default: `{}`).
     *  - `schema` (Object): The JSON data schema. The provided object will be
     *  merged with default schema, which is the one obtained by processing the
     *  `data`.
     *  - `autoInit` (Boolean): If `true`, the forms will be added by default (default: `true`).
     *
     * @return {Object} The JSON editor object containing:
     *
     *  - `labels` (Object): An object with UI elements used for labels.
     *  - `groups` (Object): An object with UI elements used for groups.
     *  - `inputs` (Object): An object with UI elements used for inputs.
     *  - `container` (jQuery): A jQuery object being the container of the JSON editor.
     *  - `createGroup` (Function): Creates a form group.
     */
    var JsonEdit = $.fn.jsonEdit = function (opt_options) {

        // Default settings
        var settings = $.extend({
            data: {},
            schema: {},
            autoInit: true
        }, opt_options);

        // JSON Editor object
        var self = {

            // UI
            labels: $.extend(JsonEdit.labels, opt_options.labels),
            groups: $.extend(JsonEdit.groups, opt_options.groups),
            inputs: $.extend(JsonEdit.inputs, opt_options.inputs),
            container: this,

            // Data manipulation
            converters: $.extend(JsonEdit.converters, opt_options.converters),
        };

        /**
         * createGroup
         * Creates a form group and returns the jQuery object.
         *
         * @name createGroup
         * @function
         * @param {Object} field The field object.
         * @return {jQuery} The jQuery object form.
         */
        self.createGroup = function (field) {

            // Create form group
            var $group = self.groups[field.type].clone(true);

            // TODO Configurable
            var $label = self.labels[field.type].clone(true).text(field.label);
            if (findValue(field, "_edit.key")) {
                $label = self.inputs.string.clone(true).val(field.label);
                $label.attr({
                    "data-json-object-key": "true",
                    "data-json-key-path": field.path
                });
            }

            // Add label
            $group.find("label").append($label);

            var fieldData = field.data === undefined ? self.getValue(field.path) : field.data;

            // Add input
            var $input = null;
            if (field.possible) {
                // If the field data is not specified, use a default value.
                if (typeof fieldData === "undefined") {
                    fieldData = getDefaultValueForType(field.type);
                }

                // The input is a `<select>` with multiple possible answers
                // stored in the `field.possible` array.
                $input = $("<select>", {
                    attr: {
                        "data-json-editor-path": field.path,
                        "data-json-editor-type": field.type
                    }
                });

                // Convert the possible values to strings and add them to the
                // `<select>`.
                for (var i = 0; i < field.possible.length; i++) {
                    var t = field.possible[i].toString();
                    $input.append($("<option>", {
                        value: t,
                        text: t
                    }));
                }

                // Set the selected value to the one in `fieldData`.
                $input.val(fieldData);
            } else if (field.type == "array") {
                // If the field data is not specified, use a default value.
                if (typeof fieldData === "undefined") {
                    fieldData = [];
                }

                // TODO Configurable
                var $thead = null;
                var $tfoot = null;
                var $tbody = null;
                var $headers = null;
                var $footers = null;
                $input = $("<table>", {
                    "border": "1",
                    "data-json-editor-path": field.path,
                    "data-json-editor-type": "array"
                }).append([
                    $thead = $("<thead>").append("<tr>"),
                    $tfoot = $("<tfoot>").append("<tr>"),
                    $tbody = $("<tbody>")
                ]);

                $headers = $thead.children("tr");
                var headers = [];
                // headers
                var $ths = [];
                if (typeof Object(field.schema).type === "string") {
                    headers.push(field.schema.name);
                    $ths.push($("<th>", { text: field.schema.label || "Values" }));
                } else {
                    for (var k in field.schema) {
                        if (!field.schema.hasOwnProperty(k) || k === ORDER_PROPERTY) continue;

                        var c = field.schema[k];
                        headers.push(c.name);
                        $ths.push($("<th>", { text: c.label || "Values" }));
                    }
                }
                $headers.append($ths);

                // footers (with add new item controls)
                $footers = $tfoot.children("tr");
                var $tdfs = [];
                if (typeof Object(field.schema).type === "string") {
                    var $td = $("<td>");
                    var sch = field.schema;
                    $tdfs.push($td.append(self.createGroup($.extend(true, {}. sch, {
                        type: field.schema.type,
                        // special path for the new edited item:
                        path: field.path + ".+"
                    }))));
                    $td.append($("<input>", {
                        type: "button",
                        value: "+"
                    }));
                } else {
                    for (var i = 0; i < headers.length; ++i) {
                        var sch = field.schema[headers[i]];
                        // special path for the new edited item:
                        var path = field.path + ".+." + headers[i];
                        delete sch.label;
                        $tdfs.push($("<td>").append(self.createGroup($.extend(true, {}, sch, {
                            path: path
                        }))));
                    }
                    $tdfs.push($("<td>").append($("<input>", {
                        type: "button",
                        value: "+"
                    })));
                }
                $footers.append($tdfs);

                for (var i = 0; i < fieldData.length; ++i) {
                    var cFieldData = fieldData[i];
                    var $tr = $("<tr>").appendTo($tbody);
                    if (typeof Object(field.schema).type === "string") {
                        $tr.append($("<td>").append(self.createGroup($.extend(true, {}, field.schema, {
                            type: getTypeOf(cFieldData),
                            path: field.path + "." + i
                        }))));
                    } else {
                        for (var ii = 0; ii < headers.length; ++ii) {
                            var sch = field.schema[headers[ii]];
                            var path = field.path + "." + i + "." + headers[ii];
                            delete sch.label;
                            $tr.append($("<td>").append(self.createGroup($.extend(true, {}, sch, {
                                path: path
                            }))));
                        }
                    }
                }

            } else if (field.type === "object") {
                $input = [];
                var order = field.schema[ORDER_PROPERTY];
                for (var i = 0; i < order.length; i++) {
                    var k = order[i];
                    var cField = field.schema[k];
                    $input.push(self.createGroup($.extend(true, {}, cField, {
                        path: field.path + "." + k,
                        _edit: field.edit
                    })));
                }
            } else {
                // If the field data is not specified, use a default value.
                if (typeof fieldData === "undefined") {
                    fieldData = getDefaultValueForType(field.type);
                }

                $input = self.inputs[field.type].clone(true).attr({
                    "data-json-editor-path": field.path,
                    "data-json-editor-type": field.type
                });

                // Set value in input
                if (field.type === "boolean") {
                    $input.prop("checked", fieldData);
                } else if (field.type === "date") {
                    $input[0].valueAsDate = fieldData;
                } else {
                    $input.val(fieldData);
                }
            }

            $group.find("label").append($input);
            return $group;
        };

        /**
         * addControls
         * Adds delete button control.
         *
         * @name addControls
         * @function
         * @param {String} path The field path.
         * @return {undefined}
         */
        self.addControls = function (path) {
            var $table = $("table[data-json-editor-path='" + path + "']", self.container);
            if (!$table.length) { return; }
            $table.children("thead").children("tr").append($("<th>"));
            $table.children("tbody").children("tr").append($("<td>").append($("<button>", {
                text: "Delete",
                "data-json-editor-control": "delete"
            })));
            $table.on("click", "[data-json-editor-control='delete']", function () {
                self.delete($(this).closest("tr"));
            });
        };

        /**
         * add
         * Adds new elements in arrays.
         *
         * @name add
         * @function
         * @param {String|jQuery} path The path to the field or the jQuery object.
         * @param {Object} data Data to add.
         * @return {undefined}
         */
        self.add = function (path, data) {
            var $elm = null;
            if (path.constructor === jQuery) {
                $elm = path;
                $elm = $elm.closest("[data-json-editor-path]");
                path = $elm.attr("data-json-editor-path");
            } else {
                $elm = $("[data-json-editor-path='" + path + "']", self.container);
            }

            var fieldSchema = findValue(settings.schema, path);
            var $tbody = $elm.children("tbody");
            if (typeof Object(fieldSchema.schema).type === "string") {
                var $td = $("<td>").appendTo($("<tr>").appendTo($tbody));
                $td.append(self.createGroup({
                    path: fieldSchema.path + "." + $tbody.children("tr").length,
                    type: fieldSchema.schema.type,
                    schema: fieldSchema.schema,
                    data: data
                }));
            } else {
                throw new Error("Not yet implemented.");
            }
        };

        /**
         * delete
         * Deletes elements from arrays.
         *
         * @name delete
         * @function
         * @param {jQuery} path The <tr> element to be deleted.
         * @return {undefined}
         */
        self["delete"] = function (path) {
            $(path).remove();
        };

        /**
         * getValue
         * Returns the value of field.
         *
         * @name getValue
         * @function
         * @param {String} fieldPath The path to the value.
         * @return {Anything} The value taken from data.
         */
        self.getValue = function (fieldPath) {
            return findValue(settings.data, fieldPath);
        };

        /**
         * initUi
         * Creates the form from JSON data.
         *
         * @name initUi
         * @function
         * @return {undefined}
         */
        self.initUi = function () {

            function create(obj) {
                var order = obj[ORDER_PROPERTY];
                for (var i = 0; i < order.length; i++) {
                    var c = obj[order[i]];
                    self.container.append(self.createGroup(c));
                }
            }

            create(settings.schema);
        };

        /**
         * getData
         * Collects data from form inputs and return the data object.
         *
         * @name getData
         * @function
         * @return {Object} The object containing data taken from forms.
         */
        self.getData = function () {
            var data = {};
            $("[data-json-editor-path]", self.container).each(function () {
                var $this = $(this);
                var type = $(this).attr("data-json-editor-type");
                if (type === "array") { return; }
                var path = $this.attr("data-json-editor-path");
                if ($this.attr("type") === "checkbox") {
                    data[path] = $this.prop("checked");
                } else {
                    data[path] = $this.val();
                }

                var converter = self.converters[type];
                if (typeof converter === "function") {
                    data[path] = converter(data[path]);
                }
            });

            $("[data-json-object-key]", self.container).each(function () {
                var $this = $(this);
                var path = $(this).attr("data-json-key-path");
                var value = data[path];
                delete data[path];
                data[$this.val()] = value;
            });
            return handleArrays(unflattenObject(data));
        };

        // Merge schema object
        settings.schema = mergeRecursive(sch(settings.data), settings.schema);

        // Attach core fields to schema objects
        schemaCoreFields(settings.schema);

        // Auto init
        if (settings.autoInit === true) {
            self.initUi();
        }

        return self;
    };

    // Default converter functions
    JsonEdit.converters = {
        boolean: function (value) {
            return (value === true || value === "true" || value === "on" || typeof value === "number" && value > 0 || value === "1");
        },
        string: function (value) {
            return value.toString();
        },
        number: function (value) {
            return Number(value);
        },
        regexp: function (value) {
            return new RegExp(value);
        },
        date: function (value) {
            return new Date(value);
        }
    };

    // Default group elements
    JsonEdit.groups = {
        "number":   $("<div>").append($("<label>")),
        "boolean":  $("<div>").append($("<label>")),
        "string":   $("<div>").append($("<label>")),
        "regexp":   $("<div>").append($("<label>")),
        "array":    $("<div>").append($("<label>")),
        "object":   $("<div>").append($("<label>")),
        "date":     $("<div>").append($("<label>"))
    };

    // Default label elements
    JsonEdit.labels = {
        "number": $("<span>"),
        "boolean": $("<span>"),
        "string": $("<span>"),
        "regexp": $("<span>"),
        "date": $("<span>"),
        "object": $("<h3>"),
        "array": $("<h3>")
    };

    // Default input elements
    JsonEdit.inputs = {
        "number": $("<input>", {type: "number"}),
        "boolean": $("<input>", {type: "checkbox"}),
        "string": $("<input>", {type: "text"}),
        "regexp": $("<input>", {type: "text"}),
        "date": $("<input>", {type: "date"}),
        "array": $("<input>", {type: "text"}),
    };
})($);
