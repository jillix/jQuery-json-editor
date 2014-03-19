M.wrap('github/IonicaBizau/form-serializer/dev/main.js', function (require, module, exports) {

// Bind and Events dependencies
var Bind = require("github/jillix/bind")
  , Events = require("github/jillix/events")
  ;

/**
 *
 *    Form Serializer Module for Mono
 *    ===============================
 *
 *    Mono module that serialize an form object and emits it.
 *
 *    Module configuration
 *    --------------------
 *
 *    The event module name is configurable (the default value is serializedForm).
 *
 *    "miidName": {
 *        "module": "github/IonicaBizau/form-serializer/version",
 *        "roles": [0, 1, ..., n],
 *        "config": {
 *            "html": "/path/to/html/file.html"
 *            "eventName": "editList",
 *            "validators": {
 *                "fillForm": "namespace.form_serializer.validateData"
 *            },
 *            "onFill": {
 *                "binds": [BIND_OBJECTS]
 *            },
 *            "listen": {EVENT_OBJECTS}
 *        }
 *    }
 *
 *    Example
 *    -------
 *
 *    <form>
 *        <input type="text" data-field="author" value="Ionică Bizău" />
 *        <input type="checkbox" data-field="visible" data-value="prop" data-params="checked" value="Ionică Bizău" />
 *    </form>
 *
 *    When the form above will be submitted the following JSON object will be generated and emited:
 *
 *    {
 *        "author": "IonicaBizau",
 *        "visible": false
 *    }
 *
 *
 */
module.exports = function(config) {

    // get module
    var self = this;

    // call events
    Events.call(self, config);

    // binds
    config.binds = config.binds || [];

    // run the binds
    for (var i = 0; i < config.binds.length; ++i) {
        Bind.call(self, config.binds[i]);
    }

    // set config in self
    self.config = config;

    // set validators value
    config.validators = config.validators || {};

    // on form submit
    $(self.dom).on("submit", "form", function (e) {

        // prevent default browser behavior
        e.preventDefault();

        // get submitted form
        var $form = $(this)

            // build serialized form object
          , serializedForm = {}
          ;

        // for each data-field
        $form.find("[data-field]").each(function () {

            // get the current element
            var $element = $(this)

                // how to get the value?
              , how = $element.attr("data-value") || "val"

                // get params
              , params = $element.attr("data-params")

                // get field
              , field = $element.attr("data-field")

                // create the value
              , value
              ;

            // if params aren't provided
            if (!params) {

                // get the value
                value = $element[how]();
            } else {

                // get the value using params
                value = $element[how](params);
            }

            // set the value in the serialized form object using the field
            serializedForm[field] = value;
        });

        // emit an eventName or "serializedForm" event
        self.emit(config.eventName || "serializedForm", serializedForm);
    });

    /**
     *
     *  Fill form
     *
     *  This fills the form using binds
     *
     * */
    self.fillForm = function (data) {

        // clear all errors
        self.clearErrors();

        // if a filter function is provided
        var fillFormFilterFunction = findFunction(window, self.config.validators.fillForm);

        // verify if the foud value is a function
        if (typeof fillFormFilterFunction === "function") {

            // get the result
            var result = fillFormFilterFunction(self, data, undefined, data);

            // if the result contains an error
            if (result && result.error) {

                // show that error
                self.showError(result.error);
                return;
            }
        }

        // get on fill binds from configuration
        config.onFill = config.onFill || {};
        config.onFill.binds = config.onFill.binds || [];

        // run binds
        for (var i = 0; i < config.onFill.binds.length; ++i) {
            var bindObj = config.onFill.binds[i];
            bindObj.context = self.dom;
            Bind.call(self, bindObj, data[0]);
        }
    };

    /**
     *
     *  Show error
     *
     * */
    self.showError = function (err) {

        // if an error is provided
        if (err) {

            // create alert div
            var $newAlert = $("<div>");
            $newAlert.addClass("alert fade in danger alert-error alert-danger");
            $newAlert.append("<button type='button' class='close' data-dismiss='alert'>×</button>");

            // append the error
            $newAlert.append(err);

            // append the aller before the form
            $("form", self.dom).before($newAlert);

            // show it
            $newAlert.fadeIn();

            // and hide the form
            $("form", self.dom).hide();
            return;
        }

        // if no error is provided, clearErrors
        self.clearErrors.call(self);
    };

    /**
     *
     *  Clear errors
     *
     * */
    self.clearErrors = function () {

        // show the form
        $("form", self.dom).show();

        // and remove the errors
        $(".alert-error, .alert-danger", self.dom).remove();
    };

    // emit ready
    self.emit("ready", self.config);
};

/**
 *
 *  Private functions
 *
 * */

// find value
function findValue (parent, dotNot) {

    if (!dotNot) return undefined;

    var splits = dotNot.split(".");
    var value;

    for (var i = 0; i < splits.length; i++) {
        value = parent[splits[i]];
        if (value === undefined) return undefined;
        if (typeof value === "object") parent = value;
    }

    return value;
}

// find function
function findFunction (parent, dotNot) {

    var func = findValue(parent, dotNot);

    if (typeof func !== "function") {
        return undefined;
    }

    return func;
}

return module; });
