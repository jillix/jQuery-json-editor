$(function () {
    var firstForm = $(".first-form").jsonEdit({
        data: {
            age: 19,
            country: "Romania",
            name: {
                first: "Johnny",
                last: "B."
            },
            location: {
                region: {
                    name: "Bihor",
                    country: {
                        name: "Romania"
                    }
                },
                shortname: "BH"
            },
            student: true,
            hobbies: ["piano", "blogging"],
            born: new Date(1995, 9, 14),
            keyboars: [
                {
                    manufacturer: "Yamaha",
                    type: "PSR8000",
                    digital: true,
                    manuals: ["Manual 1", "manual 2 Yamaha", "Ionica"],
                    test: [{ name: "Test"  }]
                },
                {
                    manufacturer: "Yamaha",
                    type: "P95",
                    digital: false
                },
                {
                    manufacturer: "KORG",
                    type: "AD",
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

    /**
     *  Schema:
     *  {
     *      age: { type: "number" },
     *      name.country: { type: "string" }
     *      ...
     *      hobbies: { type: "array", schema: {
     *          type: "string"
     *      }},
     *  }
     *
     * */

    $("button").on("click", function () {
        console.log(firstForm.getData());
    });
});
