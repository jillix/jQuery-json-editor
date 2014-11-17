$(function () {
    var firstForm = $(".first-form").jsonEdit({
        data: {
            age: 19,
            country: "Romania",
            name: {
                first: "Johnny",
                last: "B."
            },
            student: true,
            born: new Date(1995, 9, 14),
            hobbies: ["piano", "blogging"]
        },
        schema: {
            born: {
                label: "Born Date"
            }
        }
    });

    $("button").on("click", function () {
        console.log(firstForm.getData());
    });
});
