var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");

module.exports = function(config) {

    var self = this;
    Events.call(self, config);

    $(self.dom).on("submit", "form", function (e) {

        e.preventDefault();

        var $form = $(this);
        var serializedForm = {};

        $form.find("[data-field]").each(function () {
            var $element = $(this);
            var how = $element.attr("data-value") || "val";
            var params = $element.attr("data-params");
            var field = $element.attr("data-field");
            var value;

            if (!params) {
                value = $element[how]();
            } else {
                value = $element[how](params);
            }

            serializedForm[field] = value;
        });

        self.emit(config.eventName || "serializedForm", serializedForm);
    });

    self.fillForm = function (data) {

        self.clearErrors();

        if (!data) {
            self.showError("No list selected.");
            return;
        }

        if (data.length > 1) {
            self.showError("You can't edit multiple lists at same time.");
            return;
        }

        config.onFill = config.onFill || {};

        for (var i in config.onFill.binds) {
            var bindObj = config.onFill.binds[i];
            bindObj.context = self.dom;

            // TODO When will be added this into bind?
            //      Doesn't support multiple attrs
            if (bindObj.attr && bindObj.attr[0].name === "value") {
                var value = bindObj.attr[0].value;
                if (typeof value === "object") {
                    // TODO Doesn't support dot notation
                    value = data[0][value.source];
                }
                $(bindObj.target, self.dom).val(value);
            }
            else {
                Bind.call(self, bindObj, data[0]);
            }
        }
    };

    self.showError = function (err) {
        if (err) {
            var $newAlert = $("<div>");
            $newAlert.addClass("alert fade in danger alert-error");
            $newAlert.append("<button type='button' class='close' data-dismiss='alert'>×</button>");
            $newAlert.append(err);

            $("form", self.dom).before($newAlert);
            $newAlert.fadeIn();
            $("form", self.dom).hide();
            return;
        }

        $("form", self.dom).show();
        $(".alert-error", self.dom).remove();
    };

    self.clearErrors = function () {
        $("form", self.dom).show();
        $(".alert-error", self.dom).remove();
    };
};
