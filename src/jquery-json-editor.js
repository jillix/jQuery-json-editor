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

        var splits, value;

        if (!dotNot) return parent;

        splits = dotNot.split(".");

        for (var i = 0; i < splits.length; ++i) {
            value = parent[splits[i]];
            if (value === undefined) return undefined;
            if (typeof value === "object") parent = value;
        }

        return value;
    }

    /*!
     * putValue
     * Puts the given `value` in the `parent` object at the path decribed by the
     * dot notation string `dotNot`.
     *
     * @name putValue
     * @function
     * @param {Object} parent The object in which to put `value`.
     * @param {String} dotNot The path at which to insert the `value` in the
     * `parent` object.
     * @param {Object} value The value to put at the path `dotNot` in the
     * `parent` object.
     * @return {undefined}
     */
    function putValue(parent, dotNot, value) {

        var name, parent2;

        // We remove the last segment of the dot notation string (`dotNot`) and
        // store that last segment in the `name` variable which is used later.
        dotNot = dotNot.split(".");
        name = dotNot.pop();
        dotNot = dotNot.join(".");

        // We get the parent object in which the `value` should be inserted
        // inside the `name` property.
        parent2 = findValue(parent, dotNot);
        // If this searched parent object does not exist
        if (typeof parent2 === "undefined") {
            // We create it in the `obj` variable
            var obj = {};
            // Set its `name` property to the given `value`
            obj[name] = value;
            // And recursively call the `putValue` method to put `obj` at the
            // dot notation obtained above by removing the last segment from the
            // original dot notation.
            putValue(parent, dotNot, obj);
            // Then we return. We are done.
            return;
        }
        // Else if this searched parent object exists, we set its property with
        // the name stored in the `name` variable to the value `value`.
        parent2[name] = value;
    }

    /*!
     * deleteValue
     * Deletes the value in the `parent` object at the path decribed by the
     * dot notation string `dotNot`.
     *
     * @name deleteValue
     * @function
     * @param {Object} parent The object in which to delete the value at the
     * `dotNot` path.
     * @param {String} dotNot The path at which to delete the value.
     * @return {undefined}
     */
    function deleteValue(parent, dotNot) {

        var name, parent2;

        // We remove the last segment of the dot notation string (`dotNot`) and
        // store that last segment in the `name` variable which is used later.
        dotNot = dotNot.split(".");
        name = dotNot.pop();
        dotNot = dotNot.join(".");

        // We get the parent object of the value to be deleted.
        parent2 = findValue(parent, dotNot);
        // If the parent object of the value to be deleted (`parent2`) is
        // undefined
        if (typeof parent2 === "undefined") {
            // That means the value to be deleted does not exist so we return.
            return;
        }
        // Else we delete the property with the name `name` from the parent
        // object of the value to be deleted (`parent2`).
        delete parent2[name];
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
        // Get the keys of the object, which may be numbers as strings.
        var keys = Object.keys(obj);
        // We expect that the object will be converted to an array only if it is
        // not an empty object. If it is an empty object, it will remain an
        // empty object.
        var convert = keys.length !== 0;
        // We convert the keys array to an array of ints. If we detect a key
        // that cannot be converted to an int, we set the flag variable
        // `convert` to false, so we do not treat the object as one that should
        // be converted to an array (but we still call `handleArrays`
        // recursively on the subobjects.
        keys = keys.map(function (key) {
            var val = parseInt(key, 10);
            if (isNaN(val)) {
                convert = false;
            }
            return val;
        }).sort();

        // If the `convert` flag variable is set to true, we create the `arr`
        // variable as an empty array which we will fill. If it is not set to
        // true, we set `arr` to the original object, and then later we call the
        // `handleArrays` function recursively on subobjects. Finally, we return
        // `arr`.
        var arr = convert ? [] : obj;
        if (!convert) {
            for (var k in obj) {
                if (obj[k] && obj[k].constructor === Object) {
                    arr[k] = handleArrays(obj[k]);
                }
            }
        } else {
            keys.forEach(function (key) {
                if (obj[key] && obj[key].constructor === Object) {
                    return (arr[key] = handleArrays(obj[key]));
                }
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

        var t;
        var schema = out || {};
        path = path || "";

        t = getTypeOf(obj);
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

    /*!
     * isElementaryValue
     * Returns true if the argument is an elementary value (a number, a boolean,
     * a string, a regular expression or a date), and false otherwise (if the
     * argument is an object with one or more "own" properties.
     * Relevant StackOverflow question:
     * http://stackoverflow.com/q/33939789/258462 .
     *
     * @name isElementaryValue
     * @function
     * @param {Object} x The argument whose type to test.
     * @return {Boolean} True of `x` is an elementary value, false otherwise.
     */
    function isElementaryValue(x) {
        return typeof x === "number" ||
            typeof x === "boolean" ||
            typeof x === "string" ||
            x instanceof RegExp ||
            x instanceof Date;
    }

    /*!
     * escapeRegExp
     * Source and explanation here: http://stackoverflow.com/a/6969486/258462 .
     *
     * @name escapeRegExp
     * @function
     * @param {String} str The string in which to escape the special regular
     * expression characters.
     * @return {String} The escaped string.
     */
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /*!
     * replaceBeginningOfFieldPath
     * Replaces the beginning of a field path which is the `before` string with
     * the value of the `after` string.
     *
     * @name replaceBeginningOfFieldPath
     * @function
     * @param {String} s The field path in which to do the replacement.
     * @param {String} before The beginning of the field path to search for.
     * @param {String} after The string with which to replace the `before`
     * string found at the beginning of `s`.
     * @return {String} The string `s` with its beginning `before` replaced with
     * `after`.
     */
    function replaceBeginningOfFieldPath(s, before, after) {
        return s.replace(new RegExp("^" + escapeRegExp(before)), after);
    }

    /*!
     * jQueryClosestDescendant
     * Origin: http://stackoverflow.com/a/8962023/258462
     *
     * @name jQueryClosestDescendant
     * @function
     * @param {jQuery} $e The jQuery elements in which to search the closest
     * descendant matching the specified filter.
     * @param {String} filter The filter with which to test the descendants.
     * @return {jQuery} The closest descendant in the `$e` element matching the
     * `filter` selector.
     */
    function jQueryClosestDescendant($e, filter) {
        var $found = $(),
            $currentSet = $e; // Current place
        while ($currentSet.length) {
            $found = $currentSet.filter(filter);
            if ($found.length) break;  // At least one match: break loop
            // Get all children of the current set
            $currentSet = $currentSet.children();
        }
        return $found.first(); // Return first match of the collection
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
     *  - `defaultArrayFieldName` (String): The name that a single field in an
     *  array will take when adding a second field to the array. The default is
     *  "values".
     *  - `defaultArrayFieldLabel` (String): The label that a single field in an
     *  array will take. The default is "Values".
     *  - `orderProperty` (String): Contains the name of the property in the
     *  schemas which contains the order in which the fields from the schemas
     *  should be laid down in the user interface. Default value: "_order".
     *  - `messages` (Object): An object containing one or more of the following
     *  properties: `EDIT_FIELD_IN_ARRAY_WITHOUT_FIELDS` (default value:
     *  "Impossible situation: trying to edit a field in an array without
     *  fields."), `INVALID_FIELD_NAME` (default value: "The name of the field
     *  should be a non-empty string without dots, different than "+" and not
     *  already existing under the path "{0}".") (which can contain the string
     *  `{0}` that will be replaced with the path of the object in which the
     *  edited/added field is found). There properties are strings that should
     *  be translated in the language of the user. By default they contain the
     *  English version of the messages.
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

        var settings, self;

        // Default settings
        settings = $.extend({
            data: {},
            schema: {},
            autoInit: true,
            defaultArrayFieldName: "values",
            defaultArrayFieldLabel: "Values",
            orderProperty: "_order",
            messages: {
                EDIT_FIELD_IN_ARRAY_WITHOUT_FIELDS: "Impossible situation: " +
                    "trying to edit a field in an array without fields.",
                INVALID_FIELD_NAME: "The name of the field should be a " +
                    "non-empty string without dots, different than \"+\" and " +
                    "not already existing under the path \"{0}\"."
            }
        }, opt_options);

        // JSON Editor object
        self = {

            // UI
            labels: $.extend(JsonEdit.labels, opt_options.labels),
            groups: $.extend(JsonEdit.groups, opt_options.groups),
            inputs: $.extend(JsonEdit.inputs, opt_options.inputs),
            container: this,

            // Data manipulation
            converters: $.extend(JsonEdit.converters, opt_options.converters),
        };

        /*!
         * schemaCoreProperties
         * Sets the core properties in a field definition schema if they are not
         * set: `type` on fields with possible values that don't have it set,
         * `schema` and the value of `settings.orderProperty` inside `schema` on
         * fields of type "object" and "array", and on definitions of fields of
         * elementary type: `name`, `path` and `label`.
         *
         * @name schemaCoreProperties
         * @function
         * @param {Object} schema The current field schema object.
         * @param {String} path The path to the field value.
         * @return {undefined}
         */
        function schemaCoreProperties(schema, path) {
            path = path || "";
            for (var fieldName in schema) {
                var currentFieldDef, defCanContainMoreFields;

                // A field schema contains properties whose names are the names
                // of the fields in it and whose values are the field definition
                // of these fields, and besides these, a property with the name
                // stored in `settings.orderProperty` with the value being an
                // array of 0 or more strings. This property is required in the
                // schema resulted from the call to `schemaCoreProperties` but
                // it is optional in the schema passed to it which is the schema
                // given by the user. This `for` loop ignores the existing order
                // arrays inside the schemas.
                if (!schema.hasOwnProperty(fieldName) ||
                        fieldName === settings.orderProperty) continue;

                currentFieldDef = schema[fieldName];
                defCanContainMoreFields =
                    currentFieldDef.type === "object" ||
                    currentFieldDef.type === "array";
                // If the schema can contain more fields,
                if (defCanContainMoreFields) {
                    // recursively process them
                    schemaCoreProperties(currentFieldDef.schema, path +
                            fieldName + ".");

                // If the type is not specified but a non-empty array of
                // possible values is specified
                } else if (!currentFieldDef.type && currentFieldDef.possible) {
                    // set the type obtained by analyzing the first possible
                    // value
                    currentFieldDef.type = getTypeOf(
                            currentFieldDef.possible[0]);
                }
                currentFieldDef.label = currentFieldDef.label || fieldName;
                currentFieldDef.path = path + fieldName;
                currentFieldDef.name = fieldName;

                // If `currentFieldDef` can contain more fields and it does not
                // have the order of its fields specified,
                if (defCanContainMoreFields &&
                        !Array.isArray(Object(currentFieldDef.schema)
                            [settings.orderProperty])) {
                    // Generate an empty schema if there is no schema specified.
                    currentFieldDef.schema = currentFieldDef.schema || {};
                    // Generate the default order of the fields inside the
                    // schema using `Object.keys`.
                    currentFieldDef.schema[settings.orderProperty] =
                        Object.keys(currentFieldDef.schema);
                }
            }
        }

        /*!
         * hasEmptySchema
         * A function that checks if the given field definition of an array or
         * of an object has a schema without any fields.
         *
         * @name hasEmptySchema
         * @function
         * @param {Object} def The definition of the field whose schema to
         * check.
         * @return {Boolean} True if the schema of the given field has no
         * fields, false otherwise.
         */
        function hasEmptySchema(def) {
            // This function only works with fields of type "object" and "array"
            // which have a correct schema. A correct schema always has an array
            // property with the name taken from `settings.orderProperty`.
            if (getTypeOf(def.schema) !== "object" ||
                    getTypeOf(def.schema[settings.orderProperty]) !== "array") {
                return;
            }
            return def.schema[settings.orderProperty].length === 0;
        }

        /*!
         * updateDescendantDefPaths
         * Updates the paths of the descendant field definitions according to
         * the path of the given field definition and to the names of the
         * descendant fields. For example if `def.path` is
         * "first.second" and `def` contains a field with the path
         * "first.test.third", the new path of that field will be
         * "first.second.third".
         *
         * @name updateDescendantDefPaths
         * @function
         * @param {Object} def The definition of the field whose descendant
         * fields' paths should be updated.
         * @return {undefined}
         */
        function updateDescendantDefPaths(def) {
            var p;

            // If the `def` field definition is of an elementary type (so it has
            // no `schema` property of type "object") don't do anything
            if (typeof def.schema !== "object") return;

            p = def.path;

            for (var fieldName in def.schema) {
                var subDef;

                if (!def.schema.hasOwnProperty(fieldName) ||
                        fieldName === settings.orderProperty) {
                    continue;
                }

                subDef = def.schema[fieldName];

                subDef.path = p + "." + fieldName;
                if (subDef.type === "object" ||
                        subDef.type === "array") {
                    updateDescendantDefPaths(subDef);
                }
            }
        }

        /*!
         * createAddButton
         * Returns a new add button to be inserted in a table (which is the UI
         * for an array).
         *
         * @name createAddButton
         * @function
         * @return The new add button.
         */
        function createAddButton($table) {
            return $("<input>", {
                type: "button",
                val: "+",
                on: {
                    click: function () {
                        var path = $table.attr("data-json-editor-path");
                        var data = self.getData(path + ".+", $table, true);
                        self.add($table, data);

                        // We use `undefined` when the data is an elementary
                        // object, and an empty object when it is an object with
                        // properties. If `data` is an object without any own
                        // properties, it does not matter if below we call
                        // `self.setData` with `undefined` or `{}` because the
                        // `self.setData` method will skip over the new item
                        // editor in the table because in the row of the new
                        // item editor there is no element with the
                        // `data-json-editor-path` attribute set.
                        if (isElementaryValue(data)) {
                            data = undefined;
                        } else {
                            data = {};
                        }
                        self.setData(path + ".+", data);
                    }
                },
                "data-json-editor-control": "add"
            });
        }

        /*!
         * createDeleteButton
         * Returns a new delete button to be inserted in a table (the UI for an
         * array).
         *
         * @name createDeleteButton
         * @function
         * @param {jQuery} $table The jQuery element of the table representation
         * of the array for which the delete button is created.
         * @return The new delete button.
         */
        function createDeleteButton($table) {
            return $("<button>", {
                text: "×",
                "data-json-editor-control": "delete",
                on: {
                    click: function () {
                        self.delete($(this).closest("tr"));
                        self.resetPathIndicesInTable($table);
                    }
                }
            });
        }

        /*!
         * deleteControlsColumn
         * Deletes the column at the end of `$table` with the add/delete buttons
         * and adds those buttons in the last remaining column in the table.
         *
         * @name deleteControlsColumn
         * @function
         * @param {jQuery} $table The jQuery element of the table representaton
         * of the array in which the controls column is deleted.
         * @return {undefined}
         */
        function deleteControlsColumn($table) {
            // We do not use a simpler selector with the jQuery `find` method
            // because we do not want to remove cells from nested tables.
            $table.children("tbody").children("tr").each(function (i, e) {
                $(e).children("td:last").remove();
            });
            $table.children("tfoot").children("tr").each(function (i, e) {
                $(e).children("td:last").remove();
            });
            addControlsToLastColumn($table);
        }

        /*!
         * deleteAllNestedFields
         * Deletes all the nested fields inside a field definition. It works
         * only with fields of type "object" or "array" (it would not make sense
         * for fields of elementary types which cannot have nested fields).
         * Using this function is a way to initialize the schema of a field of
         * type "object" or "array". This means that we set the schema property
         * of the field to an empty object and we set the
         * `settings.orderProperty` property of the schema to an empty array.
         *
         * @name deleteAllNestedFields
         * @function
         * @param {Object} def The field definition from which to delete all the
         * nested fields.
         * @return {undefined}
         */
        function deleteAllNestedFields(def) {
            def.schema = {};
            def.schema[settings.orderProperty] = [];
        }

        /*!
         * deleteColumn
         * Deletes a column from an array table, the column being identified
         * using the `$th` table column header argument which is a jQuery
         * element.
         *
         * @name deleteColumn
         * @function
         * @param {jQuery} $th The header `<th>` of the column which should be
         * deleted.
         * @return {undefined}
         */
        function deleteColumn($th) {
            var path, name, def;
            // Get the table header row, the one which contains `$th`.
            var $tr = $th.closest("tr");
            // Get the index of the column which contains `$th`.
            var i = $th.index();
            // Get the table containing the `$th`.
            var $table = $tr.closest("table");
            // :nth-child selector uses 1-based indices. Select all the table
            // cells with the index (i + 1) inside the parent rows in the table
            // body and in the table footer, then remove them from the document.
            // We do not use a simpler selector with the jQuery `find` method
            // because we do not want to remove cells from tables inside this
            // table's cells (which are the cells of `$table`).
            $table.children("tbody").children("tr")
                .children("td:nth-child(" + (i + 1) + ")").remove();
            $table.children("tfoot").children("tr")
                .children("td:nth-child(" + (i + 1) + ")").remove();
            // Also remove the column header `$th`.
            $th.remove();

            // Also remove the column (field) from the array schema so
            // that the add new field button will work correctly, will
            // not add the deleted field to the new array items.

            // The path to the field represented by the table.
            path = $table.attr("data-json-editor-path");
            name = $th.attr("data-json-editor-name");
            def = self.getDefinitionAtPath(path);
            // If there is only a single column in the table, its `<th>` will
            // have the `data-json-editor-name` attribute set to an empty
            // string.
            if (name.length > 0) {
                var order;

                delete def.schema[name];
                order = def.schema[settings.orderProperty];
                order.splice(order.indexOf(name), 1);
                // If there remains just one column after removing the selected
                // column, move the add/delete item buttons inside the single
                // column, set an empty `data-json-editor-name` attribute to the
                // column header and change the attributes of the rows and of
                // the inputs in the rows so that the `getData` method will not
                // return an array of objects with a single property but an
                // array of elementary objects (strings, numbers, dates etc.).
                // Also update the definition of the array to have its only
                // field's schema directly in the `schema` property.
                if (order.length === 1) {
                    var $tfootRow, $tfootInput;

                    deleteControlsColumn($table);

                    // Update the UI (the table rows in the table body) to
                    // represent the new schema.
                    // Here we do not use a simpler selector with the jQuery
                    // `find` method because we do not want to affect nested
                    // tables.
                    $table.children("tbody").children("tr")
                            .each(function (i, e) {
                        var $e = $(e);
                        $e.removeAttr("data-json-editor-path");
                        $e.removeAttr("data-json-editor-type");
                        $e.children("td").each(function (ii, td) {
                            var $ee = $(td)
                                .find("[data-json-editor-path]:first");
                            var oldPath = $ee.attr("data-json-editor-path");
                            var newPath = path + "." + i;
                            $ee.attr("data-json-editor-path", newPath);
                            $ee.find("[data-json-editor-path]")
                                .each(function (iii, eee) {
                                    var $eee = $(eee);
                                    $eee.attr("data-json-editor-path",
                                            replaceBeginningOfFieldPath($eee
                                                .attr("data-json-editor-path"),
                                                oldPath, newPath));
                                });
                        });
                    });
                    // Also update the row in the table footer.
                    // Here we do not use a simpler selector with the jQuery
                    // `find` method because we do not want to affect nested
                    // tables.
                    $tfootRow = $table.children("tfoot").children("tr");
                    $tfootRow.removeAttr("data-json-editor-path");
                    $tfootRow.removeAttr("data-json-editor-type");
                    $tfootInput = $tfootRow.find("[data-json-editor-path]:first");
                    var p = $tfootInput.attr("data-json-editor-path");
                    $tfootInput.attr("data-json-editor-path", path + ".+");
                    $tfootInput.find("[data-json-editor-path]").each(
                            function (i, e) {
                        $e = $(e);
                        $e.attr("data-json-editor-path",
                                replaceBeginningOfFieldPath(
                                    $e.attr("data-json-editor-path"),
                                    p, path + ".+"));


                    });
                    // Also update the row in the table header.
                    $table.children("thead:first").children("tr:first")
                        .children("th:first")
                        .attr("data-json-editor-name", "");

                    def.schema = def.schema[order[0]];
                }
            } else {
                deleteAllNestedFields(def);
                addColumnWithControls($table);
            }
        }

        /*!
         * addColumnWithControls
         * Adds as a last column to the specified jQuery table element a column
         * with an add new item control in the `<tfoot>` row and with delete
         * item controls in each of the rows in the `<tbody>`.
         *
         * @name addColumnWithControls
         * @function
         * @param {jQuery} $table The table jQuery element to which to add the
         * controls.
         * @return {undefined}
         */
        function addColumnWithControls($table) {
            // If the array schema contained a single field, add a new column
            // with the delete item and add item buttons which existed only in
            // the <td>s from the deleted column (or, when adding a new column
            // to a table with a single column, which existed only in the old
            // single column).
            $table.children("tbody").children("tr").each(function (i, e) {
                $(e).append($("<td>").append(
                            createDeleteButton($table)));
            });
            $table.children("tfoot").children("tr").each(function (i, e) {
                $(e).append($("<td>").append(
                            createAddButton($table)));
            });
        }

        /*!
         * addControlsToLastColumn
         * Adds in the last column of the specified jQuery table element
         * controls with an add new item control in the `<tfoot>` row and with
         * delete item controls in each of the rows in the `<tbody>`.
         *
         * @name addControlsToLastColumn
         * @function
         * @param {jQuery} $table The table jQuery element to which to add the
         * controls.
         * @return {undefined}
         */
        function addControlsToLastColumn($table) {
            // Here we must keep the code working well in the case of nested
            // tables.
            $table.children("tbody").children("tr").children("td:last-child")
                    .each(function (i, e) {
                $(e).append(createDeleteButton($table));
            });
            $table.children("tfoot").children("tr:first").children("td:last")
                    .each(function (i, e) {
                $(e).append(createAddButton($table));
            });
        }

        /*!
         * createDeleteFieldButton
         * Returns a new delete field button to be inserted in a column header
         * in a table with the `deletableFields` schema property set to `true`.
         *
         * @name createDeleteFieldButton
         * @function
         * @return {jQuery} The new delete field button.
         */
        function createDeleteFieldButton() {
            return $("<input>", {
                type: "button",
                value: "× Delete field",
                on: {
                    click: function () {
                        deleteColumn($(this).parent());
                    }
                }
            });
        }

        /*!
         * createColumnHeader
         * Returns a new `<th>` for the specified field definition which will be
         * inserted in the table as a column header.
         *
         * @name createColumnHeader
         * @function
         * @param {Object} def The field definition for which to generate the
         * column header.
         * @return {jQuery} The column header which is a `<th>` element.
         */
        function createColumnHeader(def) {
            var $th = $("<th>", {
                text: def.label || settings.defaultArrayFieldLabel,
                "data-json-editor-name": def.name || ""
            });
            if (def.deletable) {
                $th.append(createDeleteFieldButton());
            }
            return $th;
        }

        /*!
         * inheritField
         * A function that inherits a few properties from the parent field (of
         * type "object", and in the future maybe also "array") into the child
         * field.
         *
         * @name inheritField
         * @function
         * @param {Object} targetDef The child field definition that will
         * receive some properties from the parent field definition.
         * @param {Object} sourceDef The parent field definition from which some
         * properties will be inherited.
         * @return {undefined}
         */
        function inheritField(targetDef, sourceDef) {
            /*!
             * A small function that returns the second argument if the first
             * argument is undefined, else it returns the first argument.
             */
            function f(a, b) {
                if (typeof a === "undefined") {
                    return b;
                }
                return a;
            }

            // If the type of the target (child) field is not elementary (is
            // either "object" or "array")
            if (targetDef.type === "object" || targetDef.type === "array") {
                // If the parent object `sourceDef` of the field `targetDef` of
                // type "object" or "array" has the `deletableFields` flag set,
                // mark the field as `deletableFields`, only if `targetDef` does
                // not already contain the `deletableFields` property. The same
                // goes for the `editableFields` and `addField` properties.
                targetDef.deletableFields =
                    f(targetDef.deletableFields, sourceDef.deletableFields);
                targetDef.editableFields =
                    f(targetDef.editableFields, sourceDef.editableFields);
                targetDef.addField = f(targetDef.addField,
                        sourceDef.addField);
            }
            // If the parent object `sourceDef` of the field `targetDef` has the
            // `deletableFields` flag set, mark the field as `deletable`, only
            // if `targetDef` does not already contain the `deletable` property.
            // The same goes for `editableFields` and `editable`.
            targetDef.deletable = f(targetDef.deletable,
                    sourceDef.deletableFields);
            targetDef.editable = f(targetDef.editable,
                    sourceDef.editableFields);
        }

        /*!
         * updateAndRenameFieldData
         * Updates the data of all the fields in the JSON editor which is stored
         * in the `settings.data` variable and is used to fill the edited field
         * after changing its name. It also renames the field data in the
         * `settings.data` variable if the new name is different than the old
         * name so that the new input group created with the call below to the
         * `createGroup` method in the calling function (which is the click
         * handler of the "Add/Save field" button in the `createNewFieldEditor`
         * function) will display the correct data. This function needs to stay
         * in the scope of the `settings.data` variable and in the scope of the
         * `renameValueAtPath` function to work without errors.
         *
         * @name updateAndRenameFieldData
         * @function
         * @param {String} oldPath The path to the field before its name was
         * edited in the current field editor.
         * @param {String} newName The new name of the field, the one inserted
         * by the end user in the current field editor before pressing the Save
         * button. It can be the same as the old name and in this case this
         * function only updates the data without renaming any field data in the
         * `settings.data` object.
         * @return {undefined}
         */
        function updateAndRenameFieldData(oldPath, newName) {

            var oldName = self.getNameFromPath(oldPath);
            // Update the default data used for the edited field's new input
            // group (which is the DOM representation of the field) and also
            // updates the default data for all the remaining fields in the JSON
            // editor, taking the data from the way in which the input groups
            // are currently filled in the UI by the end user or by the initial
            // data offered to the JSON editor constructor.
            settings.data = self.getData(null, null,
                    null, true);
            // If the name (so also the path) of the field has been changed
            if (newName !== oldName) {
                // Then replace in the `settings.data` variable the old field
                // name with the new field name.
                renameValueAtPath(oldPath, newName);
            }
        }

        /*!
         * createNewFieldEditor
         * Returns a jQuery object containing a new field editor.
         *
         * @name createNewFieldEditor
         * @function
         * @param {Object} options An object containing the following
         * properties:
         *
         * - `newFields` (Boolean): True if the new field editor will create new
         * fields instead of editing existing fields, false otherwise.
         * - `deletableFields` (Boolean): Whether the fields created by this
         * field editor will be deletable.
         * - `editableFields` (Boolean): Whether the fields created by this
         * field editor will be editable.
         * - `addFields` (Boolean): Whether the objects created by this field
         * editor will be capable of receiving new fields created with the user
         * interface.
         * - `parent` (jQuery): Optional. The jQuery element which is the direct
         * parent of all the group elements at the same level as the new field
         * editor destination in the UI and has the `data-json-editor-path`
         * attribute set to the correct path. If it is not set or it does not
         * have this attribute set, the `self.container` element and an empty
         * path string will be used.
         * - `editedGroup` (jQuery): Optional. The jQuery element representing
         * the field which is edited by the newly created field editor. It is
         * required only when `newFields` is set to `false`.
         *
         * @return {jQuery} The newly created field editor.
         */
        function createNewFieldEditor(options) {
            var $parent, path, $div, $nameInput, $possibleValuesSelect,
                $possibleValuesDiv, $checkboxPossibleValues,
                $possibleValuesLabel, $typeSelect, $labelInput,
                $possibleValueInput, $addPossibleValueButton,
                $deletePossibleValueButton, $editedInput, $addFieldButton,
                $label, formTitle;

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
                // If the field editor is not in a table (or, with other words,
                // it is in an object).
                if (!$parent.is("table")) {
                    // Obtain the data at the path where the new field is
                    // created.
                    var data = self.getData(path, $parent);

                    // Return true if the given name is already in the data,
                    // otherwise return false.
                    return Object.keys(data).indexOf(name) > -1;
                }
                var def = self.getDefinitionAtPath(path);
                // Handle empty schemas (arrays without any fields).
                if (hasEmptySchema(def)) {
                    return false;
                }
                var sch = def.schema;
                // If the schema `sch` contains a single field
                if (typeof sch.type === "string") {
                    return name === (sch.name ||
                            settings.defaultArrayFieldName);
                }
                // else if `sch` contains multiple fields
                return sch[settings.orderProperty].indexOf(name) > -1;
            }

            $parent = options.parent && options.parent.length > 0 ?
                options.parent : self.container;
            path = $parent.attr("data-json-editor-path") || "";

            $div = $("<div>", {
                class: "json-editor-" + (options.newFields ? "new" : "edit") +
                    "-field-form"
            });

            $nameInput = $("<input>", {
                type: "text",
                class: "json-editor-field-name"
            });

            $possibleValuesSelect = $("<select>", {
                multiple: "multiple",
                class: "json-editor-field-possible-values"
            });

            $possibleValuesDiv = $("<div>", {
                css: {
                    display: "none"
                },
                class: "json-editor-possible-values-section"
            });

            $checkboxPossibleValues = $("<input>", {
                type: "checkbox",
                on: {
                    change: function (e) {
                        $possibleValuesDiv.toggle(this.checked);
                    }
                },
                class: "json-editor-field-enable-possible-values"
            });

            $possibleValuesLabel = $("<label>")
                .text("Enable possible values: ")
                .append($checkboxPossibleValues);

            // This jQuery element is the <select> (combo box) input inside the
            // field editor with which the end user selects the type of the
            // created/edited (see the `options.newFields` variable) field.
            $typeSelect = $("<select>", {
                on: {
                    change: function () {
                        var type = $(this).val();
                        if (type === "object" || type === "array") {
                            // A field of type "object" or "array" (so all the
                            // types that are not elementary) cannot have possible
                            // values, so we show the possible values controls
                            // only for fields of type different than "object"
                            // and "array", elementary types (date, string etc.).
                            $possibleValuesLabel.add($possibleValuesDiv).hide();
                        } else {
                            // Create a new input for the newly selected field
                            // type from `$typeSelect`.
                            var $clone = JsonEdit.inputs[type].clone()
                                .attr("data-json-editor-type", type);
                            // Replace the `$possibleValueInput` input with the
                            // newly created input.
                            $possibleValueInput.replaceWith($clone);
                            $possibleValueInput = $clone;
                            // Set the default value for the selected type to
                            // the newly created input.
                            self.setValueToElement($possibleValueInput,
                                    getDefaultValueForType(type));
                            // Clear the list of possible values entered by the
                            // user (it wouldn't make sense to keep them since
                            // the type of the possible values has been
                            // changed).
                            $possibleValuesSelect.empty();

                            // A field of type "object" or "array" cannot have
                            // possible values, so we show the possible values
                            // controls only for fields of type different than
                            // "object" and "array", for fields of elementary
                            // types.
                            $possibleValuesLabel.show();
                            $possibleValuesDiv.toggle($checkboxPossibleValues
                                    .is(":checked"));
                        }
                    }
                },
                class: "json-editor-field-type"
            });
            for (var i = 0; i < knownElementaryFieldTypes.length; i++) {
                $typeSelect.append($("<option>", {
                    value: knownElementaryFieldTypes[i],
                    text: knownElementaryFieldTypes[i]
                }));
            }
            $typeSelect.append($("<option>", {
                value: "object",
                text: "object"
            }), $("<option>", {
                value: "array",
                text: "array"
            }));

            $labelInput = $("<input>", {
                type: "text",
                class: "json-editor-field-label"
            });

            $possibleValueInput = $("<input>", {
            });

            $addPossibleValueButton = $("<input>", {
                type: "button",
                value: "+ Add possible value",
                class: "json-editor-add-possible-value-button",
                on: {
                    click: function () {
                        var val = self.getValueFromElement($possibleValueInput);
                        var text = JsonEdit.converters.string(val);
                        // See the explanation in the `createGroup` method,
                        // `field.possible` if branch, for the reason why we do
                        // not use `JsonEdit.converters.string` for the `value`
                        // attribute of the `<option>` element.
                        $possibleValuesSelect.append($("<option>", {
                            value: val.toString(),
                            text: text
                        }));
                    }
                }
            });

            $deletePossibleValueButton = $("<input>", {
                type: "button",
                value: "× Delete selected possible values",
                class: "json-editor-delete-possible-value-button",
                on: {
                    click: function () {
                        $possibleValuesSelect.children("option:selected").remove();
                    }
                }
            });

            $addFieldButton = $("<input>", {
                type: "button",
                value: (options.newFields ? "+ Add" : "💾 Save") + " field",
                class: "json-editor-add-field-button",
                on: {
                    click: function () {
                        var name, label, type, inTable, newFieldDef,
                            definition, sch;

                        // Remove dots from the name and remove the whitespace
                        // around it.
                        $nameInput.val($nameInput.val()
                                .replace(/\./g, "").trim());
                        // Remove the whitespace around the label.
                        $labelInput.val($labelInput.val().trim());

                        name = $nameInput.val();
                        // The default label is the name of the field.
                        label = $labelInput.val() || name;

                        // Validate the name. It should not be a duplicate, it
                        // should be different than "+" and not an empty string.
                        if (name === "+" || name.length === 0 ||
                                nameAlreadyExists(name)) {
                            alert(settings.messages.INVALID_FIELD_NAME
                                    .replace(/\{0\}/g, path));
                            return;
                        }

                        type = $typeSelect.val();
                        inTable = $parent.is("table");

                        // Build the field definition of the new or modified
                        // field.
                        newFieldDef = {
                            name: name,
                            label: label,
                            type: type,
                            path: (path ? path + "." : "") + name
                        };
                        inheritField(newFieldDef, {
                            addField: options.addFields,
                            deletableFields: options.deletableFields,
                            editableFields: options.editableFields,
                            deletable: options.deletableFields,
                            editable: options.editableFields
                        });
                        // Get the schema of the array/object field definition
                        // that is the parent of the new/edited field.
                        definition = self.getDefinitionAtPath(path);
                        sch = definition.schema;

                        // The type can be "object", "array" or an elementary
                        // type (string, date etc.). See the
                        // `knownElementaryFieldTypes` variable for the
                        // elementary types.
                        // If a field of type "object" is added or edited in a
                        // table (a field of type "array") or in a field of type
                        // "object" with 0, 1 or more subfields
                        if (type === "object") {
                            deleteAllNestedFields(newFieldDef);

                            // If the field editor is inside a table (array)
                            // with 0, 1 or more subfields and an object is
                            // added or edited in that table
                            if (inTable) {
                                // If a field of type object is added or edited
                                // inside an array (table) with a single
                                // subfield
                                if (typeof sch.type === "string") {
                                    // If a new field of type "object" is
                                    // created inside a table with a single
                                    // subfield
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if an existing field of type
                                    // "object" or of another type is edited
                                    // inside a table with a single subfield
                                    // (which is the edited field) to become a
                                    // field of type "object"
                                    } else {
                                        // TODO: Not yet implemented.
                                    }
                                // If a field of type "object" is added or
                                // edited inside an array (table) with no
                                // subfields
                                } else if (hasEmptySchema(definition)) {
                                    // If a new field of type "object" is
                                    // created inside an array (table) with no
                                    // subfields
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if an existing field of type
                                    // "object" or of another type is edited
                                    // inside an array (table) with no subfields
                                    // to become a field of type "object" - an
                                    // impossible situation
                                    } else {
                                        alert(settings.messages.
                                                EDIT_FIELD_IN_ARRAY_WITHOUT_FIELDS);
                                    }
                                // If a field of type "object" is added or
                                // edited inside an array (table) with at
                                // least 2 subfields
                                } else {
                                    // If a new field of type "object" is
                                    // created inside an array (table) with 2
                                    // or more subfields
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if an existing field of type
                                    // "object" is edited inside an array
                                    // (table) with 2 or more subfields
                                    } else {
                                        // TODO: Not yet implemented.
                                    }
                                }
                            // If the field editor is inside an object and an
                            // object is added or edited in that object which
                            // has 0, 1 or more subfields
                            } else { // !inTable
                                var order = sch[settings.orderProperty];
                                // If a new field of type "object" is created
                                // inside an object (which means a field of type
                                // "object") and the parent object has 0, 1 or
                                // more subfields
                                if (options.newFields) {
                                    // A new field of type object is added to an
                                    // object.
                                    order.push(name);
                                    // Insert the new field definition in the
                                    // `settings.schema` variable.
                                    sch[name] = newFieldDef;
                                // Else if a field of type "object" or other
                                // type is edited inside an object (which means
                                // a field of type "object") to become a field
                                // of type "object" and the parent object has 0,
                                // 1 or more subfields
                                } else {
                                    // A field of type object or other type is
                                    // edited to become a field of type object.
                                    // The field is inside an object.
                                    var _path = $editedInput.attr(
                                            "data-json-editor-path");
                                    var oldName = self.getNameFromPath(_path);

                                    // If the old field definition had a schema
                                    // (this is true if it was of type "object"
                                    // or "array", so not of an elementary type)
                                    if (typeof sch[oldName].schema === "object") {
                                        // Keep the schema of the old field
                                        // definition (the fields in the object)
                                        // in the new field definition, because
                                        // even if the type of the field was the
                                        // same before the Save operation
                                        // ("object"), the Save operation just
                                        // updated the name, path or the label
                                        // of the field and the subfields stay
                                        // the same
                                        newFieldDef.schema = sch[oldName].schema;
                                    }

                                    // Also change the paths of the descendant
                                    // field definitions. For example if `_path`
                                    // is "first.second" (`oldName` is "second")
                                    // and `name` is "third", the new path of
                                    // the field will be "first.third" and lets
                                    // say that the schema of this field
                                    // contains a string field with path
                                    // "first.second.test". After changing the
                                    // path from "first.second" to
                                    // "first.third", this string field should
                                    // also change its path from
                                    // "first.second.test" to
                                    // "first.third.test".
                                    updateDescendantDefPaths(newFieldDef);

                                    // Insert the new field definition in the
                                    // `settings.schema` variable.
                                    sch[name] = newFieldDef;

                                    // If the name (so also the path) of the
                                    // field has been changed, replace the old
                                    // name with the new name in the order array
                                    // and delete the old field definition with
                                    // the old name from the schema.
                                    if (name !== oldName) {
                                        order[order.indexOf(oldName)] = name;
                                        delete sch[oldName];
                                    }

                                    updateAndRenameFieldData(_path, name);
                                }

                                // Create and show the UI for the field
                                // definition and add it before the field
                                // editor.
                                $div.before(self.createGroup(newFieldDef));
                            }
                        // Else if a field of type "array" is added or edited in
                        // a table (a field of type "array") or in a field of
                        // type "object" with 0, 1 or more subfields
                        } else if (type === "array") {
                            deleteAllNestedFields(newFieldDef);

                            // If the field editor is inside a table (array)
                            // with 0, 1 or more subfields and a table is added
                            // or edited in that table
                            if (inTable) {
                                // If the field editor is inside a table (array)
                                // with a single subfield and a table is added
                                // or edited in that table
                                if (typeof sch.type === "string") {
                                    // If the field editor is inside a table (array)
                                    // with a single subfield and a table is added
                                    // in that table
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if the field editor is inside a
                                    // table (array) with a single subfield and
                                    // that subfield is edited to become a table
                                    // or if it already is a table, its name
                                    // and/or label is/are edited
                                    } else {
                                        // TODO: Not yet implemented.
                                    }
                                // Else if the field editor is inside a table
                                // (array) with no subfields and a table is
                                // added or edited in that table
                                } else if (hasEmptySchema(definition)) {
                                    // If the field editor is inside a table
                                    // (array) without any subfields and a table
                                    // is added in that table
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if the field editor is inside a
                                    // table (array) without any subfields and
                                    // an inexistent subfield is edited to
                                    // become a table or if it already is a
                                    // table, its name and/or label is/are
                                    // edited - impossible situation
                                    } else {
                                        alert(settings.messages.
                                                EDIT_FIELD_IN_ARRAY_WITHOUT_FIELDS);
                                    }
                                // Else if the field editor is inside a table
                                // (array) with at least 2 subfields and a table
                                // is added or edited in that table
                                } else {
                                    // If the field editor is inside a table
                                    // (array) with at least 2 subfields and a
                                    // table is added in that table
                                    if (options.newFields) {
                                        // TODO: Not yet implemented.
                                    // Else if the field editor is inside a
                                    // table (array) with at least 2 subfields
                                    // and one of its subfields is edited to
                                    // become a table or if it already is a
                                    // table, its name and/or label is/are
                                    // edited
                                    } else {
                                        // TODO: Not yet implemented.
                                    }
                                }
                            // Else if the field editor is inside an object with
                            // 0, 1 or more subfields and a table is added or
                            // edited in that object
                            } else { // !inTable
                                var order = sch[settings.orderProperty];
                                // If the field editor is inside an object with
                                // 0, 1 or more subfields and a table is added
                                // in that object
                                if (options.newFields) {
                                    // A new field of type array is added to an
                                    // object.
                                    order.push(name);
                                    // Insert the new field definition in the
                                    // `settings.schema` variable.
                                    sch[name] = newFieldDef;
                                // Else if the field editor is inside an object
                                // with 0, 1 or more subfields and a field of
                                // type "array" (a table) or of another type is
                                // edited in that object to become a table or if
                                // it already is a table, to change its name
                                // and/or label
                                } else {
                                    var _path = $editedInput
                                        .attr("data-json-editor-path");
                                    // A field of type array, object or other
                                    // type is edited to become a field of type
                                    // array. The field is inside an object.
                                    var oldName = self.getNameFromPath(_path);

                                    // If the old field definition had a schema
                                    // (this is true if it was of type "object"
                                    // or "array", so not of an elementary type)
                                    if (typeof sch[oldName].schema === "object") {
                                        // Keep the schema of the old field
                                        // definition (the fields in the array)
                                        // in the new field definition, because
                                        // even if the type of the field was the
                                        // same before the Save operation
                                        // ("array"), the Save operation just
                                        // updated the name, path or the label
                                        // of the field and the subfields stay
                                        // the same
                                        newFieldDef.schema = sch[oldName].schema;
                                    }

                                    // Also change the paths of the descendant
                                    // field definitions. For example if `_path`
                                    // is "first.second" (`oldName` is "second")
                                    // and `name` is "third", the new path of
                                    // the field will be "first.third" and lets
                                    // say that the schema of this field
                                    // contains a string field with path
                                    // "first.second.test". After changing the
                                    // path from "first.second" to
                                    // "first.third", this string field should
                                    // also change its path from
                                    // "first.second.test" to
                                    // "first.third.test".
                                    updateDescendantDefPaths(newFieldDef);

                                    // Insert the new field definition in the
                                    // `settings.schema` variable.
                                    sch[name] = newFieldDef;
                                    // If the name (so also the path) of the
                                    // field has been changed, replace the old
                                    // name with the new name in the order array
                                    // and delete the old field definition with
                                    // the old name from the schema.
                                    if (name !== oldName) {
                                        order[order.indexOf(oldName)] = name;
                                        delete sch[oldName];
                                    }

                                    updateAndRenameFieldData(_path, name);
                                }

                                // Create and show the UI for the field
                                // definition and add it before the field
                                // editor.
                                $div.before(self.createGroup(newFieldDef));
                            }
                        // Else if a field of an elementary type (not "object"
                        // or "array") is added or edited in a table (a field of
                        // type "array") or in a field of type "object" with 0,
                        // 1 or more subfields
                        } else {
                            // If the possible values checkbox is enabled, add the
                            // entered possible values to the field definition.
                            if ($checkboxPossibleValues.prop("checked")) {
                                var possibleValues = [];
                                var converter = self.converters[newFieldDef.type];
                                $possibleValuesSelect.children("option").each(
                                    function (i, e) {
                                        possibleValues.push(converter($(e).val()));
                                    });
                                newFieldDef.possible = possibleValues;
                            }

                            // If a field of an elementary type (not "object" or
                            // "array") is added or edited in a table (a field
                            // of type "array") with 0, 1 or more subfields
                            if (inTable) {
                                function createNewCellEditor(indexString) {
                                    var path2, sch2;
                                    path2 = (path ? path + "." : "") + indexString;
                                    // From the 3 possibilities: no field, one field
                                    // or many fields in the schema of the array
                                    // before the addition of the new column, the
                                    // name should be added to the path only when
                                    // the schema already contains one or more
                                    // fields. When it does not contain any fields,
                                    // the new field will be alone and its data will
                                    // be accessed directly from the only input in
                                    // that row.
                                    if (!hasEmptySchema(definition)) {
                                        path2 += "." + name;
                                    }
                                    sch2 = $.extend(true, {}, newFieldDef, {
                                        path: path2
                                    });
                                    delete sch2.label;
                                    delete sch2.deletable;
                                    delete sch2.editable;
                                    return $("<td>").append(self.createGroup(sch2));
                                }

                                /*!
                                 * addNewColumn
                                 * Creates and shows the UI for the new column in
                                 * the table. First adds a table column header then
                                 * adds empty inputs under it.
                                 *
                                 * @name addNewColumn
                                 * @function
                                 * @param {jQuery} $table The table element in which
                                 * to add the new column.
                                 * @param {Object} newDef The field definition of
                                 * the new column.
                                 */
                                function addNewColumn($table, newDef) {
                                    // We must keep the code below compatible
                                    // with the possible nested tables.
                                    var $trs = $table.children("tbody")
                                        .children("tr");
                                    var $tds, $cellEditor, $tfootRow;
                                    // First add the column header.
                                    $table.children("thead").children("tr:first")
                                        .children("th:last").before(
                                                createColumnHeader(newDef));
                                    // For each row in the table body.
                                    for (var i = 0; i < $trs.length; i++) {
                                        var $tr = $trs.eq(i);
                                        // Create a new cell editor.
                                        $cellEditor = createNewCellEditor(i.toString());
                                        $tds = $tr.children("td");
                                        // If there are cells in the row, put the
                                        // cell editor before the last cell.
                                        if ($tds.length > 0) {
                                            $tds.eq(-1).before($cellEditor);
                                        // Else append the cell editor to the row.
                                        } else {
                                            $tr.append($cellEditor);
                                        }
                                    }
                                    // Do the same for the table footer row.
                                    $tfootRow = $table.children("tfoot")
                                        .children("tr:first");
                                    $tds = $tfootRow.children("td");
                                    $cellEditor = createNewCellEditor("+");
                                    if ($tds.length > 0) {
                                        $tds.eq(-1).before($cellEditor);
                                    } else {
                                        $tfootRow.append($cellEditor);
                                    }
                                }

                                // If a new field of an elementary type is added
                                // in a table as a new column, the default data
                                // of the input groups created under it should
                                // be the default data for its type
                                if (options.newFields) {
                                    newFieldDef.data = getDefaultValueForType(type);
                                // Else if a column of elementary type is edited
                                // in a table
                                } else {
                                    // TODO: Not yet implemented.
                                }

                                // If a field of an elementary type (not
                                // "object" or "array") is added or edited in a
                                // table (a field of type "array") with exactly
                                // one subfield
                                if (typeof sch.type === "string") {
                                    // If a field of an elementary type (not
                                    // "object" or "array") is added in a table
                                    // (a field of type "array") with exactly
                                    // one subfield
                                    if (options.newFields) {
                                        var $tfootRow, $tfootInput;

                                        // Move the old single field inside a
                                        // larger schema which also contains the
                                        // newly created field.
                                        var nameOfTheSingleOldField = sch.name ||
                                            settings.defaultArrayFieldName;
                                        definition.schema = {};
                                        definition.schema[settings.orderProperty] =
                                            [nameOfTheSingleOldField, name];
                                        definition.schema[nameOfTheSingleOldField] =
                                            sch;
                                        definition.schema[name] = newFieldDef;
                                        sch = definition.schema;

                                        schemaCoreProperties(sch,
                                                definition.path + ".");
                                        // The call to `schemaCoreProperties`
                                        // also sets the label to the name
                                        // `settings.defaultArrayFieldName` in
                                        // some cases, but we can do better, we
                                        // set it to
                                        // `settings.defaultArrayFieldLabel` if
                                        // `sch` does not have a name set.
                                        sch[nameOfTheSingleOldField].label =
                                            sch.name ||
                                            settings.defaultArrayFieldLabel;

                                        // The HTML attribute of the input
                                        // groups containing the field paths
                                        var attrToChange = "data-json-editor-path"; // TODO: make this string configurable

                                        // Update the UI (the UI is represented
                                        // by the table rows in the table body)
                                        // to represent the new field definition
                                        // which now contains a new field in its
                                        // schema.
                                        // For each row in the table body
                                        $parent.children("tbody").children("tr")
                                                .each(function (i, tr) {
                                            // `tr` is the DOM element, we wrap
                                            // it in a jQuery object
                                            var $tr = $(tr);
                                            // We set the
                                            // "data-json-editor-path" and
                                            // "data-json-editor-type"
                                            // attributes of the current row
                                            // because after the new column is
                                            // added the row will have more
                                            // than one cells with input groups
                                            // and in this case the <tr> element
                                            // must specify that it has the type
                                            // "object", this information is
                                            // used in the `getData` method
                                            $tr.attr({
                                                "data-json-editor-path":
                                                    definition.path + "." + i,
                                                "data-json-editor-type": "object"
                                            });

                                            // We take the first cell in the
                                            // current row
                                            var $td = $tr.children("td:first");
                                            // We take the first input group (an
                                            // element with the
                                            // "data-json-editor-path" attribute
                                            // set) from the first cell in the
                                            // current row
                                            var $group = $td
                                                .find("[data-json-editor-path]:first");
                                            // We extract the
                                            // "data-json-editor-path" attribute
                                            // from the first input group in the
                                            // row, this path is of the form
                                            // `pathToTheTable.i` where `i` is
                                            // the index of the row in the table
                                            // body
                                            var p = $group.attr(attrToChange);
                                            // Then we set it to its old value +
                                            // the name of the single old field
                                            $group.attr(attrToChange, p +
                                                    "." + nameOfTheSingleOldField);

                                            $group.find("[data-json-editor-path^='" + p + "']")
                                                    .each(function (iii, e) {
                                                // `e` is the DOM element, we
                                                // wrap it in a jQuery object
                                                var $e = $(e);
                                                // We change its
                                                // "data-json-editor-path"
                                                // attribute from beginning with
                                                // `p` to beginning with
                                                // `p.nameOfTheSingleOldField`
                                                $e.attr(attrToChange, replaceBeginningOfFieldPath(
                                                            $e.attr(attrToChange), p,
                                                            p + "." + nameOfTheSingleOldField));
                                            });
                                        });
                                        // Also update the row in the table footer.
                                        $tfootRow = $parent.children("tfoot:first")
                                            .children("tr:first");
                                        $tfootRow.attr({
                                            "data-json-editor-path":
                                                definition.path + ".+",
                                            "data-json-editor-type": "object"
                                        });

                                        $tfootInput = $tfootRow
                                            .children("td:first")
                                            .find("[data-json-editor-path]:first");
                                        var p = $tfootInput.attr("data-json-editor-path");
                                        $tfootInput.attr("data-json-editor-path",
                                                p + "." + nameOfTheSingleOldField);
                                        $tfootInput.find("[data-json-editor-path^='" + p + "']")
                                                .each(function (i, e) {
                                            var $e = $(e);
                                            $e.attr(attrToChange, replaceBeginningOfFieldPath(
                                                        $e.attr(attrToChange),
                                                        p, p + "." +
                                                        nameOfTheSingleOldField));
                                        });
                                        // Also update the row in the table
                                        // header (we must only change the
                                        // attribute of the only <th> which is a
                                        // column header)
                                        $parent.children("thead:first")
                                            .children("tr:first")
                                            .children("th:first")
                                            .attr("data-json-editor-name",
                                                    nameOfTheSingleOldField);

                                        // Delete the controls from the only column
                                        // of the table because they will be added
                                        // in a new column.
                                        $parent.children("*").children("tr")
                                            .children("td:nth-child(1)")
                                                .each(function (i, td) {
                                            // Here we do not use the jQuery
                                            // `find` method with the `:first`
                                            // selector because we only delete
                                            // the only control closest to the
                                            // table cell.
                                            jQueryClosestDescendant($(td),
                                                    "[data-json-editor-control]")
                                                .remove();
                                        });

                                        // Add a new column with controls (add,
                                        // delete).
                                        addColumnWithControls($parent);

                                        addNewColumn($parent, newFieldDef);
                                    // Else if a field of an elementary type
                                    // (not "object" or "array") is edited in a
                                    // table (a field of type "array") with
                                    // exactly one subfield, the edited subfield
                                    } else {
                                        // TODO: The only field in the table is being
                                        // edited. Not yet implemented.
                                    }
                                // Else if a field of an elementary type (not
                                // "object" or "array") is added or edited in a
                                // table (a field of type "array") without any
                                // subfields
                                } else if (hasEmptySchema(definition)) {
                                    // If a field of an elementary type (not
                                    // "object" or "array") is added (as a new
                                    // column) inside a table (a field of type
                                    // "array") without any subfields (columns)
                                    if (options.newFields) {
                                        // The new column should not have the
                                        // attribute `data-json-editor-name` set
                                        // in the column header, so we clone the
                                        // field definition object and remove
                                        // the `name` and `path` properties from
                                        // it.
                                        var def = $.extend(true, {}, newFieldDef);
                                        delete def.name;
                                        delete def.path;

                                        // Add the new column before deleting
                                        // the controls column because
                                        // `deleteControlsColumn` puts the
                                        // controls in the last column after
                                        // removing the controls column, and
                                        // that last column exists only after
                                        // calling the `addNewColumn` function.
                                        // Add the new column before updating
                                        // the schema of the array because the
                                        // `addNewColumn` function uses the old
                                        // schema when calling the
                                        // `createNewCellEditor` function.
                                        addNewColumn($parent, def);

                                        // Update the schema of the array.
                                        definition.schema = newFieldDef;

                                        deleteControlsColumn($parent);
                                    // Else if a field of an elementary type
                                    // (not "object" or "array") is edited (as a
                                    // column) inside a table (a field of type
                                    // "array") without any subfields (columns)
                                    // - impossible situation
                                    } else {
                                        alert(settings.messages.
                                                EDIT_FIELD_IN_ARRAY_WITHOUT_FIELDS);
                                    }
                                // Else if a field of an elementary type (not
                                // "object" or "array") is added or edited as a
                                // column in a table (which is a field of type
                                // "array") with 2 or more subfields
                                } else {
                                    // If a field of an elementary type (not
                                    // "object" or "array") is added as a column
                                    // in a table (which is a field of type
                                    // "array") with 2 or more subfields
                                    if (options.newFields) {
                                        // First update the schema.
                                        sch[settings.orderProperty].push(name);
                                        sch[name] = newFieldDef;

                                        addNewColumn($parent, newFieldDef);
                                    // Else if a field of an elementary type
                                    // (not "object" or "array") is edited as a
                                    // column in a table (which is a field of
                                    // type "array") with 2 or more subfields
                                    } else {
                                        // TODO: Not yet implemented.
                                    }
                                }

                            // Else if a field of an elementary type (not
                            // "object" or "array") is added or edited in an
                            // object (which means a field of type "object")
                            // with 0, 1 or more subfields
                            } else {
                                var _path = $editedInput
                                    .attr("data-json-editor-path");
                                var oldName = self.getNameFromPath(_path);

                                // If a new field of an elementary type is added
                                // in an object as a new subfield, the default
                                // data of the input group created for it should
                                // be the default data for its type
                                if (options.newFields) {
                                    newFieldDef.data = getDefaultValueForType(type);
                                // Else if a subfield of an elementary type
                                // inside an object is edited, do everything
                                // possible to keep the old value
                                } else {
                                    // If the old field definition has the same
                                    // type as the new field definition, keep
                                    // the old value
                                    // `type` is the same as `newFieldDef.type`.
                                    if (sch[oldName].type === type) {
                                        // Don't do anything here. Below the
                                        // `updateAndRenameFieldData` function
                                        // is called which sets the default data
                                        // to the old value.
                                    // Else, if the new field definition has a
                                    // different type than the old field
                                    // definition, do the same as if a new field
                                    // would be created (instead of an existing
                                    // field being edited)
                                    } else {
                                        newFieldDef.data = getDefaultValueForType(type);
                                    }
                                }

                                var order = sch[settings.orderProperty];
                                // In the `settings.schema` variable store the
                                // field definition without the (default) data
                                var newFieldDefWithoutData = $.extend(true, {},
                                        newFieldDef);
                                delete newFieldDefWithoutData.data;

                                // If a field of an elementary type (not
                                // "object" or "array") is added in an object (a
                                // field of type "object") with 0, 1 or more
                                // subfields
                                if (options.newFields) {
                                    order.push(name);
                                // Else if a field is edited to become a field
                                // of an elementary type (not "object" or
                                // "array") inside an object (a field of type
                                // "object") with 0, 1 or more subfields
                                } else {
                                    delete sch[oldName];
                                    order[order.indexOf(oldName)] = name;
                                    updateAndRenameFieldData(_path, name);
                                }
                                sch[name] = newFieldDefWithoutData;

                                // Create and show the UI for the field
                                // definition and add it before the field
                                // editor.
                                $div.before(self.createGroup(newFieldDef));
                            }
                        }

                        // If this editor does not create new fields (it just
                        // edits an existing field), after the UI is created
                        // above, remove the field editor and the old field UI
                        // from the document.
                        if (!options.newFields) {
                            options.editedGroup.remove();
                            $div.remove();
                            return;
                        }

                        // If this editor creates new fields, it should not be
                        // removed from the UI after submitting, so we reset its
                        // values to the default ones.
                        $nameInput.add($labelInput, $typeSelect,
                                $possibleValueInput).val(null);
                        $possibleValuesSelect.empty();
                        $checkboxPossibleValues.prop("checked", false)
                            .trigger("change");
                        $typeSelect.trigger("change");
                    }
                }
            });

            // Call this handler to update the possible value input to the
            // correct type and to clear the possible values list before the
            // possible values from the old schema are inserted in it below.
            $typeSelect.trigger("change");

            // If this condition is met, `options.editedGroup` is a valid jQuery
            // element.
            if (!options.newFields) {
                var fieldPath, oldDef;

                // If the edited group's jQuery element has the attribute
                // "data-json-editor-path" set, it is the UI of a field with the
                // type "object", so the edited input jQuery element is that
                // jQuery element. If that attribute is not set, it is the UI of
                // a field with a type different than "object", so the edited
                // input jQuery element is the descendant of the edited group's
                // jQuery element with that attribute set.
                var isObject = typeof options.editedGroup
                    .attr("data-json-editor-path") !== "undefined";
                if (isObject) {
                    $editedInput = options.editedGroup;
                } else {
                    $editedInput = options.editedGroup
                        .find("[data-json-editor-path]");
                }

                fieldPath = $editedInput.attr("data-json-editor-path");
                oldDef = self.getDefinitionAtPath(fieldPath);

                $typeSelect.val(oldDef.type)
                    .trigger("change");
                $nameInput.val(oldDef.name);
                $labelInput.val(oldDef.label);
                if (isObject && oldDef.possible) {
                    $checkboxPossibleValues.prop("checked", true)
                        .trigger("change");
                    for (var i = 0; i < oldDef.possible.length; i++) {
                        var val = oldDef.possible[i];
                        var text = JsonEdit.converters.string(val);
                        // See the explanation in the `createGroup` method,
                        // `field.possible` if branch, for the reason why we do
                        // not use `JsonEdit.converters.string` for the `value`
                        // attribute of the `<option>` element.
                        $possibleValuesSelect.append($("<option>", {
                            value: val.toString(),
                            text: text
                        }));
                    }
                }
            }

            $label = $("<label>");
            if (!$parent.is("table")) {
                $label.append($("<hr>"));
            }
            formTitle = (options.newFields ? "Add" : "Edit") + " field";
            $div.append($("<form>").append($label.append(
                    $("<strong>").text(formTitle),
                    $("<br>"),
                    $("<label>").text("Name: ").append($nameInput),
                    $("<label>").text("Type: ").append($typeSelect),
                    $("<label>")
                        .text("Label (optional, without final semicolon): ")
                        .append($labelInput),
                    $("<br>"),
                    $possibleValuesLabel,
                    $possibleValuesDiv.append($possibleValuesSelect,
                        $possibleValueInput, $addPossibleValueButton,
                        $deletePossibleValueButton),
                    $addFieldButton)));

            // If this is an editor for an existing field,
            if (!options.newFields) {
                // also show a Cancel button.
                $label.append($("<input>", {
                    type: "button",
                    value: "Cancel",
                    on: {
                        click: function () {
                            // There is an edited field which should be marked
                            // as not being edited anymore.
                            $editedInput.removeClass("json-editor-edited");
                            // Delete the field editor from the document.
                            $div.remove();
                        }
                    }
                }));
            }

            return $div;
        }

        /*!
         * setValueAtPath
         * Sets the value of the field at `fieldPath` path in the
         * `settings.data` variable.
         *
         * @name setValueAtPath
         * @function
         * @param {String} fieldPath The path at which to put the `value`.
         * @param {Object} value The value to put at `fieldPath` path.
         * @return {undefined}
         */
        function setValueAtPath(fieldPath, value) {
            putValue(settings.data, fieldPath, value);
        }

        /*!
         * renameValueAtPath
         * Renames the value of the field at `fieldPath` path in the
         * `settings.data` variable to the name specified in the `newName`
         * argument. For example, if `fieldPath` is "first.second.third" and
         * `newName` is "test", after calling this function the value that
         * before was found at the "first.second.third" path will now be found
         * at the path "first.second.test".
         *
         * @name renameValueAtPath
         * @function
         * @param {String} fieldPath The path at which to put the `value`.
         * @param {Object} value The value to put at `fieldPath` path.
         * @return {undefined}
         */
        function renameValueAtPath(fieldPath, newName) {
            setValueAtPath(self.setNameInPath(fieldPath, newName),
                    self.getValue(fieldPath));
            deleteValueAtPath(fieldPath);
        }

        /*!
         * deleteValueAtPath
         * Deletes the value of the field at `fieldPath` path in the
         * `settings.data` variable.
         *
         * @name deleteValueAtPath
         * @function
         * @param {String} fieldPath The path at which to delete the value.
         * @return {undefined}
         */
        function deleteValueAtPath(fieldPath) {
            deleteValue(settings.data, fieldPath);
        }

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
            var $group, $label, $labelContainer, fieldData, $input;

            // Create form group
            $group = self.groups[field.type].clone(true);

            // TODO Configurable
            $label = self.labels[field.type].clone(true).text(field.label);
            if (findValue(field, "_edit.key")) {
                $label = self.inputs.string.clone(true).val(field.label);
                $label.attr({
                    "data-json-object-key": "true",
                    "data-json-key-path": field.path
                });
            }

            // Add label
            $labelContainer = $group.find("label");
            // In fields of type "array" there is no <label> element because it
            // would trigger a click event on buttons inside the table headers
            // when clicking anywhere on the table.
            if ($labelContainer.length === 0) {
                $labelContainer = $group;
            }
            $labelContainer.append($label);

            fieldData = field.data === undefined ? self.getValue(field.path) : field.data;

            // Add input
            $input = null;
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
                    var val = field.possible[i];
                    var text = JsonEdit.converters.string(val);
                    // For the `value` attribute of the <option> element we do
                    // not use `JsonEdit.converters.string` because the date
                    // string obtained with it cannot be parsed easily with a
                    // general algorithm (for example parsing "22.10.2015" with
                    // the `Date` constructor returns an invalid date) and the
                    // `toString` `Date` method always returns a string
                    // representation of the date in American English
                    // (according to the `Date` `toString` page on
                    // developer.mozilla.org).
                    $input.append($("<option>", {
                        value: val.toString(),
                        text: text
                    }));
                }

                // Set the selected value to the one in `fieldData`.
                $input.val(fieldData);
            } else if (field.type == "array") {
                var $thead, $tfoot, $tbody, $headers, $footers, headers, $ths,
                    $tdfs, $addButton;

                // If the field data is not specified, use a default value.
                if (typeof fieldData === "undefined") {
                    fieldData = [];
                }

                // TODO Configurable
                $thead = null;
                $tfoot = null;
                $tbody = null;
                $headers = null;
                $footers = null;
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
                headers = [];
                // headers
                $ths = [];
                // If the schema of the array contains a single field
                if (typeof Object(field.schema).type === "string") {
                    var $th;
                    var sch = field.schema;
                    headers.push(sch.name);
                    if (typeof field.deletableFields === "boolean") {
                        sch = $.extend(true, {}, sch);
                        sch.deletable = field.deletableFields;
                    }
                    $th = createColumnHeader(sch);
                    $ths.push($th);
                // Else if the schema of the array contains more than one field
                } else if (!hasEmptySchema(field)) {
                    var order = field.schema[settings.orderProperty];
                    for (var i = 0; i < order.length; i++) {
                        var $th;
                        var k = order[i];
                        var sch = field.schema[k];
                        headers.push(sch.name);
                        if (typeof field.deletableFields === "boolean") {
                            sch = $.extend(true, {}, sch);
                            sch.deletable = field.deletableFields;
                        }
                        $th = createColumnHeader(sch);
                        $ths.push($th);
                    }
                // Else if the schema of the array does not contain any fields
                } else {
                    // Don't do anything.
                }
                if (field.addField) {
                    $ths.push($("<th>").append(createNewFieldEditor({
                        newFields: true,
                        addFields: true,
                        deletableFields: true,
                        editableFields: true,
                        parent: $input
                    })));
                }
                $headers.append($ths);

                // footers (with add new item controls)
                $footers = $tfoot.children("tr");
                // An array which will contain all the <td> jQuery elements that
                // should be added to the table footer row in the <tfoot>
                // section of the table.
                $tdfs = [];
                $addButton = createAddButton($input);
                // TODO: maybe we should use self.add here too after extending
                // it a bit, in both branches of the `if` structure:
                // If the array schema contains a single field
                if (typeof Object(field.schema).type === "string") {
                    var $td = $("<td>");
                    var sch = field.schema;
                    $tdfs.push($td.append(self.createGroup($.extend(true, {}, sch, {
                        type: field.schema.type,
                        // special path for the new edited item:
                        path: field.path + ".+"
                    }))));
                    // Add the add item button to the single <td> in this row.
                    $td.append($addButton);
                // Else if the array schema contains at least two fields
                } else if (!hasEmptySchema(field)) {
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
                // Else if the array schema is empty, it does not contain fields
                } else {
                    // Just add a table cell with the add item button.
                    $tdfs.push($("<td>").append($addButton));
                }
                $footers.append($tdfs);

                for (var i = 0; i < fieldData.length; ++i) {
                    self.add($input, fieldData[i]);
                }

            } else if (field.type === "object") {
                var order;
                // The path attribute is read from the `createNewFieldEditor`
                // function and the type attribute is read from the `setData`
                // and `getData` methods.
                $group.attr({
                    "data-json-editor-path": field.path,
                    "data-json-editor-type": "object"
                });

                // If the type is "object", `$input` is not a single jQuery
                // element but an array of jQuery elements, one for each field
                // of the object.
                $input = [];
                // Obtain the array in the schema with the order of the fields.
                // The order in which the properties of the JavaScript object
                // are declared is not always kept by the browser.
                order = field.schema[settings.orderProperty];
                // For each field in the schema of the field of type "object"
                for (var i = 0; i < order.length; i++) {
                    // The name of the subfield
                    var k = order[i];
                    // The current subfield definition
                    var cField = field.schema[k];

                    // Clone the subfield definition and in the clone set the
                    // path and the data
                    var fieldDef = $.extend(true, {}, cField, {
                        path: field.path + "." + k,
                        _edit: field.edit
                    });
                    if (typeof fieldData !== "undefined" &&
                            typeof fieldData[k] !== "undefined") {
                        fieldDef.data = fieldData[k];
                    }

                    inheritField(fieldDef, field);

                    // Create the input group from the subfield definition clone
                    // `fieldDef` and add it to the `$input` array
                    $input.push(self.createGroup(fieldDef));
                }

                if (field.addField) {
                    $input.push(createNewFieldEditor({
                        newFields: true,
                        addFields: true,
                        deletableFields: field.deletableFields,
                        editableFields: field.editableFields,
                        parent: $group
                    }));
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
            $labelContainer.append($input);
            // If the field is marked as deletable, add a delete button after
            // its input element.
            if (field.deletable) {
                $labelContainer.append($("<input>", {
                    type: "button",
                    value: "× Delete field",
                    on: {
                        click: function () {
                            var sch, order;
                            // When the Delete field button is clicked, remove
                            // the group element from the document (the group
                            // element contains the input element and the Delete
                            // field button).
                            $group.remove();
                            // Also update the schema in the `settings.schema`
                            // variable. First get the schema of the path
                            // created by removing the last segment of
                            // `field.path`.
                            sch = self.getDefinitionAtPath(field.path.split(".")
                                    .slice(0, -1).join(".")).schema;
                            order = sch[settings.orderProperty];
                            order.splice(order.indexOf(field.name), 1);
                            delete sch[field.name];
                        }
                    }
                }));
            }
            if (field.editable) {
                $labelContainer.append($("<input>", {
                    type: "button",
                    value: "✎ Edit field",
                    on: {
                        click: function () {
                            var $editor;
                            // This class, `json-editor-edited`, indicates that
                            // the field is being edited (with an editor created
                            // with the `createNewFieldEditor` function) and is
                            // used in the `getData` and indirectly in the
                            // `nameAlreadyExists` functions to exclude the
                            // edited field from the data and from the list of
                            // duplicate names.
                            if ($group.is("[data-json-editor-path]")) {
                                $group.addClass("json-editor-edited");
                            } else {
                                $group.find("[data-json-editor-path]")
                                    .addClass("json-editor-edited");
                            }
                            $editor = createNewFieldEditor({
                                newFields: false,
                                // It is possible that this field editor will
                                // create objects. This property specifies
                                // whether the user will be able to add new
                                // fields to the object created with this field
                                // editor. It is true only if the object
                                // containing the edited field has `addField`
                                // set to `true`.
                                // TODO: Currently it is always true, the
                                // `field.addField` variable would be always
                                // `undefined` because `field` is the edited
                                // field, not the parent object of that field.
                                addFields: true,
                                deletableFields: field.deletable,
                                editableFields: true,
                                // For the parent element of the editor we also
                                // call the jQuery `parent` function because for
                                // fields of type "object" the jQuery `closest`
                                // method would return the jQuery element of the
                                // edited object, not of its parent object.
                                parent: $group.parent()
                                    .closest("[data-json-editor-path]"),
                                editedGroup: $group
                            });
                            // Add the field editor to the UI.
                            $group.after($editor);
                        }
                    }
                }));
            }
            return $group;
        };

        /**
         * getDefinitionAtPath
         * Extracts the part of the `settings.schema` variable at the specified
         * `path`.
         *
         * @name getDefinitionAtPath
         * @function
         * @param {String} path Required, the path at which to get the field
         * definition.
         * @return {Object} The definition of the field at the specified path.
         */
        self.getDefinitionAtPath = function (path) {
            var fieldPathParts, currentPart, currentVal;

            if (path.length === 0) {
                return {
                    schema: settings.schema
                };
            }

            // Remove all the array indices and "+" signs from the path. The
            // `getDefinitionAtPath` function returns field definitions, not
            // field instance definitions, and those are found in the
            // `settings.schema` variable which does not contain any array
            // indices or "+" signs.
            path = path.replace(/\.(\d+|\+)\./g, ".");

            fieldPathParts = path.split(".");
            currentPart = fieldPathParts[0];
            currentVal = settings.schema[currentPart];
            for (var i = 1; i < fieldPathParts.length; i++) {
                currentPart = fieldPathParts[i];
                // If the schema of the current field definition has a single
                // field
                if (typeof currentVal.schema.type === "string") {
                    currentVal = currentVal.schema;
                    i--;
                // Else if the schema is empty or contains more than one field
                } else {
                    // This value can be undefined
                    currentVal = currentVal.schema[currentPart];
                }
            }
            return currentVal;
        };

        /**
         * getNameFromPath
         * Extracts the name of a field from its path.
         *
         * @name getNameFromPath
         * @function
         * @param {String} path Required, the path from which to extract the
         * name.
         * @return {String} The name of the field with the specified path.
         */
        self.getNameFromPath = function (path) {
            return path.split(".").pop();
        };

        /**
         * setNameInPath
         * Sets the name part (which is the substring after the last "."
         * character) in the given field path and returns the new path.
         *
         * @name setNameInPath
         * @function
         * @param {String} path Required, the path in which to replace the old
         * name with the new given name
         * @param {String} newName Required, the new name to put in the `path`.
         * @return {String} The new path which has the name part as the
         * `newName`.
         */
        self.setNameInPath = function (path, newName) {
            var parts = path.split(".");
            parts[parts.length - 1] = newName;
            return parts.join(".");
        };

        /**
         * resetPathIndicesInTable
         * If a table contains these paths: `hobbies.0`, `hobbies.2` without
         * `hobbies.1`, after calling this function, the `hobbies.2` paths
         * (including the paths of the subfields) will be replaced with
         * `hobbies.1` paths. This function is called afer deleting a row in a
         * table, in a callback in the `add` method.
         *
         * @name resetPathIndicesInTable
         * @function
         * @param {String|jQuery} path A jQuery object indicating the table, or
         * a path to a table.
         * @return {undefined}
         */
        self.resetPathIndicesInTable = function (path) {
            // The HTML attribute in which to search the field paths
            var attrToChange = "data-json-editor-path";

            var $table;
            // If `path` is a jQuery element
            if (path.constructor === jQuery) {
                // The searched <table> element will be the element indicated by
                // `path`
                $table = path;
                // And the path to the table is extracted from this jQuery
                // element
                path = $table.attr(attrToChange);
            // Else if `path` is a string
            } else {
                // Use a selector to find the searched <table> element in the
                // `self.container` element
                $table = $("table[data-json-editor-path='" + path + "']",
                        self.container);
            }

            // For each row in the table
            $table.children("tbody").children("tr").each(function (i, tr) {
                var $tr = $(tr);
                // The first element with path is either a descendant of the
                // `$tr` element (which is the current table row) or the `$tr`
                // element itself.
                var $firstElementWithPath = $tr
                    .find("[data-json-editor-path]:first")
                    .addBack("[data-json-editor-path]:first").first();
                var currentIndex;
                // If there is no element with path in this row, it means that
                // this row does not have cells for any column so we can skip
                // it and all the remaining rows in the table body
                if ($firstElementWithPath.length === 0) {
                    return false; // Break the jQuery `.each` loop
                }

                // Get the index in the paths under the current row, in 4 steps
                // 1. Get the path of the first element with path in the current
                // row
                currentIndex = $firstElementWithPath
                    .attr("data-json-editor-path");
                // 2. Remove the path of the table from the beginning of the
                // current index string
                currentIndex = currentIndex.substring(path.length + 1);
                // 3. Remove all the characters after and including the first dot
                // character in the current index string
                currentIndex = currentIndex.replace(/\..*$/, "");
                // 4. Convert the current index string to an integer
                currentIndex = parseInt(currentIndex);

                // If the index in the paths is different than the index of the
                // row
                if (i !== currentIndex) {
                    // Update the path of the <tr> element, if there is a path
                    // set directly on the <tr> element
                    if ($tr.attr(attrToChange)) {
                        $tr.attr(attrToChange, path + "." + i);
                    }

                    // For each subelement with a path
                    $tr.find("[data-json-editor-path^='" + path + "." +
                            currentIndex + "']").each(function (ii, e) {
                        var $e = $(e);
                        // Replace in the path the old wrong index with the new
                        // index
                        $e.attr(attrToChange,
                                replaceBeginningOfFieldPath($e.attr(
                                        attrToChange), path + "." +
                                    currentIndex, path + "." + i));
                    });
                }
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
            var arrayFieldDef, $tbody, nextIndex, $tr, $deleteButton;

            var $elm = null;
            if (path.constructor === jQuery) {
                $elm = path;
                $elm = $elm.closest("[data-json-editor-path]");
                path = $elm.attr("data-json-editor-path");
            } else {
                $elm = $("[data-json-editor-path='" + path + "']",
                        self.container);
            }

            // Obtain the definition of the field of type "array" at the path
            // `path` from the `settings.schema` variable.
            arrayFieldDef = self.getDefinitionAtPath(path);

            // Here we intentionally use the jQuery `children` method instead of
            // the `find` method because an array can contain other arrays.
            $tbody = $elm.children("tbody");
            // The index of the newly added row, used in the paths
            nextIndex = $tbody.children().length;
            $tr = $("<tr>").appendTo($tbody);
            $deleteButton = createDeleteButton($elm);

            // If the type of the schema is explicitly specified
            if (typeof Object(arrayFieldDef.schema).type === "string") {
                // then this is an array table with a single column
                var newSchema = $.extend(true, {}, arrayFieldDef.schema, {
                    type: getTypeOf(data),
                    // In this line of code we use `path`, not
                    // `arrayFieldDef.path` because `path` also contains table
                    // indices and "+" signs.
                    path: path + "." + nextIndex,
                    data: data
                });
                delete newSchema.label;
                delete newSchema.deletable;
                delete newSchema.editable;
                $tr.append($("<td>").append(self.createGroup(newSchema),
                            $deleteButton));
            } else if (!hasEmptySchema(arrayFieldDef)) {
                var order, fields;

                // Only set these two attributes if the array to which we are
                // adding a new item is an array of objects, because when it is
                // an array of simple objects, the attributes are already set to
                // the inner input elements inside the table cells.
                $tr.attr({
                    "data-json-editor-type": "object",
                    "data-json-editor-path": path + "." + nextIndex
                });

                // An array with the names of all the fields directly in this
                // schema
                order = arrayFieldDef.schema[settings.orderProperty];

                fields = []; // Field names
                for (var i = 0; i < order.length; i++) {
                    fields.push(arrayFieldDef.schema[order[i]].name);
                }

                for (var i = 0; i < fields.length; ++i) {
                    // The schema of the current field
                    var sch = arrayFieldDef.schema[fields[i]];
                    // This is the path of the current field, and is expressed
                    // in function of `path` not of `arrayFieldDef.path` because
                    // `path` also contains array indices and "+" signs.
                    var currentFieldPath = path + "." + nextIndex + "." +
                        fields[i];

                    var newSchema = $.extend(true, {}, sch, {
                        path: currentFieldPath,
                        data: data[fields[i]]
                    });
                    delete newSchema.label;
                    delete newSchema.deletable;
                    delete newSchema.editable;
                    $tr.append($("<td>").append(self.createGroup(newSchema)));
                }
                $tr.append($("<td>").append($deleteButton));
            } else { // if (hasEmptySchema(arrayFieldDef))
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
            var converter;
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

            converter = self.converters[type];
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
                var order = obj[settings.orderProperty];
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

            // Traverse all the fields in the UI.
            $("[data-json-editor-path]", root).each(function () {
                var p, val;
                var $this = $(this);
                var type = $this.attr("data-json-editor-type");
                // If the type is "object", expect that this jQuery `each` loop
                // will reach the inputs representing fields under this object
                // so we do not need to do anything now.
                if (type === "object") return;

                p = $this.attr("data-json-editor-path");
                // If the current path does not start with the given path,
                // return.
                if (p.substring(0, path.length) !== path) { return; }
                // Remove the given path from the path of the current element.
                p = p.substring(path.length);
                if (p.length > 0) { // If the given path is not a direct value
                    // remove the . character at the beginning
                    p = p.substring(1);
                }

                val = findValue(data, p);

                // When we deal with an array (in the UI, that means a table),
                // we delete unnecessary table rows and add new necessary table
                // rows, then we return without setting the value (which is a
                // JavaScript array) to the `$this` element  because the values
                // of the rows that are not removed because they are unnecessary
                // will be set in further calls of the jQuery `each` callback,
                // and the newly added rows are added using the `add` method
                // which also sets the values.
                if (type === "array") {
                    // Below we use the `length` property of the `val` variable
                    // so if the type of the field is "array" we use the default
                    // value of an empty array.
                    if (typeof val === "undefined") {
                        val = [];
                    }

                    var $tbody = $this.children("tbody");

                    // Remove extra unnecessary table rows.
                    $tbody.children("tr").slice(val.length).remove();

                    // Add the remaining new necessary rows using the `add`
                    // method which also sets the values.
                    for (var i = $tbody.children("tr").length; i < val.length;
                            i++) {
                        self.add($this, val[i]);
                    }

                    return;
                }

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
         * @param {Boolean} includeFieldsBeingEdited Optional, if true the data
         * of the fields that are currently being edited will also be included
         * in the final returned object.
         * @return {Object} The object containing data taken from form inputs.
         */
        self.getData = function (path, root, includeNewItemEditors,
                includeFieldsBeingEdited) {
            var directValue, data, selector;

            /*!
             * analyzePath
             * Returns the processed field path computed by analyzing `p`, or
             * `undefined` if the path is to be ignored. The processed field
             * path is `p` after `path` is deleted from its beginning and after
             * the potential dot character at the beginning of it is deleted.
             *
             * @name analyzePath
             * @function
             * @param {String} path The field path from which the data is to be
             * extracted.
             * @param {String} p The field path to be processed, specified in
             * the `data-json-editor-path` attribute on the current field jQuery
             * input element.
             * @param {Boolean} includeNewItemEditors If not true, new item
             * editors (inputs for fields with paths starting with +.,
             * containing .+. or ending with .+) are not included in the
             * extracted data, so if the path `p` is the path of a new field
             * editor this function will return `undefined`.
             * @return {String|undefined} The field path `p` after it is
             * processed, or if the path `p` is not of a field from which data
             * should be extracted, `undefined`.
             */
            function analyzePath(path, p, includeNewItemEditors) {
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

                // If `includeNewItemEditors` is not true and this is the path
                // of a new item editor in a table, skip.
                if (!includeNewItemEditors && /(^\+\.|\.\+$|\.\+\.)/.test(p)) {
                    return;
                }

                return p;
            }

            path = path || "";
            root = root || self.container;

            directValue = false;
            data = {};

            // Traverse all the fields in the UI which are not being edited (and
            // they do not have a parent field that is being edited). If the
            // `includeFieldsBeingEdited` argument is true, also traverse the
            // fields that are being edited and their descendant fields.
            selector = "[data-json-editor-path]";
            if (!includeFieldsBeingEdited) {
                selector += ":not(.json-editor-edited, .json-editor-edited *)";
            }
            $(selector, root).each(function () {
                var val;
                var $this = $(this);
                var type = $this.attr("data-json-editor-type");

                var p = $this.attr("data-json-editor-path");
                p = analyzePath(path, p, includeNewItemEditors);
                if (typeof p !== "string") return;

                // If `type` is "array" we set the value to an empty array to be
                // sure that an array with no elements will still be in the
                // generated data. The elements of the array will be read from
                // other jQuery elements with paths ending in ".X" or
                // containing ".X." where `X` is a number.
                if (type === "array") {
                    val = [];
                } else if (type === "object") {
                    // Handle objects without fields. (They might have a purpose
                    // if they have the `addField: true` property set.)
                    val = {};
                } else {
                    // If `type` is not an array we read the value from the
                    // jQuery element.
                    val = self.getValueFromElement($this);
                }
                if (p.length > 0) { // If the given path is not a direct value
                    // set the value in the `data` object at the specified
                    // path.
                    data[p] = val;
                } else {
                    // If it is a direct value, at the end of the function we
                    // will return `data` without processing it.
                    directValue = true;
                    data = val;
                }
            });

            // Handle fields with editable names.
            $("[data-json-object-key]", root).each(function () {
                var $this = $(this);

                // The path to the field with editable key
                var p = $this.attr("data-json-key-path");
                p = analyzePath(path, p, includeNewItemEditors);
                if (typeof p !== "string") return;

                var value = data[p];
                delete data[p];
                data[$this.val()] = value;
            });

            if (directValue) {
                return data;
            }
            return handleArrays(unflattenObject(data));
        };

        // Merge schema object
        settings.schema = mergeRecursive(sch(settings.data), settings.schema);

        // Attach core properties to schema objects
        schemaCoreProperties(settings.schema);

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
            if (Object.prototype.toString.call(value) === "[object Date]") {
                return value.toLocaleDateString();
            }
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
        // For types "array" and "object" we do not use a label because inside
        // fields of type "array" and "object" there can be other "arrays" and
        // the <label> element would send a click event to either the first
        // field inside the "object" field which would scroll the page when the
        // field of type "object" is big, or to the buttons inside the <table>
        // representation of the field of type "array", when that <table>
        // represents the first field inside the parent field, every time the
        // user would click inside that field of type "array" or "object".
        "array":    $("<div>"),
        "object":   $("<div>"),
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
