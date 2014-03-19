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
    link.send(200, {
        html: "Foo"
    });
};
