Form Serializer
===============

Mono module that serialize an form object and emits it.

# Documentation

## How to use

Place in the module HTML `data-field` and `data-value` atributes.

<table>
    <thead>
        <tr>
            <th>Value</th>
            <th>Description</th>
            <th>Default value</th>
            <th>Required</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>`data-field`</td>
            <td>Name of the `key` from object.</td>
            <td>No default value.</td>
            <td>Yes</td>
            <td>`data-field="author"`</td>
        </tr>
        <tr>
            <td>`data-value`</td>
            <td>It's the name of the function how the value will be taken.</td>
            <td>`val`</td>
            <td>No (will take the default value)</td>
            <td>`data-value="text"`</td>
        </tr>
        <tr>
            <td>`data-params`</td>
            <td>Params of jQuery function set as `data-value`.</td>
            <td>No default value</td>
            <td>Not required.</td>
            <td>`data-params="checked"`</td>
        </tr>
    </tbody>
</table>

## Example

**TODO**
