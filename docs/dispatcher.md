
# Dispatcher

Dispatcher is a class responsible for processing events and actions. Whenever you add actions to the view in the constructor, dispatcher will be automatically created. You can then emit actions directly using the dispatchEvent method of the view or declaratively from bindings in the DOM.

Example:

```js
import {View} from 'kff'

const myView = new View({
    actions: {
        myFirstAction: (event) => console.log('Just called my first action!')
    }
})
myView.initAll()
myView.dispatchEvent({
    type: 'myFirstAction'
})
```

Call the action from the data-binding on click:

```html
<html>
    <body>
        <p data-kff-bind=":click:dispatch(myFirstAction)"></p>
    </body>
</html>
```

Every action is just a plain function that accepts one argument - the event object. The event object is plain javascript object that has one mandatory property - `type` - the name of the action. The event object can contain other properties as well - it's just a container to pass parameters or data to the action.

The action can return:

* another event object - which will be emited after the current action ends
* an array of event objects - they will be emited sequentially
* a Promise that resolves to an event object that will be emited aftewards
* a function that will be immediately called with one argument - the dispatch function that can be used to dispatch another events

The last two variants allows for async actions to be performed easily.

Example using async action with async/await to perform ajax fetch:

```js
function ajaxFetchAction({url, cursor, errorCursor})
{
    return async function(dispatch)
    {
        try
        {
            const response = await fetch(url);
            const responseJson = await response.json();

            dispatch({
                type: 'set',
                cursor: cursor,
                value: responseJson
            });
        }
        catch(error)
        {
            dispatch({
                type: 'set',
                cursor: errorCursor,
                value: 'An error occured...'
            })
        }
    }
}
```

There are four special events the view listens to that can be used to refresh he view:

* `refresh` - refreshes the view tree starting from the current view immediately
* `refreshFromRoot` - refreshes the view tree starting from the root view immediately
* `refreshRaf` - refreshes the view tree starting from the current view on the next requestAnimationFrame cycle
* `refreshFromRootRaf` - refreshes the view tree starting from the root view on the next requestAnimationFrame cycle

There is one special default action:

```js
{
    type: 'set',
    cursor: /* cursor pointing to some state property */,
    value: /* a new value to be set */
}
```

This action is called from bindings that need to set some value to the state (for example `:val`, `:click` etc.). The action performs immutable set operation on the state and dispatches the `refreshFromRootRaf` action causing refresh of the DOM tree on the next animation frame.

You can redefine this default set action by something else (for example to refresh immediately instead of on the next animation frame), but it's not recommended as it can cause breaking the behaviour of the bindings.
