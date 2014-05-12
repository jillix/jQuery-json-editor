// dependencies
var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");
var Utils = require("github/jillix/utils");
var Converters = require("./converters.js");

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
 *        "module": "github/IonicaBizau/form-serializer/version"
 *      , "roles": [0, 1, ..., n]
 *      , "config": {
 *            "html": "/path/to/html/file.html"
 *            "eventName": "editList"
 *          , "validators": {
 *                "fillForm": "namespace.form_serializer.validateData"
 *            }
 *          , "onFill": {
 *                "binds": [BIND_OBJECTS]
 *            }
 *          , "listen": {EVENT_OBJECTS}
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
 *        "author": "IonicaBizau"
 *       ,"visible": false
 *    }
 *
 *
 */
module.exports = function(config) {

    // get module
    var self = this;

    // call events
    Events.call (self, config);

    // binds
    config.binds = config.binds || [];

    // run the binds
    for (var i = 0; i < config.binds.length; ++i) {
        Bind.call (self, config.binds[i]);
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

                // convert to
              , convertTo = $element.attr("data-convert-to")

                // delete if
              , deleteIfValue = $element.attr("data-delete-if")

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

            // convert to provided and is a valid value
            if (convertTo && Converters[convertTo]) {
                value = Converters[convertTo](value);
                deleteIfValue = Converters[convertTo](deleteIfValue);
            }

            // verify if value can be added
            if (value == deleteIfValue) {
                return;
            }

            // set the value in the serialized form object using the field
            serializedForm[field] = value;
        });

        // the object should be unflatten
        serializedForm = Utils.unflattenObject(serializedForm);

        // emit an eventName or "serializedForm" event
        self.emit(config.eventName || "serializedForm", serializedForm);
    });

    /**
     * setFormHtml
     * This will set the form HTML
     *
     * @param newHtml: the new HTML of the module
     * @return
     */
    function setFormHtml (newHtml) {
        $("#" + self.miid).html(newHtml);
    }

    /**
     * fillForm
     * This function fills the form using @data provided and the binds
     * set in configuration.
     *
     * If no binds are provided, the module will try to set the values via
     * dot notation.
     *
     * @param data
     * @param binds
     * @return
     */
    self.fillForm = function (data, binds) {

        // clear all errors
        self.clearErrors();

        // if a filter function is provided
        var fillFormFilterFunction = Utils.findFunction(window, self.config.validators.fillForm);

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
        config.onFill.binds = binds || config.onFill.binds || [];

        // no binds
        if (!config.onFill.binds.length) {

            var flattenForm = Utils.flattenObject (data)
              , fields = Object.keys (flattenForm)
              ;

            // each field
            for (var i = 0; i < fields.length; ++i) {

                // get the field, params and value
                var cField = fields[i]
                  , $field = $("[data-field='" + cField + "']", self.dom)
                  , dataParams = $field.attr("data-params")
                  , dataValue = $field.attr("data-value")
                  , args = []
                  ;

                // push data params
                if (dataParams) {
                    args.push (dataParams);
                }

                // push value
                args.push (flattenForm[cField]);

                // set the value
                $field[dataValue || "val"].apply($field, args);
            }
            return;
        }

        // run binds
        for (var i = 0; i < config.onFill.binds.length; ++i) {
            var bindObj = config.onFill.binds[i];
            bindObj.context = self.dom;
            Bind.call(self, bindObj, data[0]);
        }
    };

    /**
     * loadForm
     * This function loads a form dinamically
     *
     * @param options: object containing:
     *  - formId: the form id that must be loaded
     * @param callback: the callback function
     * @return
     */
    var formCache = {};
    self.loadForm = function (options, callback) {

        // default callback
        callback = callback || function () {};
        options = Object(options);

        // try to get the html from cache
        var htmlFromCache = formCache[options.formId];

        // found html in cache
        if (htmlFromCache && typeof htmlFromCache.html === "string") {

            // load it
            setFormHtml(htmlFromCache.html.clone());

            // callback
            callback (null, htmlFromCache)

            // and don't call a server operation anymore
            return;
        }

        // call the server operation
        self.link("loadForm", { data: options }, function (err, response) {

            // handle error
            if (err) { return callback (err, null); }

            // get html
            var htmlToLoad = response.html = $(response.html, "#" + self.miid);

            // add response in cache
            formCache[options.formId] = response;

            // set form html
            setFormHtml (htmlToLoad);

            // callback
            callback (null, response)
        });
    };

    /**
     * showError
     * Shows an error
     *
     * @param err: string containing the error message. If undefined, the errors will be cleared.
     * @return
     */
    self.showError = function (err) {

        // if an error is provided
        if (typeof err === "string") {

            // create alert div
            var $newAlert = $("<div>");
            $newAlert.addClass("alert fade in danger alert-error alert-danger");

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
     * clearErrors
     * Clear errors
     *
     * @return
     */
    self.clearErrors = function () {

        // show the form
        $("form", self.dom).show();

        // and remove the errors
        $(".alert-error, .alert-danger", self.dom).remove();
    };

    // emit ready
    self.emit("ready", self.config);
};

