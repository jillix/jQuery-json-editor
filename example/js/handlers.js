$(function () {
    var firstForm = null;
    $("#updateForm").on("click", function () {
        firstForm = $(".first-form").empty().jsonEdit(
            eval($("#inputData").val())
        );
    }).click();
    $("button#getData").on("click", function () {
        $("pre").html(JSON.stringify(firstForm.getData(), null, 4));
    });
});
