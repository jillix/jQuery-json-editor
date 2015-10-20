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
    var ORDER_PROPERTY = "_order";

    /*!
     * findValue
     * Finds a value in parent (object) using the dot notation passed in dotNot.
     *
     * @name findValue
     * @function
     * @param {Object} parent The object containing the searched value.
     * @param {String} dotNot Path to the value. If it is not given or it is an
     * empty string, the entire `parent` object will be returned.
     * @return {Anything} Found value or undefined.
     */
    function findValue(parent, dotNot) {

        if (!dotNot) return parent;

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
     * Converts an object to a flat one.
     *
     * @name flattenObject
     * @function
     * @param {Object} obj The object that should be converted.
     * @return {Object} Flattened object.
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
     * Converts a flat object to an unflatten one.
     *
     * @name unflattenObject
     * @function
     * @param {Object} flat The flat object that should be converted.
     * @return {Object} Unflattened object.
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
     * @param {Object} obj Object with numbers as keys or containing objects
     * with numbers as keys.
     * @return {Object} The object with numbers as keys or containing objects
     * with numbers as keys converted to an array or an object with arrays.
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
     * @param {Object} obj2 The second object.
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
     * @param {String} path The path to the field value (default: `""`).
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
            var _schemaContainsMoreFields = schemaContainsMoreFields(c);
            // If the schema contains more fields
            if (_schemaContainsMoreFields) {
                // recursively process them
                schemaCoreFields(c.schema, path + k + ".");

            // If the type is not specified but a non-empty array of
            // possible values is specified
            } else if (!c.type && c.possible) {
                // set the type obtained by analyzing the first possible value
                c.type = getTypeOf(c.possible[0]);
            }
            c.label = c.label || k;
            c.path = path + k;
            c.name = k;

            // If the `c` schema contains more fields and it does not have the
            // order of its fields specified,
            if (_schemaContainsMoreFields &&
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
            "[object Date]"                      : "date",
            "[object Error]"                     : "error"
        };

        if ($.isArray(o)) return "array";
        return types[o && Object.prototype.toString.call(o)] ||
            types[typeof o] || types[o] || (o ? "object" : "null");
    }

    /*!
     * knownElementaryFieldTypes
     * An array with the known field types without `array` and `object`.
     *
     * @name knownElementaryFieldTypes
     * @constant
     * @type {Array}
     * @default
     */
    var knownElementaryFieldTypes = ["number", "boolean", "string", "regexp",
        "date"];

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
     *  - `autoInit` (Boolean): If `true`, the forms will be added by default
     *  (default: `true`).
     *
     * @return {Object} The JSON editor object containing:
     *
     *  - `labels` (Object): An object with UI elements used for labels.
     *  - `groups` (Object): An object with UI elements used for groups.
     *  - `inputs` (Object): An object with UI elements used for inputs.
     *  - `container` (jQuery): A jQuery object being the container of the JSON
     *  editor.
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
                    var order = field.schema[ORDER_PROPERTY];
                    for (var i = 0; i < order.length; i++) {
                        var k = order[i];
                        var c = field.schema[k];
                        headers.push(c.name);
                        $ths.push($("<th>", { text: c.label || "Values" }));
                    }
                }
                $headers.append($ths);

                // footers (with add new item controls)
                $footers = $tfoot.children("tr");
                var $tdfs = [];
                var $addButton = $("<input>", {
                    type: "button",
                    val: "+",
                    on: {
                        click: function () {
                            self.add($input, self.getData(field.path + ".+",
                                        $input, true));
                            self.setData(field.path + ".+", {});
                        }
                    },
                    "data-json-editor-control": "add"
                });
                // TODO: maybe we should use self.add here too after extending
                // it a bit, in both branches of the `if` structure:
                if (typeof Object(field.schema).type === "string") {
                    var $td = $("<td>");
                    var sch = field.schema;
                    $tdfs.push($td.append(self.createGroup($.extend(true, {}, sch, {
                        type: field.schema.type,
                        // special path for the new edited item:
                        path: field.path + ".+"
                    }))));
                    $td.append($addButton);
                } else {
                    for (var i = 0; i < headers.length; ++i) {
                        var sch = field.schema[headers[i]];
                        // special path for the new edited item:
                        var path = field.path + ".+." + headers[i];

                        // If the schema contains a label
                        if (sch.label) {
                            // we clone the schema and remove the label from the
                            // clone so we do not affect other objects
                            sch = $.extend(true, {}, sch);
                            delete sch.label;
                        }

                        $tdfs.push($("<td>").append(self.createGroup($.extend(true, {}, sch, {
                            path: path
                        }))));
                    }
                    $tdfs.push($("<td>").append($addButton));
                }
                $footers.append($tdfs);

                for (var i = 0; i < fieldData.length; ++i) {
                    self.add($input, fieldData[i]);
                }

            } else if (field.type === "object") {
                $input = [];
                var order = field.schema[ORDER_PROPERTY];
                for (var i = 0; i < order.length; i++) {
                    var k = order[i];
                    var cField = field.schema[k];
                    $input.push(self.createGroup($.extend(true, {}, cField, {
                        path: field.path + "." + k,
                        _edit: field.edit,
                        deletable: field.deletableFields
                    })));
                }

                if (field.addField) {
                    $input.push(self.createNewFieldEditor(field.path,
                                field.deletableFields, $input));
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

                self.setValueToElement($input, fieldData);
            }

            // Append the created input to the group element, the one returned
            // by the function.
            var $label = $group.find("label");
            $label.append($input);
            // If the field is marked as deletable, add a delete button after
            // its input element.
            if (field.deletable) {
                $label.append($("<input>", {
                    type: "button",
                    value: "× Delete field",
                    on: {
                        click: function () {
                            // When the Delete field button is clicked, remove
                            // the group element from the document (the group
                            // element contains the input element and the Delete
                            // field button).
                            $group.remove();
                        }
                    }
                }));
            }
            return $group;
        };

        /**
         * resetPathIndicesInTable
         * If a table contains these paths: `hobbies.0`, `hobbies.2` without
         * `hobbies.1`, after calling this function, the `hobbies.2` paths will
         * be replaced with `hobbies.1` paths. This function is called afer
         * deleting a row in a table, in a callback in the `add` function.
         *
         * @name resetPathIndicesInTable
         * @function
         * @param {String|jQuery} path A jQuery object indicating the table, or
         * a path to a table.
         * @return {undefined}
         */
        self.resetPathIndicesInTable = function (path) {
            var $table;
            if (path.constructor === jQuery) {
                $table = path;
                path = $table.attr("data-json-editor-path");
            } else {
                $table = $("table[data-json-editor-path='" + path + "']", self.container);
            }

            // For each row in the table
            $table.children("tbody").children("tr").each(function (i, tr) {
                var $tr = $(tr);
                // get the index in the paths under the current row
                var currentIndex = $tr.find("[data-json-editor-path]:first")
                    .attr("data-json-editor-path");
                currentIndex = currentIndex.substring(path.length + 1);
                currentIndex = currentIndex.replace(/\..*$/, "");
                currentIndex = parseInt(currentIndex);
                // if the index in the paths is different than the index of the
                // row
                if (i !== currentIndex) {
                    // for each subelement with a path
                    $tr.find("[data-json-editor-path]").each(function (ii, e) {
                        var newPath = $(e).attr("data-json-editor-path");
                        // replace in the path the old wrong index with the new
                        // index
                        newPath = newPath.replace(new RegExp("\\." +
                                    currentIndex + "\\."), "." + i + ".");
                        newPath = newPath.replace(new RegExp("\\." +
                                    currentIndex + "$"), "." + i);
                        $(e).attr("data-json-editor-path", newPath);
                    });
                }
            });
        };

        /*!
         * createNewFieldEditor
         * Returns a jQuery object containing a new field editor.
         *
         * @name createNewFieldEditor
         * @function
         * @param {String} path The path to the object in which the new field
         * editor will be inserted.
         * @param {Boolean} deletableFields Whether the fields created by this
         * field editor will be deletable.
         * @param {Array} $inputs An array of jQuery elements representing the
         * group elements containing input elements at the same level as the
         * new field editor destination in the UI.
         * @return {jQuery} The newly created field editor.
         */
        self.createNewFieldEditor = function (path, deletableFields, $inputs) {
            var $div = $("<div>");

            var $nameInput = $("<input>", {
                type: "text"
            });

            var $possibleValuesSelect = $("<select>", {
                multiple: "multiple"
            });

            var $typeSelect = $("<select>", {
                on: {
                    change: function () {
                        var type = $(this).val();
                        var $clone = JsonEdit.inputs[type].clone()
                            .attr("data-json-editor-type", type);
                        $possibleValueInput.replaceWith($clone);
                        $possibleValueInput = $clone;
                        self.setValueToElement($possibleValueInput,
                                getDefaultValueForType(type));
                        $possibleValuesSelect.empty();
                    }
                }
            });
            for (var i = 0; i < knownElementaryFieldTypes.length; i++) {
                $typeSelect.append($("<option>", {
                    value: knownElementaryFieldTypes[i],
                    text: knownElementaryFieldTypes[i]
                }));
            }

            var $labelInput = $("<input>", {
                type: "text"
            });

            var $possibleValuesDiv = $("<div>", {
                css: {
                    display: "none"
                }
            });

            var $checkboxPossibleValues = $("<input>", {
                type: "checkbox",
                on: {
                    change: function (e) {
                        $possibleValuesDiv.toggle(this.checked);
                    }
                }
            });

            var $possibleValueInput = $("<input>", {
            });

            var $addPossibleValueButton = $("<input>", {
                type: "button",
                value: "+ Add possible value",
                on: {
                    click: function () {
                        var val = self.getValueFromElement(
                                $possibleValueInput);
                        $possibleValuesSelect.append($("<option>", {
                            value: val,
                            text: val
                        }));
                    }
                }
            });

            var $deletePossibleValueButton = $("<input>", {
                type: "button",
                value: "× Delete selected possible values",
                on: {
                    click: function () {
                        $possibleValuesSelect.children("option:selected").remove();
                    }
                }
            });

            /*!
             * nameAlreadyExists
             * A function that determines whether the given name already exists
             * in a field under the path in which the user tries to create a new
             * field.
             *
             * @name nameAlreadyExists
             * @function
             * @param {String} name The name of the field to search for.
             * @return {Boolean} True if the name already exists, false
             * otherwise.
             */
            function nameAlreadyExists(name) {
                // Convert the array of jQuery elements to a jQuery object with
                // multiple elements.
                var $inputs2 = $($.map($inputs,
                            function (e) { return e.get(0); }));

                // Obtain the data at the path where the new field is created.
                var data = self.getData(path, $inputs2);

                // Return true if the given name is already in the data,
                // otherwise return false.
                return Object.keys(data).indexOf(name) > -1;
            }

            var $addFieldButton = $("<input>", {
                type: "button",
                value: "+ Add field",
                on: {
                    click: function () {
                        $nameInput.val($nameInput.val()
                                .replace(/\./g, "").trim());
                        $labelInput.val($labelInput.val().trim());

                        var name = $nameInput.val();
                        var label = $labelInput.val() || name;

                        // Validate.
                        if (name === "+" || name.length === 0 ||
                                nameAlreadyExists(name)) {
                            alert("The name of the field should be a" +
                                    " non-empty string without dots, " +
                                    "different than \"+\" and not " +
                                    "already existing under the " +
                                    "path \"" + path + "\".");
                            return;
                        }

                        var newSchema = {
                            name: name,
                            label: label,
                            type: $typeSelect.val(),
                            path: path + "." + name,
                            deletable: deletableFields
                        };
                        if ($checkboxPossibleValues.prop("checked")) {
                            var possibleValues = [];
                            var converter = self.converters[newSchema.type];
                            $possibleValuesSelect.children("option").each(
                                function (i, e) {
                                    possibleValues.push(converter($(e).val()));
                                });
                            newSchema.possible = possibleValues;
                        }

                        var $newGroup = self.createGroup(newSchema);
                        $inputs.push($newGroup);
                        $div.before($newGroup);

                        $nameInput.add($labelInput, $typeSelect,
                                $possibleValueInput).val(null);
                        $possibleValuesSelect.empty();
                        $checkboxPossibleValues.prop("checked", false)
                            .trigger("change");
                        $typeSelect.trigger("change");
                    }
                }
            });

            $typeSelect.trigger("change");
            $div.append($("<label>").append($("<hr>"),
                    $("<strong>").text("Add field"),
                    $("<br>"),
                    $("<label>").text("Name: ").append($nameInput),
                    $("<label>").text("Type: ").append($typeSelect),
                    $("<label>").text("Label (optional, without final semicolon): ")
                        .append($labelInput),
                    $("<br>"),
                    $("<label>").text("Enable possible values: ")
                        .append($checkboxPossibleValues),
                    $possibleValuesDiv.append($possibleValuesSelect,
                        $possibleValueInput, $addPossibleValueButton,
                        $deletePossibleValueButton),
                    $addFieldButton));
            return $div;
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
                $elm = $("[data-json-editor-path='" + path + "']",
                        self.container);
            }

            var fieldSchema = findValue(settings.schema, path);
            var $tbody = $elm.find("tbody");
            // The index of the newly added row, used in the paths
            var nextIndex = $tbody.children().length;
            var $tr = $("<tr>").appendTo($tbody);

            var $deleteButton = $("<button>", {
                text: "×",
                "data-json-editor-control": "delete",
                on: {
                    click: function () {
                        self.delete($(this).closest("tr"));
                        self.resetPathIndicesInTable($elm);
                    }
                }
            });

            // If the type of the schema is explicitly specified
            if (typeof Object(fieldSchema.schema).type === "string") {
                // then this is an array table with a single column
                var newSchema = $.extend(true, {}, fieldSchema.schema, {
                    type: getTypeOf(data),
                    path: fieldSchema.path + "." + nextIndex,
                    data: data
                });
                delete newSchema.label;
                $tr.append($("<td>").append(self.createGroup(newSchema),
                            $deleteButton));
            } else {
                // An array with the names of all the fields directly in this
                // schema
                var order = fieldSchema.schema[ORDER_PROPERTY];

                var fields = []; // Field names
                for (var i = 0; i < order.length; i++) {
                    fields.push(fieldSchema.schema[order[i]].name);
                }

                for (var i = 0; i < fields.length; ++i) {
                    // The schema of the current field
                    var sch = fieldSchema.schema[fields[i]];
                    // The path of the current field
                    var path = fieldSchema.path + "." + nextIndex + "." +
                        fields[i];

                    var newSchema = $.extend(true, {}, sch, {
                        path: path,
                        data: data[fields[i]]
                    });
                    delete newSchema.label;
                    $tr.append($("<td>").append(self.createGroup(newSchema)));
                }
                $tr.append($("<td>").append($deleteButton));
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
         * getValueFromElement
         * Returns the value of the specified jQuery input element. This is
         * different than the simple jQuery `val` method because it returns a
         * boolean value for inputs of type `checkbox`, it converts the string
         * value of a `date` input to a `Date` object and it does other
         * conversions based on the default or user `converters`.
         *
         * @name getValueFromElement
         * @function
         * @param {jQuery} $el The jQuery input element from which to extract
         * the value.
         * @return {Object} The value of the specified jQuery element.
         */
        self.getValueFromElement = function ($el) {
            var type = $el.attr("data-json-editor-type");

            var val;
            if ($el.attr("type") === "checkbox") {
                val = $el.prop("checked");
            } else {
                // The empty string below is necessary because the jQuery
                // `val` function on fields with possible values (which
                // possibly have the type "string" or "number", present in
                // the UI as <select>s, will return `null` if the set value
                // is not in the list of possible values and the implicit
                // value is `undefined` which may not be one of the possible
                // values. The string converter function called below
                // sometimes expects a non-null value.
                val = $el.val() || "";
            }

            var converter = self.converters[type];
            if (typeof converter === "function") {
                val = converter(val);
            }

            return val;
        }

        /**
         * setValueToElement
         * Sets a value to the specified jQuery input element. This is
         * different than the simple jQuery `val` method because it understands
         * boolean and `Date` values.
         *
         * @name setValueToElement
         * @function
         * @param {jQuery} $input The jQuery input element.
         * @param {Object} val The value to set to the specified input element.
         * @returns {undefined}
         */
        self.setValueToElement = function ($input, val) {
            var type = $input.attr("data-json-editor-type");

            // Set value in input
            if (type === "boolean") {
                $input.prop("checked", val);
            } else if (type === "date") {
                // input[type=date] accepts a UTC date, not a local date.
                // See http://stackoverflow.com/a/32972449/258462
                $input[0].valueAsDate = new Date(Date.UTC(val.getFullYear(),
                            val.getMonth(), val.getDate()));
            } else {
                $input.val(val);
            }
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
         * setData
         * Sets the specified data to the form input(s) at the specified path.
         *
         * @name setData
         * @function
         * @param {String} path The path of the form input(s) where to set the
         * data.
         * @param {Object} data The data object to set.
         * @param {jQuery} root Optional, the root jQuery element to search for
         * the given path. If not given, defaults to `self.container`.
         * @return {undefined}
         */
        self.setData = function (path, data, root) {
            root = root || self.container;

            $("[data-json-editor-path]", root).each(function () {
                var $this = $(this);

                var type = $this.attr("data-json-editor-type");
                if (type === "array") { return; }

                var p = $this.attr("data-json-editor-path");
                // If the current path does not start with the given path,
                // return.
                if (p.substring(0, path.length) !== path) { return; }
                // Remove the given path from the path of the current element.
                p = p.substring(path.length);
                if (p.length > 0) { // If the given path is not a direct value
                    // remove the . character at the beginning
                    p = p.substring(1);
                }

                var val = findValue(data, p);
                // If the value for path `p` is not given, set a default value.
                if (typeof val === "undefined") {
                    val = getDefaultValueForType(type);
                }
                self.setValueToElement($this, val);
            });
        };

        /**
         * getData
         * Collects data from form inputs and return the data object.
         *
         * @name getData
         * @function
         * @param {String} path Optional path at which to collect the data. If
         * not specified, the path will be the root path.
         * @param {jQuery} root Optional root element in which to search for the
         * specified path. If not specified, the root element will be
         * `self.container`. This is useful if the root element has not been
         * appended to `self.container` yet.
         * @param {Boolean} includeNewItemEditors Optional, if true the paths
         * ending in ".+" or containing ".+." will be included in the final data
         * object.
         * @return {Object} The object containing data taken from form inputs.
         */
        self.getData = function (path, root, includeNewItemEditors) {
            path = path || "";
            root = root || self.container;

            var directValue = false;
            var data = {};
            $("[data-json-editor-path]", root).each(function () {
                var $this = $(this);

                var type = $this.attr("data-json-editor-type");
                if (type === "array") { return; }

                var p = $this.attr("data-json-editor-path");
                // If the current path does not start with the given path (which
                // is by default an empty string), return.
                if (p.substring(0, path.length) !== path) { return; }
                // Remove the given path from the path of the current data in
                // the final data object.
                p = p.substring(path.length);
                // If the given path is not a direct value
                if (p.length > 0 && path.length > 0) {
                    // remove the . character at the beginning
                    p = p.substring(1);
                }

                // If includeNewItemEditors is not true and this is the path of
                // a new item editor in a table, skip.
                if (!includeNewItemEditors && /(\.\+$|\.\+\.)/.test(p)) { return; }

                var val = self.getValueFromElement($this);
                if (p.length > 0) { // If the given path is not a direct value
                    data[p] = val;
                } else {
                    directValue = true;
                    data = val;
                }
            });

            $("[data-json-object-key]", root).each(function () {
                var $this = $(this);
                var path = $this.attr("data-json-key-path");
                var value = data[path];
                delete data[path];
                data[$this.val()] = value;
            });

            if (directValue) {
                return data;
            }
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
            return new Date(value + " UTC");
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
