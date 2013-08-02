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

        if (data.length > 1) { return alert("You can't edit multiple lists at same time."); }
        config.onFill = config.onFill || {};

        for (var i in config.onFill.binds) {
            var bindObj = config.onFill.binds[i];
            bindObj.context = self.dom;
            Bind.call(self, bindObj, data);
        }
    };
};
