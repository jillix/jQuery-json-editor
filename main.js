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
};
