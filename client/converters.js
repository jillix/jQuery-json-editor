// converters
var converters = {
    string: function (value) {
        return value.toString();
    },
    number: function (value) {
        return Number (value);
    },
    boolean: function (value) {
        return (value === true || value === "true" || value === "on" || typeof value == "number" && value > 0 || value === "1");
    }
};

// export converters
module.exports = converters;
