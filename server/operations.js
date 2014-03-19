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

    // missing form id
    if (!data.formId) {
        return link.send(400, "Missing formId");
    }

    // html path
    var htmlPath = params[data.formId];

    // invalid form id
    if (!htmlPath) {
        return link.send(400, "Wrong form id.");
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
