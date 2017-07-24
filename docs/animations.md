
# Animations

KFF supports declarative animations of some types of bindings through simple animation API. This API doesn't directly perform any sort of animation itself, but allows you to write custom animation functions and use them inside bindings.

Two types of animations are supprted:

**1. Animating insertion/removing of an element into/from the DOM**

This type of animation can be used together with `:if`, `:ifnot` or `:each` bindings.

**2. Animating class**

This type of animation can be used with `:class` and `:classnot` bindings.

These two types of animations use different approaches – the former have to handle element insertion/removing, while the second one only takes care of adding/removing class and timing.


## Simple element animation

In HTML you simply add a special binding modifier (`:animate`) to the `:if` binder. `fade` is the name of the animation object we will implement later:

```html
<html>
    <body>
        <p>
            <button data-kff-bind="state.showMessage:click(true)">Show message</button>
            <button data-kff-bind="state.showMessage:click(false)">Hide message</button>
        </p>
        <div data-kff-bind="state.showMessage:if:animate(fade)">
            <p>Fade me!</p>
        </div>
    </body>
</html>
```

To implement the animation, you have to add an object into the scope of the view that contains two methods: `insert` and `remove`.

```js
import {View, afterRepaint} from kff

const duration = 300
const fade = {
    insert(parentNode, anchorNode, node)
    {
        node.style.opacity = 0
        node.style.transition = `opacity ${duration/1000}s`
        parentNode.insertBefore(node, anchorNode)
        afterRepaint(() => {
            node.style.opacity = 1
        })
    },

    remove(parentNode, node, callback)
    {
        node.style.transition = `opacity ${duration/1000}s`
        node.style.opacity = 1
        afterRepaint(() => {
            node.style.opacity = 0
            setTimeout(() =>
            {
                parentNode.removeChild(node)
                callback()
            }, duration)
        });
    }
}

const myView = new View({
    scope: {
        state: new Cursor({
            showMessage: false
        }),
        fade: fade
    }
});
myView.initAll();
```

**Notes:**

* The `afterRepaint` is a helper that will call the function after the next repaint cycle (to ensure that the animation will start after the element is actually paint onto the screen)
* The `remove` method must call the callback after the element is removed from the DOM.

The API is intentionally low-level to allow implementing various kinds of animations.

## List items animation

You can use previously defined animation with `:each` binding as well. In this case, every inserted or removed item will be animated.

The use is same as with `:if` binding.

**You must always use the `:key` modifier to provide a unique identifier for each item in the list. Without it, the animations would not work properly.**

```html
<html>
    <body>
        <table>
            <tr data-kff-bind="state.items:each:key(id):animate(fade)">
                <td data-kff-bind=".name:text"></td>
                <td>
                    <button data-kff-bind="state.items:click:dispatch(removeItem, id: @@.id)">
                        Remove item
                    </button>
                </td>
            </tr>
        </table>
        <p>
            <button data-kff-bind="state.items:click:dispatch(addItem)">Add new item</button>
        </p>
    </body>
</html>
```

And the javascript part is just implementation of actions for adding and removing element to/from the list:

```js
import {View, Cursor, afterRepaint} from kff

const state = new Cursor({
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
});

const myView = new View({
    scope: {
        state,
        fade  // See previous example for fade implementation
    },
    actions: {
        addItem: ({cursor}) => ({
            type: 'set',
            cursor,
            value(items) {
                const id = Math.round(Math.random() * 1000000)
                return [...items, { id: 'id' + id, name: 'Composer #' +  id }]
            }
        }),
        removeItem: ({cursor, id}) => ({
            type: 'set',
            cursor,
            value: items => items.filter(item => item.id !== id)
        })
    }
});
myView.initAll();
```

## Class animation

Class based animations work differently from element based animations. Class based animations only add/remove class to the element that already exists in the DOM. They are simpler to implement but they can only be used in conjunction with `:class` or `:classnot` bindings.

The following example shows how to implement class-based animation using the same naming convention as in [ReactCSSTransitionGroup](https://facebook.github.io/react/docs/animation.html) component.

```html
<html>
    <body>
        <style>
            .box {
                padding: 20px;
                max-width: 30em;
                background: #ff8;
                display: none;
                transition: opacity 1000ms;
            }
            .box-enter {
                display: block;
                opacity: 0;
            }
            .box-enter-active {
                opacity: 1;
            }
            .box-leave {
                display: block;
                opacity: 1;
            }
            .box-leave-active {
                opacity: 0;
            }
        </style>
        <p class="box" data-kff-bind="state.showBox:class(box, true):animate(enterLeave)">
            Lorem ipsum Ut laboris enim qui tempor tempor eu ad occaecat fugiat nulla ullamco
            non sit pariatur ea incididunt in in eiusmod sed ex proident enim commodo consequat.
        </p>
        <p>
            <button data-kff-bind="state.showBox:click:dispatch(toggle)">Toggle box</button>
        </p>
    </body>
</html>
```

```js
const {View, Cursor, afterRepaint} = kff;

const duration = 1000
const enterLeave = {
    addClass(element, className)
    {
        if(document.body.hasAttribute('data-kff-rendered'))
        {
            element.classList.remove(className + '-leave');
            element.classList.remove(className + '-leave-active');
            element.classList.add(className + '-enter');

            afterRepaint(() =>
            {
                element.classList.add(className + '-enter-active');
            });
        }
        else
        {
            element.classList.add(className + '-enter');
            element.classList.add(className + '-enter-active');
        }
    },

    removeClass(element, className)
    {
        if(document.body.hasAttribute('data-kff-rendered'))
        {
            element.classList.remove(className + '-enter');
            element.classList.remove(className + '-enter-active');
            element.classList.add(className + '-leave');

            afterRepaint(() =>
            {
                element.classList.add(className + '-leave-active');
                setTimeout(() =>
                {
                    element.classList.remove(className + '-leave');
                    element.classList.remove(className + '-leave-active');
                }, duration);
            });
        }
    }
}

const state = new Cursor({
    showBox: false
});

const myView = new View({
    scope: { state, enterLeave },
    actions: {
        toggle: ({cursor}) => ({
            type: 'set',
            cursor,
            value: val => !val
        })
    }
});
myView.initAll();
```




