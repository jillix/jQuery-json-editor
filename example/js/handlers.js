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
            hobbies: ["piano", "blogging"],
            born: new Date(1995, 9, 14),
            keyboars: [
                {
                    manufacturer: "Yamaha",
                    type: "PSR8000",
                    pianoKeys: false,
                    digital: true
                },
                {
                    manufacturer: "Yamaha",
                    type: "P95",
                    pianoKeys: true,
                    digital: true
                }
            ]
        },
        schema: {
            born: {
                label: "Born Date"
            }
        }
    });

    $("button").on("click", function () {
        $("pre").html(JSON.stringify(firstForm.getData(), null, 4));
    });
});
