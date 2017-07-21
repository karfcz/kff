
# View

View is a basic building block of user interface. Despite its name, it's more like a component. Its responsibility is to render a part of UI, transport changes of the state to the UI and trigger actions in response to user interactions.

Every view is bound to a single DOM element. Anything that happens inside the element is managed by the view or by some nested view.

The view is an instance of the `View` class. The instance is created using the `new` operator, but you usually create only the root View. Subviews are created automatically by the framework.

Every view can contain lifecycle methods that are automatically called during the life cycle of the view.

Basic lifecycle of the view consist of these steps:

* The constructor is called. It is passed an options object. You always have to call super(options) in your constructor to properly intialice the view internals.

* The first lifecycle method is `render`. It renders the template HTML for the view. It is not nessesary to implement the render method. In that case, the view will work with existing DOM inside the element and will not touch it unless you implement your own DOM manipulations inside the view. You should not do any instance-dependent initializations, state changes or event handling in the render method. The reason for it is that this method is not always called on every view. For example, when the view is inside the `:each` binding, the DOM subtree will be cloned and the render method will be called only for the first collection element. For cloned views the render call is suppressed because the rendered DOM tree is cloned instead. Only the constructor and then the `run` method are called (and subsequent lifecycle methods as well).

* After the `render` method is called, the framework will look for any subviews (elements with `data-kff-view` or `data-kff-bind` attributes), will internally store them, recursively create subviews and call their render methods. The component tree is created in this phase.

* The `run` method will initialize the view. You should place any event listeners, timers and other initializations here.

* The `afterRun` method is called after the whole tree is initialized (after the run method is called for every subview)

* The `refresh` method is called on any state change. You do any DOM updating according to the new state here. Usually it is being called many times during the life cycle for the whole component tree. You should carefully decide when to do actual DOM manipulations and when not. Do not blindly make changes to the DOM for every `refresh` call as it leads to bad performance and UX.

* The `destroy` method is called when the view is being destroyed (and the element is usualy removed from teh DOM). This occurs when the view is inside the `:each` od `:if` binder, or when some ancestor view called the `destroyAll` method manually. You should clean up any local state and remove any listeners, timers etc. here.

The lifecycle methods have no arguments.

### Hello World Example

```html
<html>
	<body>
    	<p data-kff-bind="state.hello:text"></p>
    </body>
</html>
```

```js
import {View, Cursor} from 'kff';

const stateCursor = new Cursor({
	hello: 'Hello World'
});

const myView = new View({
    scope: {
        state: stateCursor
    }
});
myView.initAll();
```

### Constructor

The constructor accepts exactly one argument - the `options` object. You must always call the construtor of the base class using the super function:

```js
import {View} from 'kff'

class MyView extends View
{
    constructor(options)
    {
        super(options)
    }
}
```

The options object contains these properties:

* `options.element` - DOM element for the View,
* `options.scope` - plain javascript object containing named constructors of the views, cursors and helper functions, that will be acailable in the bindings and subviews (more about the scope later),
* `options.actions` - object with actions for this view,
* `options.dispatcher` - optional custom dispatcher,
* `options.isolated` - optional flag - if set to `true`, the view will be isolated from the ancestor scope (defaults to false),
* `options.env` - optional object for setting alternative DOM environment, contains 2 properties: document and window (for testing purposes)
* `options.parentView` - reference to the parent view.

### Creating views

Views can be created in imperative way using the new operator, but you usually do that only for the root view (which is by default attached to the body element). All the others subviews are created automatically from the `data-kff-view` attribute on appropriate elements. The content of the attribute corresponds to the name of the view registered in the scope of some ancestor view.


### Properties available in the View class

The base class exposes some useful properties to the inherited class:

* `this.parentView` - referance to the parent view (or null for the root view)
* `this.element` - a DOM element the view is attached to
* `this.options` - the options object that was the constructor called with
* `this.scope` - the scope object for given view.

#### Scope

The scope is an object that inherits properties from parent view scope using prototypical inheritance. Anything you add, change or remove to the scope, it becomes automatically available in every descendant view's scope.

What belongs to the scope?

* cursors containing state
* helper functions for bindings (parsers, formatters)
* view constructors

#### Isolated views

You can construct the view as isolated. In this case the scope won't inherit anything from the parent scope. It's good for safety, but it is not very usable to have every view isolated.

```js
import {View} from 'kff'

class MyView extends View
{
    constructor(options)
    {
        super({...options, isolated: true})
    }
}
```


### Delegated DOM events

It's common to have one or more DOM event handlers in the view. The KFF framework provides a useful way to attach these handlers automatically during initialization of the view and remove them at the destroy.

```js
import {View} from 'kff'

class MyView extends View
{
    constructor(options)
    {
        super({
            ...options,
            events: [
                ['click', 'a.btn', 'clickButton'],
                ['mouseenter mouseleave', 'toggleHover']
            ]
        })
    }

    clickButton(event)
    {
        ...
    }

    toggleHover(event)
    {
        ...
    }
}
```

The events property can be:

* array of two or three items (for single event handler)
    * the first item is the event name(s)
    * the last item it hanlder method name (or handler reference)
    * the middle item (if present) is a CSS selector to match
* array of arrays of two or three items (for multiple event handlers)


## Methods of the View class

### initAll

This method calls renderAll, runAll and afterRunAll. It can be used to manually initialize the view and all of its subviews recursively.

`renderAll` method calls the render method of the view, (re)initializes subviews and bindings from newly rendered DOM and calls renderAll methods for every subview found (and so on recursively).

`runAll` method calls the run method of the view and then calls the run method for every subview.

`aferRunAll` method calls the afterRun method of the view and then calls the afterRun method for every subview.

It is not recommended to call renderAll, runAll or aferRunAll directly.

### refreshAll

Refreshes recursively the view and all of its subviews from top to down. Note that the refresh will start from the view it is called on and any of ancestor views won't be refreshed. Call this method if you need manually refresh the view tree. It is usually not needed as the refresh can be triggered by the `refresh` action which is triggered after any state change.

### refreshFromRoot

Refreshes recursively the view and all of its subviews from the root view. It's like calling refreshAll on the root view, but you can call it in any subview.

### destroyAll

Destroys the view and all its subviews.

### dispatchEvent(event)

Dispatches event using the closest dispatcher. If the view does not have a dispatcher, it will call the dispatchEvent on the parentView until it founds one. Ususally the root view has dispatcher created by default.

I accepts one argument - event object (see dispatching events)





