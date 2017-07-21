
# Cursor

Cursor is a wrapper of a state. The state can be a plain javascript object, array or primitive value (string, number, boolean) or combination of any of these.
Cursor contains methods to modify the state, but it does not mutate it directly. Instead, it uses immutable structural object cloning to create a new modified state.

Cursor is a class, so the instance is created using the `new` operator.

```js
import {Cursor} from 'kff';

const mainCursor = new Cursor({
	product: {
		name: 'iPhone 6',
		display: {
			width: 750,
			height: 1334
		}
	}
});

// We can get the state using a get method:
var state = mainCursor.get();
console.log(state.product.name)
// 'iPhone 6'

// Or we can get inner part using getIn method:
var name = mainCursor.getIn(['product', 'name']);
console.log(name)
// 'iPhone 6'

// There is also an alternative string based style:
var name = mainCursor.getIn('product.name');
console.log(name)
// 'iPhone 6'

// Change the name using setIn method:
mainCursor.setIn('product.name', 'iPhone 7');
console.log(mainCursor.getIn('product.name'))
// 'iPhone 7'

// The state object is not the same object as before:
console.log(state === mainCursor.get())
// false

// But the display object hasn't change!
console.log(state.product.display === mainCursor.getIn('product.display'))
// true

// You can create a subcursor derived from the mainCursor:
var nameCursor = mainCursor.refine('product.name');

// Now you can change the name using the nameCursor:
nameCursor.set('iPhone 8');

// Note that both cursors are linked to the same state object:
console.log(mainCursor.getIn('product.name'));
// 'iPhone 8'

// We can delete any value from state object using remove method:
nameCursor.remove();
console.log(mainCursor.getIn('product.name'));
// null

// We can combine arrays with objects (note using dot notation even with array index):
mainCursor.setIn('product.accessories', ['power cord', 'headphones', 'case']);
console.log(mainCursor.getIn('product.accessories.1'))
// 'headphones'

// Remove array item:
mainCursor.refine('product.accessories.1').remove();
console.log(mainCursor.getIn('product.accessories.length'))
// 2

// There are currently no array methods but you can use a function in set method to manually modify value
// Note using the concat method to create a new array instead of modifying it
mainCursor.setIn('product.accessories', v => v.concat(['Lightning to USB Cable']));
console.log(mainCursor.getIn('product.accessories.length'))
// 3
```

#### `constructor(root, keyPath?)`

Creates a new cursor instance.

* `root` - object, array, primitive value or another Cursor instance. If the root is a Cursor instance, then the subcursor will be created. Subcursor keeps inner link to the original cursor's state. Preferred method to create a subcursor is using the `refine` method.
* `keyPath` - optional path into the root. Make sense when creating subcursor.


#### `refine(keyPath)`

Returns a new subcursor.

* `keyPath` - path into the state object. Can be string in form 'some.inner.value' or an array in form ['some', 'inner', 'value]


#### `get()`

Returns value of the cursor

#### `getIn(keyPath)`

Returns value from some inner object. It is the same as calling `refine(keyPath).get()`

#### `set(value)`

Sets value of the cursor using structured immutable cloning. Value can also be a function that takes original value as its only argument and returns a new value.


#### `setIn(keyPath, value)`

The same as `refine(keyPath).set(value)`.

#### `remove()`

Removes value the cursor is pointing to. If it is a object property, it will be deleted, if it is an array item, it will be spliced.


