(function ($) {


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
            container: this
        }, opt_options);

        var self = {
            ui: $.extend(JsonEdit.ui, opt_options.ui),
            labels: $.extend(JsonEdit.labels, opt_options.labels),
            groups: $.extend(JsonEdit.groups, opt_options.groups),
            inputs: $.extend(JsonEdit.inputs, opt_options.inputs),
            converters: $.extend(JsonEdit.converters, opt_options.converters),
            createGroup: function (obj) {
                if (obj.type === "array") {
                    // TODO Long story here
                    return;
                }
                var $group = self.groups[obj.type].clone(true);
                // TODO Configurable
                $group.find("label").append(self.labels[obj.type].clone(true).text(obj.label));
                var $input = self.inputs[obj.type].clone(true).attr({
                    "data-json-editor-path": obj.path
                }).appendTo($group.find("label"));
                if (obj.type === "boolean") {
                    $input.prop("checked", obj.value);
                } else if (obj.type === "date") {
                    $input[0].valueAsDate = obj.value;
                } else {
                    $input.val(obj.value);
                }

                return $group;
            },
            elms: {}
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

                    if (t === "array") {
                        schema[path + k] = [sch(c[0], schema, path + k)];
                        continue;
                    }

                    if (t === "object") {
                        sch(c, schema, path + k + ".");
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
        settings.data = flattenObject(settings.data);

        for (var k in settings.schema) {
            var c = settings.schema[k];
            if (getTypeOf(c) === "array") {
                // TODO
                continue;
            }
            c.label = c.label || k;
            c.path = k;
        }

        for (var k in settings.schema) {
            var c = settings.schema[k];
            if (getTypeOf(c) === "array") {
                // TODO
                continue;
            }
            settings.container.append(self.createGroup({
                value: settings.data[c.path],
                type: c.type,
                label: c.label,
                path: c.path
            }));
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
        "date":     $("<div>").append($("<label>"))
    };

    JsonEdit.labels = {
        "number": $("<span>"),
        "boolean": $("<span>"),
        "string": $("<span>"),
        "regexp": $("<span>"),
        "array": $("<span>"),
        "date": $("<span>")
    };

    JsonEdit.inputs = {
        "number": $("<input>", {type: "number"}),
        "boolean": $("<input>", {type: "checkbox"}),
        "string": $("<input>", {type: "text"}),
        "regexp": $("<input>", {type: "text"}),
        "array": $("<input>", {type: "text"}),
        "date": $("<input>", {type: "date"})
    };
})($);

