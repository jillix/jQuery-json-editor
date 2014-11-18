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
            age: { label: "Age" },
            country: { label: "Country" },
            name: {
                schema: {
                    first: { label: "First Name" },
                    last: { label: "Last Name" }
                }
            },
            student: { label: "Student" },
            hobbies: { label: "Hobbies" },
            born: { label: "Born" },
            keyboars: {
                schema: {
                    manufacturer: { label: "Manufacturer" },
                    type: { label: "Type" },
                    pianoKeys: { label: "Piano Keys" },
                    digital: { label: "Digital" },
                }
            },
            born: { label: "Born Date" }
        }
    });

    $("button").on("click", function () {
        $("pre").html(JSON.stringify(firstForm.getData(), null, 4));
    });
});
