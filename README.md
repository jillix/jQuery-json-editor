Form Serializer
===============

Mono module that serialize an form object and emits it.

# Documentation

## Module configuration

The event module name is configurable (the default value is `serializedForm`).

```JSON
{
    "eventName": "myCustomEventName"
}
```

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
            <td><code>data-field</code></td>
            <td>Name of the <code>key</code> from object.</td>
            <td>No default value.</td>
            <td>Yes</td>
            <td><code>data-field="author"</code></td>
        </tr>
        <tr>
            <td><code>data-value</code></td>
            <td>It's the name of the function how the value will be taken.</td>
            <td><code>val</code></td>
            <td>No (will take the default value)</td>
            <td><code>data-value="text"</code></td>
        </tr>
        <tr>
            <td><code>data-params</code></td>
            <td>Params of jQuery function set as <code>data-value</code>.</td>
            <td>No default value</td>
            <td>Not required.</td>
            <td><code>data-params="checked"</code></td>
        </tr>
    </tbody>
</table>

# Example

```HTML
<form>
    <input type="text" data-field="author" value="Ionică Bizău" />
    <input type="checkbox" data-field="visible" data-value="prop" data-params="checked" value="Ionică Bizău" />
</form>
```

When the form above will be submitted the following JSON object will be generated and emited:

```JSON
{
    "author": "IonicaBizau",
    "visible": false
}
```
