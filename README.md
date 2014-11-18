# jQuery JSON Editor
A jQuery library for editing JSON data.

## Documentation
## `$.fn.jsonEdit(opt_options)`
Initializes the JSON editor on selected elements.

### Params
- **Object** `opt_options`: An object containing the following fields:
 - `data` (Object): The input JSON data (default: `{}`).
 - `schema` (Object): The JSON data schema. The provided object will be merged with default schema.
 - `autoInit` (Boolean): If `true`, the forms will be added by default (default: `true`).

### Return
- **Object** The JSON editor object containing:
 - `labels` (Object): An object with UI elements used for labels.
 - `groups` (Object): An object with UI elements used for groups.
 - `inputs` (Object): An object with UI elements used for inputs.
 - `container` (jQuery): A jQuery object being the container of the JSON editor.
 - `createGroup` (Function): Creates a form group.

## `createGroup(field)`
Creates a form group and returns the jQuery object.

### Params
- **Object** `field`: The field object.

### Return
- **jQuery** The jQuery object form.

## `getValue(fieldPath)`
Returns the value of field.

### Params
- **String** `fieldPath`: The path to the value.

### Return
- **Anything** The value taken from data.

## `initUi()`
Creates the form from JSON data.

## `getData()`
Collects data from form inputs and return the data object.

### Return
- **Object** The object containing data taken from forms.

## How to contribute

1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](/LICENSE) file.
