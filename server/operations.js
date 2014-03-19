// dependencies
var fs = require("fs");

/**
 *
 *  form-serializer#loadForm
 *
 *  This is the server operation that reads the content of
 *  the HTML file that must be loaded and sends it back to the
 *  client.
 *
 */
exports.loadForm = function (link) {

    // get data, params
    var data = Object(link.data)
      , params = link.params
      ;

    // params.forms owns the form ids
    if (!params.forms || params.forms.constructor.name !== "Object") {
        return link.send(400, "params.forms must be an object.");
    }

    // missing form id
    if (!data.formId) {
        return link.send(400, "Missing formId");
    }

    // html path
    var htmlPath = params.forms[data.formId];

    // invalid form id
    if (!htmlPath) {
        return link.send(400, "Wrong form id.");
    }

    // handle i18n
    if (htmlPath.constructor.name === "Object") {
        htmlPath = htmlPath[link.session._loc] || htmlPath[Object.keys(htmlPath)[0]];
    }

    // set the absolute path to the html file
    htmlPath = M.app.getPath() + htmlPath;

    // read the file
    fs.readFile(htmlPath, function (err, buffer) {

        // handle error
        if (err) {
            return link.send(400, err);
        }

        // send success response
        link.send(200, {
            html: buffer.toString()
        });
    });
};
