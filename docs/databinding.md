
# Data binding

Data binding in KFF is not a typical MVC binding. It's more like a flux style lifecycle. The component tree is regularly refreshed from the root for every change. Bindings are smart enough to only change the DOM when their state value has changed since the last refresh cycle.

There are three types of bindings:

* One-way bindings that only change the DOM according to state.
* Two-way bingings in addition react to user interactions and dispatch actions that can change the state and trigger refresh cycle.
* 'Reverse' one way bindings that don't change the DOM but only dispatch actions that perform some changes to the state and trigger refresh cycle.

By default, two-way and reverse one-way bindings dispatch the `set` action with the following event:

```js
{
    type: 'set',
    cursor: // cursor pointing to bound state property
    value: // a new, changed value from the DOM
}
```

## Syntax of bindings

Bindings are declared in the `data-kff-bind` attribute. Each element that has this attribute becomes an anonymous view, so this:

```html
<div data-kff-bind="name:text"></div>
```

Is the same as this:

```html
<div data-kff-view="View" data-kff-bind="name:text"></div>
```

You can also set binding to custom views but make sure you don't mess up the same DOM property inside the view.

An element can have multiple bingings separated by space:

```html
<div data-kff-bind="state.show:if state.name:text state.color:style(color)"></div>
```

Usually it makes no sense to mix two bingings of the same type (it doesn't make sense to use for example two `:text` bindings on the same element). But for some type of bindings it is perfectly valid and useful (i.e. for class binding or click binding).

Let's look at the formal binding syntax:

`[<key-path> | <function(args?)>]:<binding-type>[:<modifier>]+`

where:

* `<key-path>` is the path to the state property in the form `cursor.path.to.property`. The `cursor` part is the name of the cursor in the scope of the view (or in the scope of any ancestor view if the view is not isolated)
* `<function>` - instead of the cursor, you can point to a function in the scope that returns value for the binding.
* `<binding-type>` - one of the built-in binding types
* `<modifier>` - one or more of the built-in binding modifiers

## Function binding

Using a function instead of key path is a flexible way to perform dynamic computations. Function can take variable length of arguments as declared in the binding:

`sum(@state.some.property, @state.some.other.property):text`

```js
function sum(firstCursor, secondCusor)
{
    return firstCursor.get() + secondCursor.get();
}
```

Note the `@` prefix indicates a cursor in the scope of the current view. Without it, arguments will be converted to primitive data types using algorithm described later:

`add(@state.some.property, 42):text`

```js
function add(firstCursor, number)
{
    return firstCursor.get() + number;
}
```

But the preffered way is to use *dereferenced* cursor values (@@ operator gets the cursor value instead of cursor itself):

`add(@state.some.property, @@state.some.other.property):text`

```js
function add(firstCursor, number)
{
    return firstCursor.get() + number;
}
```

## Binding parsing types and values

You can usually use any of the following data types inside the bindings (wherever a value is expected):

* boolean literal (`true` or `false`)
* number literal (decimal, hexadecimal, octal, binary integers or floating-point literals)
* string literal (enclosed in single quotes – 'string literal')
* null literal (`null`)
* undefined literal (`undefined`)
* identifier (must obey the following regex: `/^[a-zA-Z_$*%][0-9a-zA-Z_$-]*/`)
* cursor reference (`@some.path.in.state`) – usually as an argument in `dispatch` – will pass the cursor object
* cursor dereference (`@@some.path.in.state`) – will return a value from the cursor

## Modifiers

Modifiers affect the behavior of the binding in some way. The most common modifiers are parser and formatter but there are more types of modifiers.

#### `:parse(<parser-function>#)` or `:p(<parser-function>#)`

Parser is a function in the scope that takes exactly one argument and returns converted value. Parser is used only on binders that dispatch some value from the DOM to the state (typically the `:val` binder). Parser is never called on values that go from the state to the DOM. You can specify more parsers separated by comma. They are then chained from left to right.

There are several built-in parsers/formatters in KFF:

* `int` - converts string to integer
* `boolean` - converts string to boolean

##### Examples:

Convert value from input to integer:
`cart.amount:val:p(int)`

Convert value from input to integer and then to boolean:
`cart.amount:val:p(int, boolean)`

Map value to some object according to preddefined table:

```html
<select data-kff-bind="some.state.property:val:p(myConvert)">
    ...
</select>
```

```js
const myMap = {
    id1: { ... },
    id2: { ... },
    id3: { ... }
};

function myConvert(value)
{
    return myMap[value];
}
```

Parse functions are always applied to values from the DOM (from inputs, buttons, selects etc.) and also to the values hardcoded directly in the binder:

```html
<button data-kff-bind="state.switch:click(id2):p(myConvert)">Click me!</button>
```

The string `id2` will be converted before proceedeng to the set action.

#### `:format(<formatter-function>#)` or `:p(<formatter-function>#)`

Formatter is the exact opposite of the parser. It converts values that go from the state before it is passed to the DOM (= usualy formats value before displaying).

#### `:fill`

Only for DOM→state binders (typically for `:val` binder). It triggers the (by default) `set` action during the binding initialization without any user interaction. It is useful for the forms with prefilled data that you want to set to the state on page load. In other words it reverses the principle that the state is a single source of truth.

```html
<select data-kff-bind="some.state.property:val:fill">
    <option value="1">Option 1</option>
    <option value="2" selected>Option 2</option>
</select>
```

Without the `:fill` modifier, the option with a value that equals the state property would be selected on initialization. With the `:fill` modifier, the state property will be changed to value of `2` that corresponds to the pre-selected option.

#### `:on(<event>#)`

Only for DOM→state binders. It defines events on which the action will be dispatched.

`state:click(42):on(mouseenter, mouseleave)`

It will set the value on mouseenter and mouseleave events instead of click event.

#### `:dispatch(<action>, <param: value>#)`

Defines the action to be dispatched. Only for DOM→state binders.

* `<action>` is the name of the action registered to the view dispatcher
* `<param: value>` - one or more named arguments for the action.

The action is a function that takes exactly one argument. This argument is plain object that has always the following properties:

```js
{
    type: 'my-action',
    value: ..., // parsed value
    cursor: ... // cursor from the <key-path> part of the binder
}
```

More properties can be added using `<param: value>` declaration. For example:

`state:click(42):dispatch(myAction, otherCursor: @state.otherProperty, magicNumber: 65, magicString: 'whatever')`

Resulting in the following action event:

```js
{
    type: 'myAction',
    value: 42,  // parsed value - note that it is parsed as a number
    cursor: ...,  // cursor to the 'state',
    otherCursor: ..., // cursor to the 'state.otherProperty'
    magicNumber: 65,
    magicString: 'whatever'
}
```

#### `:nopreventdef`

This modifier has effect only for DOM→state bindings. By default, every binding supresses default browser action by calling `event.preventDefault()`. Sometimes it is usefull to not prevent default action and this modifier does exactly that.

## Binders

There are three basic types of binders and two special types of binders:

#### One-way binders from state → DOM:

* `:text` - renders string directly as the textContent of the element
* `:textappend` - appends a text node with the string to the element
* `:textprepend` - prepends a text node with the string to the element
* `:html` - renders string using the innerHTML property (beware - this can be dangerous and should not be used)
* `:class` - sets/unsets particular CSS class depending on state value
* `:attr` - sets element's attribute
* `:disabled` - sets element's disabled property

#### One-way binders from DOM → state:

* `:click` - sets some value when the element get clicked
* `:dblclick` - sets some value when the element get doubleclicked
* `:event` - similar to `:click` and `:doubleclick`, but for any DOM event
* `:focus` - sets some value when the element receives focus
* `:blur` - sets some value when the element losts focus

#### Two-way binders state ↔ DOM:

* `:val` - binds form element value to the state value and keeps them in sync (`value` property of the `input`, `textarea` and `select` elements)
* `:check` - binds state of the checkbox to the state
* `:radio` - binds state of the radiobuttons to the state
* `:focusblur` - allows to change focus of the element according to the state and viceversa

#### Special binders:

* `:if` or `:ifnot` - inserts/removes element from the DOM according to the state
* `:each` - collection binder that repeats DOM element for each item in the array

### One-way binders from state → DOM

#### `:text`

```html
<div data-kff-bind="state:text"></div>
```

The `div` text content will always reflect the string in the state.

You can use there additional named parameters:

```html
<div data-kff-bind="state:text(prefix: 'Hello, ')"></div>
```

The text content will be always prefixed with the string `'Hello, '`.

```html
<div data-kff-bind="state:text(suffix: 'px')"></div>
```

The text content will be always suffixed with the string `'px'`.

#### `:textappend`

```html
<div data-kff-bind="state:textappend">Hello, </div>
```

The state text will be appended to the `div` text content. The `prefix` and `suffix` named parameters can be used as well. There is also aditional named params `ws` (as white space):

```html
<div data-kff-bind="state:textappend(ws: true)">Hello,</div>
```

The appended text will be separated by single space character.

#### `:textprepend`

```html
<div data-kff-bind="state:textprepend">px</div>
```

The state text will be prepended to the `div` text content. The `prefix`, `suffix` and `ws` named parameters can be applied.


#### `:html`

```html
<div data-kff-bind="state:html"></div>
```

This is similar to the `:text` binder with one very important distinction: the text is inserted as the innerHTML property of the element.

**Warning: This is a very dangerous and unsafe way to insert any user-generated content to the DOM and should be only used for static html fragments. If the string contains any `script` tags, they would be interpretted causing a security hole!**.


#### `:class`

```html
<a class="btn" data-kff-bind="state:class(btn-red, 42)"></a>
```

Sets a `btn-red` class (in addition to the `btn` class) on the element if the state value equals to `42`. The first parameter is a class name, the second parameter is a value that the state must be equal to to apply the class. When the state changes to a different value, the class will be removed.

If the second parameter is ommited then the state value will be tested to 'truthyness'.

The second parameter can be any of the standard types allowed in the binding. This will set the class if the value of `state` is equal to the value of `some.other.state`:

```html
<a class="btn" data-kff-bind="state:class(btn-red, @some.other.state)"></a>
```

You can use function binding to provide a more sophisticated comparison:

```html
<a class="btn" data-kff-bind="isGreater(@@state, @@some.other.state):class(btn-red)"></a>
```

```js
const isGreater = (value1, value2) => value1 > value2;
```

Note that you can use multiple class binders on the same element but make sure they use different class names:

```html
<a class="btn" data-kff-bind="state.isError:class(btn-red) state.isSuccess:class(btn-green)"></a>
```

#### `:attr`

```html
<a data-kff-bind="state.url:attr(href)"></a>
```

Sets an attribute of the element to a value from the state. The first parameter is the attribute name.

#### `:disabled`

```html
<a data-kff-bind="state.isLoading:disabled(42)"></a>
```

Sets the `disabled` attribute of the form element if the state value equals to `42`. The first parameter can be ommited - then the state value will be evaluated for truthyness.





### One-way binders from DOM → state:

#### `:click`

```html
<a data-kff-bind="state.showToolbar:click(true)"></a>
<div class="toolbar" data-kff-bind="state.showToolbar:if"></div>
```

Emits an action event of type `set` with a cursor pointing to `state.showToolbar` property and value `true`. The `set` action is embedded in the framework. It sets the state in the cursor and calls a refresh cycle to update the views according to the new state (which will show the toolbar - see `:if` binder).

The following example shows use of custom action:

```html
<a data-kff-bind="state.showToolbar:click(true):dispatch(showToolbar, saveStateToLocalStorage: true, state: @@state)"></a>
<div class="toolbar" data-kff-bind="state.showToolbar:if"></div>
```

```js
function showToolbar({cursor, value, saveStateToLocalStorage = false, state = null})
{
    var ret = [{
        type 'set',
        cursor,
        value
    }];

    if(saveStateToLocalStorage) {
        ret.push({
            type: 'saveToLocalStorage',
            state
        });
    }

    return ret;
}

function saveStateToLocalStorage({state})
{
    locaStorage['myState'] = JSON.stringify(state);
}
```

#### `:dblclick`

This is the same as `:click` but the action is triggered on double click instead of single click.


#### `:focus`

This is the same as `:click` but the action is triggered when the element receives the focus:

```html
<a data-kff-bind="state.showToolbar:focus(true)"></a>
```

#### `:blur`

This is the same as `:click` but the action is triggered when the element loses the focus:

```html
<a data-kff-bind="state.showToolbar:blur(false)"></a>
```

#### `:event`

This is the same as `:click` but the action is triggered on specified DOM event:

```html
<a data-kff-bind="state.showToolbar:event(true):on(mouseenter)"></a>
```


### Two-way binders state ↔ DOM:

#### `:val`

Binds a value of a form element to the state property. It can be used on elements such as `input`, `textarea` or `select`. The value of the form element is propagated to the state using the standard `set` action or any other custom action as shown in `click` binder.

```html
<input type="text" data-kff-bind="state.name:val">
<div>Your name: <span data-kff-bind="state.name:text"></span></div>
```

By default, the change is propagated as soon as possible (as you type) - the binder listens to events such as `input`, `keypress`, `drop` and `change` to catch every change of the value in all supported browsers (and eliminates some quirks by the way). You can override this behaviour by providing custom event in `:on` modifier:

```html
<input type="text" data-kff-bind="state.name:val:on(change)">
```

In this example, the `set` action will be dipatched only after the element loses focus.

If the input element has specified the `value` attribute, it will be ignored and overwritten on the first render by the state value. This behaviour can be reversed using the `:fill` modifier:

```html
<input type="text" value="foo" data-kff-bind="state.name:val:fill">
```

This will esentially dispatch the set action immediately after the first refresh cycle with the `foo` value of the element.


#### `:check`

Binds the checkbox `checked` property to the state.

```html
<input type="checkbox" value="foo" data-kff-bind="state.isChecked:check(42)">
```

The checkbox will be checked if the state.isChecked equals to 42 and unchecked otherwise. If you omit the parameter, the value will be evaluated to truthyness. You can use the same modifiers as in the :val binder (`:fill`, `:on` etc.)

#### `:radio`

Binds the radiobutton `checked` property to the state.

```html
<input type="radio" name="radio1" value="foo" data-kff-bind="state.isChecked:radio(foo)">
<input type="radio" name="radio1" value="bar" data-kff-bind="state.isChecked:radio(bar)">
```

This is similar to the `:check` binder with one difference - it works for a group of radiobuttons. You should always specify the name attribute.

#### `:focusblur`

This binder works like combination of `:focus` and `:blur` binders, but it also allows you to set focus of the element programatically. If you set the state to true, the element gets focused.

```html
<input type="text" value="foo" data-kff-bind="state.isFocused:focusblur">
```

### Special binders

#### `:if`

This binder conditionaly removes/appends the element from/to the DOM. It also destroys/inits all its subviews along the way.

```html
<div data-kff-bind="state.show:if">Warning! This is the if binder.</div>
```

By default, it will evaluate value to truthyness, but you can use comparing value argument like in the class binder:

```html
<div data-kff-bind="state.errorStatus:if('error')">An error occured.</div>
<div data-kff-bind="state.errorStatus:if('success')">Everything went ok.</div>
```

#### `:ifnot`

The same as the `:if` binder but with negative condition.

#### `:each`

Collection binder. This one is very different from other type of binders. It should always bind to an array. It repeats the element for every item in the array. The rendering is optimized so that it does only minimal amount of DOM operations. When you add one element to a 100-element array, only the new element will be rendered. If you add one item and remove other item at the same time, the element will be reused (unless you use the `key` modifier).

In the inner bindings you can reference to the item using dot notation:

```html
<ul data-kff-bind="state.items.length:if">
    <li data-kff-bind="state.items:each .name:text"></li>
</ul>
```

```js
const stateCursor = new Cursor({
    hello: 'Hello World'
});

const myView = new View({
    scope: {
        state: {
            items: [
                {
                    name: 'Wolfgang Amadeus Mozart'
                },
                {
                    name: 'Ludwig van Beethoven'
                }
            ]
        }
    }
});
myView.initAll();
```

You can use the `:as` modifier to assign different name to the item for inner bindings (nessesary for referencing to the items in nested lists):

```html
<ul data-kff-bind="state.items.length:if">
    <li data-kff-bind="state.items:each:as(composer) composer.name:text"></li>
</ul>
```

By default, the items are compared by value and elements can be reused for removed/added items. To prevet element reusing (for example for insert/remove animations - see later), you can specify the `key` modifier:

```html
<ul data-kff-bind="state.items.length:if">
    <li data-kff-bind="state.items:each:as(composer):key(id) composer.name:text"></li>
</ul>
```

```js
const stateCursor = new Cursor({
    hello: 'Hello World'
});

const myView = new View({
    scope: {
        state: {
            items: [
                {
                    id: '1',
                    name: 'Wolfgang Amadeus Mozart'
                },
                {
                    id: '2',
                    name: 'Ludwig van Beethoven'
                }
            ]
        }
    }
});
myView.initAll();
```

##### Numbering lists

When rendering lists using the `:each` binder, you will sooner or later want to number the items. It is possible using the special formatters `index` (numbers will start from zero) or `indexFromOne` (numbers starting from one):

```html
<ul data-kff-bind="state.items.length:if">
    <li data-kff-bind="state.items:each:as(composer):key(id) composer.name:text">
        <span data-kff-bind="composer:text:f(indexFromOne)"></span>
        <span data-kff-bind="composer.name:text"></span>
    </li>
</ul>
```

