/**
 * KFF Frontend Framework
 * Copyright (c) 2008-2013 Karel Fučík
 * https://github.com/karfcz/kff
 * Released under the MIT license.
 * https://github.com/karfcz/kff/LICENCE
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	/**
	 * @namespace kff KFFnamespace
	 */
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	kff.widgets = {};



/**
 * Extends constructor function (class) from parent constructor using prototype inherinatce
 * @public
 * @param {function} child Child class
 * @param {function} parent Parent class
 */
kff.extend = function(child, parent)
{
	var F = function(){};
	child._super = F.prototype = parent.prototype;
	child.prototype = new F();
	child.prototype.constructor = child;
};

/**
 * Mixins (using a shallow copy) properties from one object to another
 * Function accepts multiple arguments with multiple extending objects
 * When passing true as the last argument, deep copy will be used
 *
 * @param {Object} obj Object to be extended
 * @param {Object} properties Extending object(s)
 * @returns {Object} Extended object (=== obj)
 */
kff.mixins = function(obj, properties)
{
	var i = 1, l = arguments.length, key, props, prop, objProp, deep = false;
	if(l > 2 && arguments[l-1] === true)
	{
		deep = true;
		l--;
	}
	while(i < l)
	{
		props = arguments[i];
		for(key in props)
		{
			if(props.hasOwnProperty(key))
			{
				prop = props[key];
				if(deep && kff.isPlainObject(prop))
				{
					objProp = obj[key];
					if(typeof objProp !== 'object' || objProp === null) objProp = {};
					kff.mixins(objProp, prop, deep);
				}
				else obj[key] = prop;
			}
		}
		i++;
	}
	return obj;
};

/**
 * Factory for creating a class
 * @param {Object} meta Object with metadata describing inheritance and static properties of the class
 * @param {Object} properties Properties of a class prototype (or class members)
 * @returns {function} A constructor function (class)
 */
kff.createClass = function(meta, properties)
{
	var constructor;
	if(arguments.length === 0) meta = properties = {};
	else if(arguments.length === 1)
	{
		properties = meta;
		meta = {};
	}

	// Create a new constructor if not defined in properties
	if(properties.hasOwnProperty('constructor'))
	{
		constructor = properties.constructor;
	}
	else
	{
		if(meta.extend) constructor = function(){ meta.extend.apply(this, arguments); };
		else constructor = function(){};
	}

	// Extend from parent class
	if(meta.extend) kff.extend(constructor, meta.extend);

	// Concatenate properties from properties objects and mixin objects
	if(!('mixins' in meta))
	{
		meta.mixins = [];
	}
	else if(!(meta.mixins instanceof Array)) meta.mixins = [meta.mixins];

	meta.mixins.push(kff.classMixin);

	for(var i = 0, l = meta.mixins.length; i < l; i++) kff.mixins(properties, meta.mixins[i]);

	// Static properties of constructor
	if(meta.staticProperties)
	{
		kff.mixins(constructor, meta.staticProperties);
	}

	// Add properties to prototype
	kff.mixins(constructor.prototype, properties);

	// Set proper constructor
	constructor.prototype.constructor = constructor;

	return constructor;
};

/**
 * Binds function to an object. Adds _boundFns object width references to bound methods for caching purposes.
 * @param {Object} obj Object to which bind a function
 * @param {string} fnName Method name to bind
 */
kff.bindFn = function(obj, fnName, args)
{
	if(typeof obj[fnName] !== 'function') throw new TypeError("Expected function: " + fnName + ' (kff.bindFn)');
	if(!('_boundFns' in obj)) obj._boundFns = {};
	if(fnName in obj._boundFns) return obj._boundFns[fnName];
	else obj._boundFns[fnName] = function()
	{
		if(args) return obj[fnName].apply(obj, args.concat(Array.prototype.slice.call(arguments)));
		else return obj[fnName].apply(obj, arguments);
	};
	return obj._boundFns[fnName];
};

kff.classMixin = {
	f: function(fnName, args)
	{
		var obj = this;
		if(typeof fnName === 'string') return kff.bindFn(obj, fnName, args);
		if(typeof fnName === 'function') return function()
		{
			if(args) return fnName.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
			else return fnName.apply(obj, arguments);
		};
		throw new TypeError("Expected function: " + fnName + ' (kff.f)');
	}
};

/**
 * Evaluates object path recursively and returns last property in chain
 *
 * Example:
 * window.something = { foo: { bar: 42 } };
 * kff.evalObjectPath('something.foo.bar', window) === 42 // true
 *
 * @param {string} path object path (like 'something.foo.bar')
 * @param {Object} obj Object to start with (like window)
 * @returns {mixed} Property at the end of object chain or null if not found
 */
kff.evalObjectPath = function(path, obj)
{
	obj = obj || scope;
	if(typeof path !== 'string') return null;
	var parts = path.split('.');
	while(parts.length)
	{
		if(!(parts[0] in obj)) return null;
		obj = obj[parts.shift()];
	}
	return obj;
};

/**
 * Detects if an object is a POJO (object created as literal or usin new Object)
 * @param  {mixed}  obj Object to detect
 * @return {Boolean} True if object is POJO, false otherwise
 */
kff.isPlainObject = function(obj)
{
	return obj !== null && typeof obj === 'object' && obj.constructor === Object;
};


/**
 * Calls a function in the next process cycle with minimal timeout.
 * @param  {function}  fn Callback function
 */
kff.setZeroTimeout = function(fn)
{
	var callbacks = [], messageName = 'kff-zerotimeoutmsg';

	var handleMessage = function(event)
	{
		if(event.source === window && event.data === messageName)
		{
			event.stopPropagation();
			if(callbacks.length > 0) callbacks.shift()();
		}
	};

	if('postMessage' in window && 'addEventListener' in window && !('attachEvent' in window))
	{
		kff.setZeroTimeout = function(fn)
		{
			callbacks.push(fn);
			window.postMessage(messageName, '*');
		};
		window.addEventListener('message', handleMessage, true);
	}
	else
	{
		kff.setZeroTimeout = function(fn)
		{
			setTimeout(fn, 0);
		};
	}

	kff.setZeroTimeout(fn);
};



kff.Events = kff.createClass(
/** @lends kff.Events.prototype */
{
	/**
		@constructs
	*/
	constructor: function()
	{
		this.subscribers = {};
		this.oneSubscribers = {};
	},

	/**
		Binds event handler.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	on: function(eventType, fn)
	{
		this.off(eventType, fn);
		if(eventType instanceof Array)
		{
			for(var i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i])
				{
					if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = new kff.List();
					this.subscribers[eventType[i]].append(fn);
				}
			}
		}
		else
		{
			if(!this.subscribers[eventType]) this.subscribers[eventType] = new kff.List();
			this.subscribers[eventType].append(fn);
		}
	},

	/**
		Binds event handler that will be executed only once.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	one: function(eventType, fn)
	{
		if(!(eventType in this.oneSubscribers)) this.oneSubscribers[eventType] = [];
		this.oneSubscribers[eventType].push(fn);
		this.on(eventType, fn);
	},

	/**
		Unbinds event handler.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	off: function(eventType, fn)
	{
		var i, l;
		if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.off(eventType[i], fn);
			}
		}
		else
		{
			if(this.subscribers[eventType] instanceof kff.List) this.subscribers[eventType].remove(fn);
		}
	},

	/**
		Triggers an event.

		@param {string|Array} eventType Event name(s)
		@param {mixed} eventData Arbitrary data that will be passed to the event handlers as an argument
	*/
	trigger: function(eventType, eventData)
	{
		var i, l;
		if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.trigger(eventType[i], eventData);
			}
		}
		else
		{
			if(this.subscribers[eventType] instanceof kff.List)
			{
				this.subscribers[eventType].each(function(val)
				{
					if(typeof val === 'function') val.call(null, eventData);
				});

				// Remove "one" subscribers:
				if(eventType in this.oneSubscribers)
				{
					for(i = 0, l = this.oneSubscribers[eventType].length; i < l; i++)
					{
						this.off(eventType, this.oneSubscribers[eventType][i]);
					}
					this.oneSubscribers[eventType] = [];
				}
			}
		}
	}
});

kff.EventsMixin =
{
	initEvents: function()
	{
		this.events = new kff.Events();
	},
	on: function(eventType, fn){ return this.events.on(eventType, fn); },
	one: function(eventType, fn){ return this.events.one(eventType, fn); },
	off: function(eventType, fn){ return this.events.off(eventType, fn); },
	trigger: function(eventType, eventData){ return this.events.trigger(eventType, eventData); }
};


kff.List = kff.createClass(
/** @lends kff.List.prototype */
{
	/**
		Class representing a list data structure
		@constructs
	 */
	constructor: function()
	{
		this.array = [];
	},

	/**
	 * Returns number of items in the list
	 *
	 * @return {number} Number of items (length of the list)
	 */
	count: function()
	{
		return this.array.length;
	},

	/**
		Iterates over each item in the list
		@param {function} fn A callback function to be called on each item. Takes two arguments - the iterated item and its index
	 */
	each: function(fn)
	{
		var a = this.array, l = a.length, i = 0;
		for(; i < l; i++)
		{
			if(fn.call(null, a[i], i) === false) break;
		}
	},

	/**
		Appends an item at the end of the list
		@param {mixed} item Item to be appended
	 */
	append: function(item)
	{
		this.array.push(item);
	},

	/**
		Inserts an item at specified index
		@param {mixed} item Item to be inserted
	 */
	insert: function(item, index)
	{
		this.array.splice(index, 0, item);
	},

	/**
		Removes item from the list
		@param {mixed} item Reference to the item to be removed
		@returns {Boolean} True if item was removed or false if not found
	 */
	remove: function(item)
	{
		var i = this.indexOf(item);
		if(i === -1) return false;
		this.array.splice(i, 1);
		return true;
	},

	/**
		Removes all items from the list
	 */
	empty: function()
	{
		this.array = [];
	},

	/**
		Splice list
	 */
	splice: function()
	{
		Array.prototype.splice.apply(this.array, arguments);
	},

	/**
		Returns an index of given item

		@param {mixed} item Value to be found
		@returns {number} index of the item or -1 if not found
	 */
	indexOf: function(item)
	{
		if(Array.prototype.indexOf)
		{
			kff.List.prototype.indexOf = function(item)
			{
				return this.array.indexOf(item);
			}
		}
		else
		{
			kff.List.prototype.indexOf = function(item)
			{
				var i = 0, a = this.array, l = a.length;
				for(; i < l; i++) if(a[i] === item) return i;
				return -1;
			}
		}
		return this.indexOf(item);
	},

	/**
		Sets an item at given position

		@param {number} index Index of item
		@param {mixed} item Item to set
	 */
	set: function(index, item)
	{
		if(this.array[index] !== undefined)	this.array[index] = item;
		else throw new RangeError('Bad index in kff.List.set');
	},

	/**
		Returns an item at given position

		@param {number} index Index of item
		@returns {mixed} Item at given position (or undefined if not found)
	 */
	get: function(index)
	{
		return this.array[index];
	},

	/**
		Sorts list using a compare function. The compare function follows the same specification
		as the standard Array.sort function

		@param {function} compareFunction Compare function
	 */
	sort: function(compareFunction)
	{
		this.array.sort(compareFunction);
	},

	/**
		Randomizes items in the list.
	 */
	shuffle: function()
	{
		var arr = this.array,
			len = arr.length,
			i = len,
			p, t;

		while(i--)
		{
			p = parseInt(Math.random()*len, 10);
			t = arr[i];
			arr[i] = arr[p];
			arr[p] = t;
		}
	}

});

// Backward-compatible alias:
kff.List.prototype.findByIndex = kff.List.prototype.get;


kff.Collection = kff.createClass(
{
	extend: kff.List,
	mixins: kff.EventsMixin
},
/** @lends kff.Collection.prototype	*/
{
	/**
		Class representing a collection of models.

		@constructs
		@augments kff.List
		@param {Object} options Options object
		@param {function} options.itemFactory Factory function for creating new collection items (optional)
		@param {function} options.itemType Type (class or constructor function) of collection items
	 */
	constructor: function(options)
	{
		options = options || {};
		this.itemFactory = options.itemFactory || null;
		this.itemType = options.itemType || kff.Model;
		this.serializeAttrs = options.serializeAttrs || null;
		this.onEachEvents = [];
		this.initEvents();
		kff.List.call(this);
		return this;
	},

	/**
	 * Appends the item at the end of the collection
	 *
	 * Triggers a change event with folloving event object:
	 *
	 *  { type: 'append', item: item }
	 *
	 * @param {mixed} item Item to be appended
	 * @param {Boolean} silent If true, do not trigger event
	 */
	append: function(item, silent)
	{
		kff.Collection._super.append.call(this, item);
		if(!silent) this.trigger('change', { type: 'append', item: item });
	},

	/**
	 * Inserts an item at specified index
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'insert', item: item, index: index }
	 *
	 * @param {mixed} item Item to be inserted
	 * @param {Boolean} silent If true, do not trigger event
	 */
	insert: function(item, index, silent)
	{
		kff.Collection._super.insert.call(this, item, index);
		if(!silent) this.trigger('change', { type: 'insert', item: item, index: index });
	},

	/**
	 * Sets an item at given position
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'set', item: item, index: index }
	 *
	 * @param {number} index Index of item
	 * @param {mixed} item Item to set
	 */
	set: function(index, item, silent)
	{
		kff.Collection._super.set.call(this, item, index);
		if(!silent) this.trigger('change', { type: 'set', item: item, index: index });
	},

	/**
	 * Removes the item from the collection
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'remove', item: item }
	 *
	 * @param {mixed} item Reference to the item to be removed
	 * @param {Boolean} silent If true, do not trigger event
	 * @returns {mixed} Removed item or false if not found
	 *
	 */
	remove: function(item, silent)
	{
		var ret = kff.Collection._super.remove.call(this, item);
		if(ret && !silent) this.trigger('change', { type: 'remove', item: item });
		return ret;
	},

	/**
	 * Returns the value of given attribute using deep lookup (object.attribute.some.value)
	 *
	 * @param {string} attrPath Attribute path
	 * @returns {mixed} Attribute value
	 * @example
	 * obj.mget('one.two.three');
	 * // equals to:
	 * obj.get('one').get('two').get('three');
	 */
	mget: function(attrPath)
	{
		var attr;
		if(typeof attrPath === 'string') attrPath = attrPath.split('.');
		attr = this.get(attrPath.shift());
		if(attrPath.length > 0)
		{
			if(attr instanceof kff.Model || attr instanceof kff.Collection) return attr.mget(attrPath);
			else return kff.evalObjectPath(attrPath, attr);
		}
		else return attr;
	},

	/**
	 * Creates a JSON representation of collection (= array object).
	 *
	 * If item of collection is object, tries to call toJson on it recursively.
	 * This function returns a plain object, not a stringified JSON.
	 *
	 * @returns {Array} Array representation of collection
	 */
	toJson: function()
	{
		var serializeAttrs = this.serializeAttrs, obj = [];
		this.each(function(item)
		{
			if(item && item.toJson) obj.push(item.toJson(serializeAttrs));
			else obj.push(item);
		});
		return obj;
	},

	/**
	 * Reads collection from JSON representation (= from JavaScript array)
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'fromJson' }
	 *
	 * @param {Array} obj Array to read from
	 * @param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(obj, silent)
	{
		var item, itemFactory = this.itemFactory;
		this.empty();
		for(var i = 0; i < obj.length; i++)
		{
			if(itemFactory) item = itemFactory(obj[i]);
			else item = new this.itemType();
			item.fromJson(obj[i], silent);
			this.append(item, true);
		}
		if(!silent) this.trigger('change', { type: 'fromJson' });
	},

	/**
	 * Finds an item with given attribute value
	 *
	 * @param {string} attr Attribute name
	 * @param {mixed} value Attribute value
	 * @returns {mixed} First found item or null
	 */
	findByAttr: function(attr, value)
	{
		var ret = null;
		this.each(function(val)
		{
			if(val && val.get(attr) === value)
			{
				ret = val;
				return false;
			}
		});
		return ret;
	},

	/**
	 * Removes all items from collection
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'empty' }
	 *
	 * @param {Boolean} silent If true, do not trigger event
	 */
	empty: function(silent)
	{
		kff.Collection._super.empty.call(this);
		if(!silent) this.trigger('change', { type: 'empty' });
	},

	/**
	 * Sorts collection using a compare function. The compare function follows the same specification
	 * as the standard Array.sort function
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'sort' }
	 *
	 * @param {function} compareFunction Compare function
	 * @param {Boolean} silent If true, do not trigger event
	 */
	sort: function(compareFunction, silent)
	{
		kff.Collection._super.sort.call(this, compareFunction);
		if(!silent) this.trigger('change', { type: 'sort' });
	},

	/**
	 * Creates a clone (shallow copy) of the collection.
	 *
	 * @returns {kff.Collection} Cloned collection
	 */
	clone: function()
	{
		var clon = new kff.Collection(this.options);
		this.each(function(item){
			clon.append(item);
		});
		return clon;
	},

	/**
	 * Randomizes items in the collection.
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'shuffle' }
	 *
	 * @param {Boolean} silent If true, do not trigger event
	 */
	shuffle: function(silent)
	{
		kff.Collection._super.shuffle.call(this);
		if(!silent) this.trigger('change', { type: 'shuffle' });
	},

	splice: function()
	{
		kff.Collection._super.splice.apply(this, arguments);
		this.trigger('change', { type: 'splice' });
	},

	onEach: function(eventType, fn)
	{
		this.onEachEvents.push({ eventType: eventType, fn: fn });
		this.each(function(item, i){
			item.on(eventType, fn);
		});
		this.on('change', this.f('refreshOnEach'));
	},

	offEach: function(eventType, fn)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			if(this.onEachEvents[i].eventType === eventType && this.onEachEvents[i].fn === fn) this.onEachEvents.splice(i, 1);
		}
		this.each(function(item, i){
			item.off(eventType, fn);
		});
		this.off('change', this.f('refreshOnEach'));
	},

	refreshOnEach: function(event)
	{
		switch(event ? event.type : null)
		{
			case 'append':
			case 'insert':
				this.bindOnOne(event.item);
				break;
			case 'remove':
				this.unbindOnOne(event.item);
				break;
			default:
				this.rebindEach();
		}
	},

	bindOnOne: function(item)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			item.on(this.onEachEvents[i].eventType, this.onEachEvents[i].fn);
		}
	},

	unbindOnOne: function(item)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			item.off(this.onEachEvents[i].eventType, this.onEachEvents[i].fn);
		}
	},

	rebindEach: function()
	{
		var that = this;
		this.each(function(item, i)
		{
			for(var j = 0, l = that.onEachEvents.length; j < l; j++)
			{
				item.on(that.onEachEvents[j].eventType, that.onEachEvents[j].fn);
			}
		});
	}

});


kff.Model = kff.createClass(
{
	mixins: kff.EventsMixin
},
/** @lends kff.Model.prototype */
{
	/**
		Base class for models
		@constructs
	 */
	constructor: function(attrs)
	{
		this.initEvents();

		/**
			Attributes of model
			@private
		*/
		this.attrs = this.attrs || {};

		if(attrs) this.set(attrs);
	},

	/**
		Checks if the model has given attribute

		@public
		@param {string} attr Attribute name
		@returns {boolean} True if found, false otherwise
	 */
	has: function(attr)
	{
		return attr in this.attrs;
	},

	/**
		Returns the value of given attribute

		@param {string} attr Attribute name
		@returns {mixed} Attribute value
	 */
	get: function(attr)
	{
		return this.attrs[attr];
	},

	/**
		Returns the value of given attribute using deep lookup (object.attribute.some.value)

		@param {string} attrPath Attribute path
		@returns {mixed} Attribute value
	 	@example
	 	obj.mget('one.two.three');
	 	// equals to:
	 	obj.get('one').get('two').get('three');
	 */
	mget: function(attrPath)
	{
		var attr;
		if(typeof attrPath === 'string') attrPath = attrPath.split('.');
		attr = this.get(attrPath.shift());
		if(attrPath.length > 0)
		{
			if(attr instanceof kff.Model || attr instanceof kff.Collection) return attr.mget(attrPath);
			else return kff.evalObjectPath(attrPath, attr);
		}
		else return attr;
	},

	/**
		Sets the value(s) of given attribute(s). Triggers change event.

		@param {string} attr Attribute name
		@param {mixed} value Attribute value
		@param {Boolean} silent If true, do not trigger event
	 */
	set: function(attr, value, silent)
	{
		var changed = {};

		if(typeof attr === 'string')
		{
			if(this.get(attr) === value) return;
			changed[attr] = value;
			this.attrs[attr] = value;
		}
		else if(attr !== null && attr instanceof Object)
		{
			silent = value;
			changed = attr;
			for(var key in changed) this.attrs[key] = changed[key];
		}

		if(!silent)
		{
			for(var changedAttr in changed)
			{
				this.trigger('change:' + changedAttr, { model: this, changed: changed, changedAttributes: changed });
			}
			this.trigger('change', { model: this, changed: changed, changedAttributes: changed });
		}
	},

	/**
		Exports a JSON representation of model attributes. If an attribute is type of Object, tries to call a toJson
		method recursively.	This function returns a plain javascript object, not the stringified JSON.

		@param {Array.<string>} serializeAttrs Array of attribute names to be exported or all if omitted.
		@returns {Object} Plain JavaScript object representation of object's attributes
	 */
	toJson: function(serializeAttrs)
	{
		var obj = {};
		for(var key in this.attrs)
		{
			if((!serializeAttrs || $.inArray(key, serializeAttrs) !== -1) && this.attrs.hasOwnProperty(key))
			{
				if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'toJson' in this.attrs[key]) obj[key] = this.attrs[key].toJson();
				else obj[key] = this.attrs[key];
			}
		}
		return obj;
	},

	/**
		Imports model's attributes from JSON (plain JavaScript object).

		If an attribute is type of Object, tries to read appropriate property using its fromJson method.
		This function returns plain object, not stringified JSON.

		@param {Object} obj Plain JS object to read attributes from
		@param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(obj, silent)
	{
		if(!obj) return;
		var attrs = {};
		for(var key in this.attrs)
		{
			if(this.attrs.hasOwnProperty(key) && obj.hasOwnProperty(key))
			{
				if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'fromJson' in this.attrs[key]) this.attrs[key].fromJson(obj[key]);
				else this.attrs[key] = obj[key];
			}
		}
		this.set(this.attrs, silent);
	}

});


kff.ServiceContainer = kff.createClass(
{
	staticProperties:
	{
		CONFIG_CONSTRUCTOR: 'construct',
		singleParamRegex: /^%[^%]+%$/g,
		multipleParamsRegex: /%([^%]+)%/g
	}
},
/** @lends kff.ServiceContainer.prototype */
{
	/**
	 * Simple dependency injection (or service) container class.
	 * @constructs
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		this.config = config || { parameters: {}, services: {} };
		this.services = {};
		this.cachedParams = {};
	},

	/**
	 * Returns instance of service class.
	 * @param {string} service Service name (service config to be found in config.services[service])
	 * @param {Array} argsExtend Array to overload default arguments array (optional)
	 * @returns {Object} Instance of service
	 */
	getService: function(service, argsExtend)
	{
		var serviceConfig;
		if(!this.config.services[service])
		{
			serviceConfig = this.getServiceConfigAnnotation(service);
			if(serviceConfig) this.config.services[service] = serviceConfig;
			else throw new Error('Service ' + service + ' not defined');
		}
		if(this.config.services[service].shared)
		{
			if(typeof this.services[service] === 'undefined') this.services[service] = this.createService(service, argsExtend);
			return this.services[service];
		}
		return this.createService(service, argsExtend);
	},

	/**
	 * Checks if given serviceName exists in container declaration
	 * @param {string} serviceName Service name
	 * @returns {boolean} True if service exists, false otherwise
	 */
	hasService: function(serviceName)
	{
		if(this.config.services.hasOwnProperty(serviceName)) return true;
		else {
			var serviceConfig = this.getServiceConfigAnnotation(serviceName);
			if(serviceConfig)
			{
				this.config.services[serviceName] = serviceConfig;
				return true;
			}
		}
		return false;
	},

	/**
	 * Creates instance of service.
	 *
	 * If second argument is passed, then it will be used to overload constructor arguments.
	 * If items at the same index are both objects, then the second one will bee deep-mixed into
	 * the first one resulting in a new object (i.e. the config args won't be overwritten).
	 *
	 * @param {string} serviceName Name of service to be instantiated
	 * @param {Array} argsExtend Array to overload default arguments array (optional)
	 * @returns {Object} Instance of service
	 */
	createService: function(serviceName, argsExtend)
	{
		var serviceConfig, Ctor, Temp, service, ret, i, l, args, argsExtended, calls;

		serviceConfig = this.config.services[serviceName];

		Ctor = this.getServiceConstructor(serviceName);
		Temp = function(){};
		Temp.prototype = Ctor.prototype;
		service = new Temp();

		args = this.resolveParameters(serviceConfig.args || []);
		if(argsExtend && argsExtend instanceof Array)
		{
			argsExtended = [];
			for(i = 0, l = argsExtend.length; i < l; i++)
			{
				if(argsExtend[i] !== undefined)
				{
					if(kff.isPlainObject(args[i]) && kff.isPlainObject(argsExtend[i])) argsExtended[i] = kff.mixins({}, args[i], argsExtend[i]);
					else argsExtended[i] = argsExtend[i];
				}
				else argsExtended[i] = args[i];
			}
			args = argsExtended;
		}

		ret = Ctor.apply(service, args);
		if(Object(ret) === ret) service = ret;

		calls = serviceConfig.calls;
		if(calls instanceof Array)
		{
			for(i = 0, l = calls.length; i < l; i++)
			{
				service[calls[i].method].apply(service, this.resolveParameters(calls[i].args));
			}
		}
		return service;
	},

	/**
	 * Returns constructor function for given service name.
	 * @param {string} serviceName Service name
	 * @returns {function} Constructor function for service
	 */
	getServiceConstructor: function(serviceName)
	{
		var serviceConfig, ctor, construct = kff.ServiceContainer.CONFIG_CONSTRUCTOR;
		serviceConfig = this.config.services[serviceName];
		if(!serviceConfig)
		{
			serviceConfig = this.getServiceConfigAnnotation(serviceName);
			if(!serviceConfig) return null;
			else this.config.services[serviceName] = serviceConfig;
		}
		if(!serviceConfig.hasOwnProperty('construct'))
		{
			ctor = kff.evalObjectPath(serviceName);
			if(typeof ctor === 'function') serviceConfig[construct] = ctor;
		}
		else if(typeof serviceConfig[construct] === 'string') serviceConfig[construct] = kff.evalObjectPath(serviceConfig[construct]);
		if(typeof serviceConfig[construct] !== 'function') throw new Error('Cannot create service "' + serviceName + '" in kff.getServiceConstructor. Expected constructor function, got: ' + serviceConfig[construct]);
		return serviceConfig[construct];
	},

	getServiceConfigAnnotation: function(serviceName)
	{
		var serviceConfig = {};
		var ctor = kff.evalObjectPath(serviceName);
		if(typeof ctor === 'function')
		{
			if('service' in ctor && kff.isPlainObject(ctor.service)) serviceConfig = ctor.service;
			if(!('construct' in serviceConfig))	serviceConfig.construct = ctor;
			return serviceConfig;
		}
		return null;
	},

	/**
	 * Evaluates parameter defined in container configuration.
	 *
	 * Parameter could be:
	 *
	 * - a string - see below
	 * - an Array or Object - iterates over properties and evaluates them recursively
	 *
	 * String parameters refers to parameters defined in config.parameters section
	 * If parameter is a string, it could have these special chars:
	 * '@serviceName' - resolves to instance of service
	 * '%parameterName%' - resolves to reference to parameter parameterName
	 * '%someParameter% some %otherParameter% some more string' - resolves to string with 'inner parameters' resolved to strings as well
	 *
	 * @param {string|Array|Object} params Parameters to be resolved
	 * @returns {mixed} Resolved parameter value
	 */
	resolveParameters: function(params)
	{
		var ret, i, l, config;

		config = this.config;

		if(typeof params === 'string')
		{
			if(params.charAt(0) === '@')
			{
				params = params.slice(1);
				if(params.length === 0) ret = this;
				else ret = this.getService(params);
			}
			else if(this.cachedParams[params] !== undefined) ret = this.cachedParams[params];
			else
			{
				if(params.search(kff.ServiceContainer.singleParamRegex) !== -1)
				{
					ret = config.parameters[params.slice(1, -1)];
				}
				else
				{
					ret = params.replace('%%', 'escpersign');
					ret = ret.replace(kff.ServiceContainer.multipleParamsRegex, function(match, p1)
					{
						if(config.parameters[p1]) return config.parameters[p1];
						else return '';
					});
					ret = ret.replace('escpersign', '%');
				}
				this.cachedParams[params] = ret;
			}
		}
		else if(params instanceof Array)
		{
			ret = [];
			for(i = 0, l = params.length; i < l; i++)
			{
				ret[i] = this.resolveParameters(params[i]);
			}
		}
		else if(kff.isPlainObject(params))
		{
			ret = {};
			for(i in params)
			{
				if(params.hasOwnProperty(i)) ret[i] = this.resolveParameters(params[i]);
			}
		}
		else
		{
			ret = params;
		}
		return ret;
	},

	/**
	 * Registers a new service configuration
	 *
	 * @param  {Object} services Services configuration object
	 * @param  {Boolean} overwrite If service already exists, overwrite it with new config
	 */
	registerServices: function(services, overwrite)
	{
		var service;
		for(service in services)
		{
			if(!this.config.services.hasOwnProperty(service) || overwrite)
			{
				this.config.services[service] = services[service];
				this.services[service] = undefined;
			}
		}
	},

	/**
	 * Registers a new parameters configuration
	 *
	 * @param  {Object} parameters Parameters configuration object
	 * @param  {Boolean} overwrite If parameter already exists, overwrite it with new config
	 */
	registerParameters: function(parameters, overwrite)
	{
		var parameter;
		for(parameter in parameters)
		{
			if(!this.config.parameters.hasOwnProperty(parameter) || overwrite)
			{
				this.config.parameters[parameter] = parameters[parameter];
			}
		}
	}
});


kff.View = kff.createClass(
{
	mixins: kff.EventsMixin,

	staticProperties:
	/** @lends kff.View */
	{
		/**
		 * Data-attribute name used for view names
		 * @constant
		 */
		DATA_VIEW_ATTR: 'data-kff-view',

		/**
		 * Data-attribute name used for view options (as JSON serialized object)
		 * @constant
		 */
		DATA_OPTIONS_ATTR: 'data-kff-options',

		/**
		 * Data-attribute name used for marking of rendered views
		 * @constant
		 */
		DATA_RENDERED_ATTR: 'data-kff-rendered',

		/**
		 * Data-attribute name used for data-binding
		 * @constant
		 */
		DATA_BIND_ATTR: 'data-kff-bind',

		/**
		 * Data-attribute name used for action-binding
		 * @constant
		 */
		DATA_TRIGGER_ATTR: 'data-kff-trigger'
	}
},
/** @lends kff.View.prototype */
{
	/**
	 * Base class for views
	 *
	 * @constructs
	 * @param {Object} options Options object
	 * @param {DOM Element|jQuery} options.element A DOM element that will be a root element of the view
	 * @param {Array} options.models Array of model instances to be used by the view
	 */
	constructor: function(options)
	{
		var F;
		options = options || {};
		this.options = {
			element: null,
			models: null,
			events: []
		};

		this.initEvents();

		if(options.parentView)
		{
			this.parentView = options.parentView;
			F = function(){};
			F.prototype = this.parentView.models;
			this.models = new F();
		}
		else this.models = {};

		if(options.events)
		{
			this.options.events = this.options.events.concat(options.events);
		}
		if(options.element)
		{
			this.$element = $(options.element);
		}
		if(options.viewFactory)
		{
			this.viewFactory = options.viewFactory;
		}
		if(options.models)
		{
			kff.mixins(this.models, options.models);
		}
		kff.mixins(this.options, options);

		this.viewFactory = options.viewFactory || new kff.ViewFactory();
		this.subViews = [];
		return this;
	},

	/**
	 * Returns a model object bound to the view or to the parent view.
	 *
	 * Accepts the model name as a string or key path in the form of "modelName.attribute.nextAttribute etc.".
	 * Will search for "modelName" in current view, then in parent view etc. When found, returns a value of
	 * "attribute.nextAtrribute" using model's	mget method.
	 *
	 * @param {string} modelPath Key path of model in the form of "modelName.attribute.nextAttribute etc.".
	 * @return {mixed} A model instance or attribute value or null if not found.
	 */
	getModel: function(modelPath)
	{
		var modelName;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');
		else modelPath = [].concat(modelPath);

		modelName = modelPath.shift();

		if(this.models && modelName in this.models)
		{
			if(modelPath.length > 0)
			{
				if(this.models[modelName] instanceof kff.Model) return this.models[modelName].mget(modelPath);
				else return null;
			}
			else return this.models[modelName];
		}
		return null;
	},

	/**
	 * Binds DOM events to the view element. Accepts array of arrays in the form:
	 *
	 * [
	 *     ['mousedown, mouseup', '.title', 'edit'],
	 *     ['click',  '.button', 'save' ],
	 *     ['click', function(e) { ... }]
	 * ]
	 *
	 * The first item is name of DOM event (or comma separated event names).
	 * The second item is a CSS experession (jquery expression) relative to the view element for event delegation (optional)
	 * The third item is the view method name (string) that acts as an event handler
	 *
	 * @param {Array} events Array of arrays of binding config
	 * @param {jQuery} $element A jQuery object that holds the DOM element to bind. If not provided, the view element will be used.
	 */
	delegateEvents: function(events, $element)
	{
		var event, i, l;
		this.undelegateEvents();
		events = events || this.options.events;
		$element = $element || this.$element;
		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length === 3)
			{
				if(typeof event[1] === 'string') $element.on(event[0], event[1], this.f(event[2]));
				else event[1].on(event[0], this.f(event[2]));
			}
			else if(event.length === 2) $element.on(event[0], this.f(event[1]));
		}
	},

	/**
	 * Unbinds DOM events from the view element. Accepts array of arrays as in the delegateEvents method.
	 *
	 * @param {Array} events Array of arrays of binding config
	 * @param {jQuery} $element A jQuery object that holds the DOM element to unbind. If not provided, the view element will be used.
	 */
	undelegateEvents: function(events, $element)
	{
		var event, i, l;
		events = events || this.options.events;
		$element = $element || this.$element;
		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length === 3)
			{
				if(typeof event[1] === 'string') $element.off(event[0], event[1], this.f(event[2]));
				else event[1].off(event[0], this.f(event[2]));
			}
			else if(event.length === 2) $element.off(event[0], this.f(event[1]));
		}
	},

	/**
	 * Adds events config to the internal events array.
	 *
	 * @private
	 * @param {Array} events Array of arrays of binding config
	 */
	addEvents: function(events)
	{
		this.options.events = this.options.events.concat(events);
		console.log('this.options.events', this.options.events);
	},

	/**
	 * Initializes the view. Calls the render method. Should not be overloaded by subclasses.
	 *
	 * @private
	 * @param
	 */
	init: function()
	{
		this.startRender();
	},

	/**
	 * Renders the view. It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'render' event won't be called
	 */
	render: function(){},

	/**
	 * Renders the view. It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'render' event won't be called
	 */
	startRender: function(silent)
	{
		var ret = this.render();
		this.$element.attr(kff.View.DATA_RENDERED_ATTR, true);
		this.renderSubviews();
		this.processTriggerEvents();
		this.delegateEvents();
		if(typeof this.afterRender === 'function') this.afterRender();

		if(!((silent === true) || (ret === false)))
		{
			this.trigger('render');
		}
	},

	/**
	 * Renders subviews. Will find all DOM descendats with kff.View.DATA_KFF_VIEW (or kff.View.DATA_BIND_ATTR) attribute
	 * and initializes subviews on them. If an element has the kff.View.DATA_BIND_ATTR but not the kff.View.DATA_KFF_VIEW
	 * attribute, adds kff.View.DATA_KFF_VIEW attribute = "kff.BindingView" and inits implicit data-binding.
	 */
	renderSubviews: function()
	{
		var viewNames = [],
			viewName, viewClass, subView, options, opt, i, l, rendered,
			filter = this.options.filter || undefined,
			element = this.$element.get(0);

		if(element) this.findViewElements(element, viewNames, filter);

		// Render subviews
		for(i = 0, l = viewNames.length; i < l; i++)
		{
			viewName = viewNames[i].objPath;
			opt = viewNames[i].$element.attr(kff.View.DATA_OPTIONS_ATTR);
			options = opt ? JSON.parse(opt) : {};
			options.element = viewNames[i].$element;
			options.parentView = this;
			subView = this.viewFactory.createView(viewName, options);
			if(subView instanceof kff.View)
			{
				subView.viewFactory = this.viewFactory;
				this.subViews.push(subView);
				subView.init();
			}
		}
	},

	/**
	 * Finds possible subview elements inside an element
	 * @param  {DOM Element} el Root element from which search starts
	 * @param  {Array} viewNames Array that will be filled by found elements
	 *                           (items will be objects { objPath: viewName, $element: jQuery wrapper })
	 * @param  {string} filter  A jQuery selector for filtering elements (optional)
	 */
	findViewElements: function(el, viewNames, filter)
	{
		var i, l, children, child, viewName, rendered, onAttr;
		if(el.hasChildNodes())
		{
			children = el.childNodes;
			for(i = 0, l = children.length; i < l; i++)
			{
				child = children[i];
				if(child.nodeType === 1)
				{
					rendered = child.getAttribute(kff.View.DATA_RENDERED_ATTR);
					if(!rendered)
					{
						viewName = child.getAttribute(kff.View.DATA_VIEW_ATTR);
						if(!viewName && child.getAttribute(kff.View.DATA_BIND_ATTR))
						{
							viewName = 'kff.BindingView';
							child.setAttribute(kff.View.DATA_VIEW_ATTR, viewName);
						}
						if(viewName)
						{
							if(!filter || (filter && $(child).is(filter)))
							{
								viewNames.push({ objPath: viewName, $element: $(child) });
							}
						}
						else
						{
							onAttr = child.getAttribute(kff.View.DATA_TRIGGER_ATTR);
							if(onAttr)
							{
								this.processChildTriggerEvents(child, onAttr);
							}
							this.findViewElements(child, viewNames, filter);
						}
					}
				}
			}
		}
	},

	/**
	 * Process declarative events bound throught data-kff-trigger attribute on root view element
	 */
	processTriggerEvents: function()
	{
		this.processChildTriggerEvents(this.$element.get(0));
	},

	/**
	 * Process declarative events bound throught data-kff-trigger attribute on child element
	 * @private
	 * @param  {DOM Element} child  DOM Element
	 */
	processChildTriggerEvents: function(child, onAttr)
	{
		var onAttrSplit, onAttrSplit2, events = [], i, l;
		onAttr = onAttr || child.getAttribute(kff.View.DATA_TRIGGER_ATTR);
		if(onAttr)
		{
			onAttrSplit = onAttr.split(/\s+/);
			for(i = 0, l = onAttrSplit.length; i < l; i++)
			{
				onAttrSplit2 = onAttrSplit[i].split(':');
				events.push([
					onAttrSplit2[0].replace('|', ' '),
					$(child),
					this.f('callTriggerMethod', [onAttrSplit2[1]])
				]);
			}
			this.addEvents(events);
		}
	},

	callTriggerMethod: function(fn)
	{
		if(typeof this[fn] === 'function') this[fn].apply(this, Array.prototype.slice.call(arguments, 1));
		else if(this.parentView) this.parentView.callTriggerMethod.apply(this.parentView, arguments);
	},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroy: function(){},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	startDestroy: function(silent)
	{
		var ret;
		this.$element.removeAttr(kff.View.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.destroySubviews();

		ret = this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();


		if(!((silent === true) || (ret === false)))
		{
			this.trigger('destroy');
		}
	},

	/**
	 * Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
	destroySubviews: function()
	{
		var subView, i, l;

		// Destroy subviews
		for(i = 0, l = this.subViews.length; i < l; i++)
		{
			subView = this.subViews[i];
			subView.startDestroy();
		}
		this.subViews = [];
	},

	/**
	 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: function(){},

	refreshBinders: function(event)
	{
		for(var i = 0, l = this.subViews.length; i < l; i++) this.subViews[i].refreshBinders(event);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function(modelName)
	{
		if(this.parentView instanceof kff.View) return this.parentView.getBindingIndex(modelName);
		return null;
	}
});


kff.PageView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	{
		precedingView: null
	}
},
/** @lends kff.PageView.prototype */
{
	/**
		Class for the full page view. PageViews behave as normal views but can be used by FrontController as
		targets for routing.

		@constructs
		@augments kff.View
		@param {Object} options Options object (see kff.View for details)
	*/
	constructor: function(options)
	{
		options = options || {};
		options.element = $('body');
		return kff.View.call(this, options);
	},

	/**
		@see kff.View#delegateEvents
	*/
	delegateEvents: function(events, $element)
	{
		kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
	},

	/**
		@see kff.View#undelegateEvents
	*/
	undelegateEvents: function(events, $element)
	{
		kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
	},

	/**
		Sets a new state of the view. Called by the front controller.

		@param {Object} state The state object (POJO)
	*/
	setState: function(state, silent)
	{
		if(!silent) this.trigger('setState', state);
	}
});


kff.BinderMap = kff.createClass(
{
	constructor: function()
	{
		this.binders = [];
	},

	add: function(binder)
	{
		this.binders.push(binder);
	},

	clone: function(options)
	{
		var clonedBinderMap = new kff.BinderMap(),
			clonedBinders = clonedBinderMap.binders,
			i, l;

		for(i = 0, l = this.binders.length; i < l; i++)
		{
			clonedBinders[i] = this.binders[i].clone();
		}
		return clonedBinderMap;
	},

	setView: function(view)
	{
		var i, l;
		for(i = 0, l = this.binders.length; i < l; i++)
		{
			this.binders[i].view = view;
			this.binders[i].$element = view.$element;
			this.binders[i].model = view.getModel([].concat(this.binders[i].modelPathArray));
			this.binders[i].value = null;
		}
	},

	initBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].init();
	},

	destroyBinders: function()
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].destroy();
	},

	refreshBinders: function(event)
	{
		for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].modelChange(true);
	}

});


kff.BindingView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	/** @lends kff.BindingView */
	{
		bindingRegex: /(?:([.a-zA-Z0-9*-]+))((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g,

		operatorsRegex: /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g,

		commaSeparateRegex: /\s*,\s*/,

		modifierSeparateRegex: /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\s*]+})/g,

		leadingPeriodRegex: /^\./,

		trailingPeriodRegex: /\.$/,

		/**
		 * Object hash that holds references to binder classes under short key names
		 * @private
		*/
		binders: {},

		helpers: {},

		/**
		 * Registers binder class
		 *
		 * @param {string} alias Alias name used in binding data-attributes
		 * @param {kff.Binder} binder Binder class to register
		 */
		registerBinder: function(alias, binder)
		{
			kff.BindingView.binders[alias] = binder;
		},

		/**
		 * Registers helper function to be used as parser/formatter
		 *
		 * @param {string} alias Name of helper function
		 * @param {function} helper Helper function
		 */
		registerHelper: function(alias, helper)
		{
			kff.BindingView.helpers[alias] = helper;
		}
	}
},
/** @lends kff.BindingView.prototype */
{
	/**
	 * Specialized View class for two-way data binding.
	 *
	 * @constructs
	 * @augments kff.View
	 */
	constructor: function(options)
	{
		options = options || {};
		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startRender: function(silent)
	{
		if(this.modelBindersMap !== null) this.modelBindersMap.initBinders();
		else this.initBinding();
		if(this.collectionBinder) this.renderBoundViews();
		kff.BindingView._super.startRender.call(this, silent);
		kff.setZeroTimeout(this.f('refreshOwnBinders'));
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startDestroy: function(silent)
	{
		this.destroyBinding();
		kff.BindingView._super.startDestroy.call(this, true);
		this.destroyBoundViews();
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, binderName, binderParams, formatters, parsers, getters, setters, eventNames, fill, i, watch;
		var modifierName, modifierParams;
		var dataBindAttr = this.$element.attr(kff.View.DATA_BIND_ATTR);
		var modelName;

		var bindingRegex = kff.BindingView.bindingRegex;
		var operatorsRegex = kff.BindingView.operatorsRegex;
		var modifierSeparateRegex = kff.BindingView.modifierSeparateRegex;
		var commaSeparateRegex = kff.BindingView.commaSeparateRegex;
		var leadingPeriodRegex = kff.BindingView.leadingPeriodRegex;
		var trailingPeriodRegex = kff.BindingView.trailingPeriodRegex;

		bindingRegex.lastIndex = 0;
		operatorsRegex.lastIndex = 0;

		this.modelBindersMap = new kff.BinderMap();

		while((result = bindingRegex.exec(dataBindAttr)) !== null)
		{
			modelPathArray = result[1].replace(leadingPeriodRegex, '*.').replace(trailingPeriodRegex, '.*').split('.');

			formatters = [];
			parsers = [];
			setters = [];
			getters = [];
			eventNames = [];
			fill = false;
			watch = false;

			i = 0;
			while((result2 = operatorsRegex.exec(result[2])) !== null)
			{
				if(i === 0)
				{
					// Parse binder name and params
					binderName = result2[1];
					binderParams = result2[2];

					if(binderParams)
					{
						binderParams = binderParams.split(commaSeparateRegex);
					}
					else binderParams = [];
				}
				else
				{
					modifierName = result2[1];
					modifierParams = [];

					if(result2[2])
					{
						modifierParams = result2[2].match(modifierSeparateRegex);
					}

					switch(modifierName){
						case 'f':
							this.parseHelpers(modifierParams, formatters);
							break;
						case 'p':
							this.parseHelpers(modifierParams, parsers);
							break;
						case 'on':
							this.parseSetters(modifierParams, eventNames);
							break;
						case 'as':
							this.parseSetters(modifierParams, itemAliases);
							break;
						case 'set':
							this.parseSetters(modifierParams, setters);
							break;
						case 'get':
							this.parseSetters(modifierParams, getters);
							break;
						case 'fill':
							fill = true;
							break;
						case 'watch':
							watch = true;
							break;
					}
				}
				i++;
			}

			model = this.getModel(modelPathArray);

			if(model instanceof kff.Collection)
			{
				if(!this.options.isBoundView)
				{
					this.collectionBinder = {
						collection: model
					};
					if(binderName === 'as' && binderParams.length > 0)
					{
						this.itemAlias = binderParams[0];
					}
				}
			}
			else
			{
				if(!binderName || !(binderName in kff.BindingView.binders)) break;

				if(modelPathArray.length > 1) attr = modelPathArray.pop();
				else attr = null;

				if(attr === '*') attr = null;

				modelName = modelPathArray.length > 0 ? modelPathArray[0] : null;
				model = this.getModel(modelPathArray);

				// Special binding for collection count property
				if(model instanceof kff.Collection)
				{
					if(attr === 'count') model = this.bindCollectionCount(model);
				}

				var modelBinder = new kff.BindingView.binders[binderName]({
					view: this,
					$element: this.$element,
					params: binderParams,
					attr: attr,
					model: model,
					modelName: modelName,
					modelPathArray: modelPathArray,
					formatters: formatters,
					parsers: parsers,
					setters: setters,
					getters: getters,
					eventNames: eventNames,
					fill: fill,
					watch: watch
				});

				this.modelBindersMap.add(modelBinder);
				modelBinder.init();

			}
		}
	},

	/**
	 * Special binding for Collection count property which is not bindable in a standard way.
	 * Creates a proxy model object that observes the collection for a change event and mirrors the
	 * count property of collection in the count attribute of the proxy model.
	 *
	 * @param {kff.Collection} collection The collection to be observed
	 */
	bindCollectionCount: function(collection)
	{
		var model = new kff.Model();
		var handler = function(){
			model.set('count', collection.count());
		};

		handler();

		if(!this.boundCollectionCounts) this.boundCollectionCounts = [];
		this.boundCollectionCounts.push({
			collection: collection,
			handler: handler
		});
		collection.on('change', handler);
		return model;
	},

	/**
	 * Destroys all collectin count bindings previously created by the bindCollectionCount method
	 */
	destroyCollectionCountBindings: function()
	{
		if(this.boundCollectionCounts)
		{
			for(var i = 0, l = this.boundCollectionCounts.length; i < l; i++)
			{
				this.boundCollectionCounts[i].collection.off('change', this.boundCollectionCounts[i].handler);
			}
		}
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseHelpers: function(modifierParams, modifiers)
	{
		var modifierParam, modifierArgs;

		for(var j = 0, l = modifierParams.length; j < l; j++)
		{
			modifierParam = modifierParams[j];

			if(j + 1 < l && modifierParams[j + 1].indexOf('{') === 0)
			{
				modifierArgs = modifierParams[j + 1].match(/([^,\s{}]+)/);
				j++;
			}
			else
			{
				modifierArgs = [];
			}
			if(kff.BindingView.helpers[modifierParam]) modifiers.push({ fn: kff.BindingView.helpers[modifierParam], args: modifierArgs });
		}
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
 	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseSetters: function(modifierParams, modifiers)
	{
		for(var j = 0; j < modifierParams.length; j++)
		{
			modifiers.push(modifierParams[j]);
		}
	},

	/**
	 * Destroys all bindings
	 */
	destroyBinding: function()
	{
		this.modelBindersMap.destroyBinders();
		this.modelBindersMap = null;
		this.destroyCollectionCountBindings();
	},

	/**
	 * Renders "bound" views.
	 * This method generates DOM elements corresponding to each item in the bound collection and
	 * creates the bindingView for each element. If the collection changes, it reflects those changes
	 * automatically in real time.
	 */
	renderBoundViews: function()
	{
		this.$anchor = $(document.createTextNode(''));
		this.$element.before(this.$anchor);
		this.$element.remove();
		this.subViewsMap = [];

		// Subview options:
		this.subViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();

		this.subViewOptions = opt ? JSON.parse(opt) : {};
		this.subViewOptions.parentView = this;
		this.subViewOptions.viewFactory = this.viewFactory;
		this.subViewOptions.isBoundView = true;

		this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));
		this.refreshBoundViewsAll();
	},

	/**
	 * Inits filtering of colelction items
	 *
	 * @private
	 */
	initCollectionFilter: function()
	{
		var filterName = this.$element.attr('data-kff-filter');


		if(filterName)
		{
			this.collectionFilter =
			{
				model: null,
				fn: null
			};
			filterName = filterName.replace(/^\./, '').split('.');
			if(filterName.length === 1)
			{
				this.collectionFilter.fn = filterName[0];
			}
			else
			{
				this.collectionFilter.fn =  filterName.pop();
				this.collectionFilter.model =  this.getModel([].concat(filterName));
			}
		}
	},

	/**
	 * Destroys previously bound views.
	 *
	 * @private
	 */
	destroyBoundViews: function()
	{
		if(this.collectionBinder) this.collectionBinder.collection.off('change', this.f('refreshBoundViews'));
		if(this.elements)
		{
			for(var i = 0, l = this.elements.length; i < l; i++) this.elements[i].remove();
		}
		this.elements = [];
		if(this.$anchor)
		{
			this.$anchor.after(this.$element);
			this.$anchor.remove();
		}
	},

	/**
	 * Updates bound views when collection changes.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		switch(event ? event.type : null)
		{
			case 'append':
				this.refreshBoundViewsOnAppend(event);
				break;
			case 'insert':
				this.refreshBoundViewsOnInsert(event);
				break;
			case 'remove':
				this.refreshBoundViewsOnRemove(event);
				break;
			default:
				this.refreshBoundViewsAll();
		}
	},

	/**
	 * Updates bound views when collection changes by appending item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnAppend: function(event)
	{
		this.subViewsMap.push(false);
		event.item.on('change', this.f('collectionItemChange'));
		this.collectionItemChange({ model: event.item });
	},
	/**
	 * Updates bound views when collection changes by inserting item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnInsert: function(event)
	{
		this.subViewsMap.splice(event.index, 0, false);
		event.item.on('change', this.f('collectionItemChange'));
		this.collectionItemChange({ model: event.item });
	},

	/**
	 * Updates bound views when collection changes by removing item.
	 *
	 * @private
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnRemove: function(event)
	{
		event.item.off('change', this.f('collectionItemChange'));

		// Find render index:
		for(var i = 0, l = this.subViews.length; i < l; i++)
		{
			if(event.item === this.subViews[i].models['*']) break;
		}

		var renderIndex = i;
		var realIndex = null;

		// Find real index in collection:
		for(var i = 0, l = this.subViewsMap.length; i < l; i++)
		{
			if(this.subViewsMap[i] === renderIndex)
			{
				realIndex = i;
				break;
			}
		}

		if(realIndex !== null)
		{
			if(this.subViewsMap[i] !== false) this.removeSubViewAt(renderIndex);
			this.subViewsMap.splice(i, 1);
		}

		this.reindexSubviews(i);
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		var filter, filterModel, filterFnName, render, renderIndex = 0, collectionItemChange = this.f('collectionItemChange'), that = this;

		kff.setZeroTimeout(function()
		{
			that.collectionBinder.collection.each(function(item, i)
			{
				item.off('change', collectionItemChange);
			});

			that.destroySubviews();

			if(that.elements)
			{
				for(var i = 0, l = that.elements.length; i < l; i++) that.elements[i].remove();
			}

			that.elements = [];
			that.subViewsMap = [];

			if(that.collectionFilter)
			{
				filter = true;
				filterModel = that.collectionFilter.model || null;
				filterFnName = that.collectionFilter.fn;
			}

			that.collectionBinder.collection.each(function(item, i)
			{
				var currentFilterModel;

				render = true;
				item.on('change', collectionItemChange);

				if(filter)
				{
					currentFilterModel = filterModel || item;
					render = !!currentFilterModel[filterFnName](item);
				}

				if(render)
				{
					that.elements.push(that.createSubView(item));
					that.subViewsMap.push(renderIndex);
					renderIndex++;
				}
				else
				{
					that.subViewsMap.push(false);
				}
			});
		});

		kff.setZeroTimeout(function()
		{
			if('Zepto' in window && $ === window.Zepto)
			{
				var elems = [];

				for(var i = 0, l = that.elements.length; i < l; i++)
				{
					elems.push(that.elements[i].get(0));
				}

				that.$anchor.after(elems);
				that.reindexSubviews();
			}
			else
			{
				that.$anchor.after(that.elements);
				that.reindexSubviews();
			}
		});
	},

	/**
	 * Event handler for collection item change
	 *
	 * @private
	 * @param  {mixed} event Model's event object
	 */
	collectionItemChange: function(event)
	{
		var item = event.model,
			i = this.collectionBinder.collection.indexOf(item),
			j,
			renderIndex,
			filter,
			filterModel;


		if(this.collectionFilter)
		{
			filterModel = item;
			if(this.collectionFilter.model) filterModel = this.collectionFilter.model;

			renderIndex = 0;
			filter = !!filterModel[this.collectionFilter.fn].call(filterModel, item);

			if(filter && this.subViewsMap[i] === false)
			{
				for(j = 0; j < i; j++)
				{
					if(this.subViewsMap[j] !== false) renderIndex++;
				}
				this.addSubViewAt(i, renderIndex);
			}
			else if(!filter && this.subViewsMap[i] !== false)
			{
				this.subViewsMap[i] = false;
				this.removeSubViewAt(this.subViewsMap[i]);
			}
		}
		else
		{
			if(this.subViewsMap[i] === false) this.addSubViewAt(i, i);
		}
	},

	/**
	 * Applies filter to the whole collection. Used when the filter changes.
	 *
	 * @private
	 */
	refilterCollection: function()
	{
		this.collectionBinder.collection.each(this.f(function(item, i)
		{
			this.collectionItemChange({ model: item });
		}));
	},

	/**
	 * Removes a view at given index (rendered index)
	 *
	 * @private
	 * @param  {number} renderIndex Rendered index of item
	 */
	removeSubViewAt: function(renderIndex)
	{
		this.subViews[renderIndex].startDestroy();
		this.subViews.splice(renderIndex, 1);
		this.elements[renderIndex].remove();
		this.elements.splice(renderIndex, 1);

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Adds a view at given index
	 *
	 * @private
	 * @param {number} collectionIndex Index of item in the collection
	 * @param {number} renderIndex     Index of item in the view (view can be filtered)
	 */
	addSubViewAt: function(collectionIndex, renderIndex)
	{
		var item = this.collectionBinder.collection.findByIndex(collectionIndex);
		var $element = this.createSubView(item, renderIndex);

		if(renderIndex === 0)
		{
			this.$anchor.after($element);
		}
		else
		{
			this.elements[renderIndex - 1].after($element);
		}
		this.elements.splice(renderIndex, 0, $element);

		this.subViewsMap[collectionIndex] = renderIndex;

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Refreshes view indices when the collection changes
	 *
	 * @private
	 * @param  {nubmer} from Render index at which reindexing starts
	 * @param  {number} to   Render index at which reindexing ends
	 */
	reindexSubviews: function(from, to)
	{
		if(!from) from = 0;
		if(!to || to > this.subViews.length) to = this.subViews.length;

		// Reindex subsequent subviews:
		for(var i = from; i < to; i++)
		{
			this.subViews[i].setBindingIndex(i);
			this.subViews[i].refreshBinders(true);
		}
		// Reindex subViewsMap
		for(var i = 0, l = this.subViewsMap.length, j = 0; i < l; i++)
		{
			if(this.subViewsMap[i] !== false)
			{
				this.subViewsMap[i] = j;
				j++;
			}
		}
	},

	/**
	 * Creates a new subview for item in collection
	 * @param  {kff.Model} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {jQuery} 		JQuery-wrapped DOM element of the view
	 */
	createSubView: function(item, i)
	{
		var subView, $element = this.$element.clone();

		this.subViewOptions.element = $element;
		this.subViewOptions.models = { '*': item };
		if(this.itemAlias) this.subViewOptions.models[this.itemAlias] = item;

		subView = new this.constructor(this.subViewOptions);

		if(subView instanceof kff.View)
		{
			if(i === undefined)
			{
				this.subViews.push(subView);
				i = this.subViews.length - 1;
			}
			else
			{
				this.subViews.splice(i, 0, subView);
			}
			subView.setBindingIndex(i);

			if(this.modelBindersMapTemplate)
			{
				subView.modelBindersMap = this.modelBindersMapTemplate.clone();
				subView.modelBindersMap.setView(subView);
			}

			subView.init();

			$element.attr(kff.View.DATA_RENDERED_ATTR, true);

			if(!this.modelBindersMapTemplate)
			{
				this.modelBindersMapTemplate = subView.modelBindersMap.clone();
				this.modelBindersMapTemplate.destroyBinders();
			}
		}
		return $element;
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function(event)
	{
		if(this.modelBindersMap) this.modelBindersMap.refreshBinders();
		if(event !== true && this.collectionBinder && this.collectionFilter) this.refilterCollection();
	},

	/**
	 * Refreshes binders
	 *
	 * @private
	 */
	refreshBinders: function(event)
	{
		this.refreshOwnBinders(event);
		kff.BindingView._super.refreshBinders.call(this, event);
	},

	renderSubviews: function()
	{
		if(!this.collectionBinder) kff.BindingView._super.renderSubviews.call(this);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function(modelName)
	{
		modelName = modelName || '*';
		if(this.bindingIndex !== null && this.models.hasOwnProperty(modelName)) return this.bindingIndex;
		if(this.parentView instanceof kff.View) return this.parentView.getBindingIndex(modelName);
		return null;
	},

	/**
	 * Sets current binding index
	 *
	 * @private
	 */
	setBindingIndex: function(index)
	{
		this.bindingIndex = index;
	}
});


kff.BindingView.registerHelper('index', function(v, modelName)
{
	if(this.getBindingIndex(modelName) !== null) return this.getBindingIndex(modelName);
	return v;
});

kff.BindingView.registerHelper('indexFromOne', function(v, modelName)
{
	if(this.getBindingIndex(modelName) !== null) return this.getBindingIndex(modelName) + 1;
	return v;
});


kff.BindingView.registerHelper('boolean', function(v)
{
	var parsed = parseInt(v, 10);
	if(!isNaN(parsed)) return !!parsed;
	return v === 'true';
});

kff.BindingView.registerHelper('not', function(v)
{
	return !v;
});

kff.BindingView.registerHelper('null', function(v)
{
	return v === null || v === 'null' ? null : v;
});

kff.BindingView.registerHelper('int', function(v)
{
	v = parseInt(v, 10);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('float', function(v)
{
	v = parseFloat(v);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('string', function(v)
{
	return v.toString();
});


kff.Binder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		this.options = options;
		this.eventNames = options.eventNames;
		this.events = options.events || [];
		this.view = options.view;
		this.$element = options.$element;
		this.attr = options.attr;
		this.model = options.model;
		this.modelName = options.modelName;
		this.modelPathArray = options.modelPathArray;
		this.parsers = options.parsers;
		this.formatters = options.formatters;
		this.setter = (options.setters instanceof Array && options.setters.length > 0) ? options.setters[0] : null;
		this.getter = (options.getters instanceof Array && options.getters.length > 0) ? options.getters[0] : null;
		this.params = options.params;
		this.currentValue = null;
		this.bindingIndex = null;
		this.dynamicBindings = [];
		this.value = null;
	},

	init: function()
	{
		if(this.options.watch)
		{
			this.rebind();
		}
		else if(this.model instanceof kff.Model)
		{
			this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.delegateEvents.call(this, this.events);
		}
		if(this.options.fill && this.model instanceof kff.Model) this.fill();
	},

	destroy: function()
	{
		if(this.model instanceof kff.Model) this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
		if(this.options.watch) this.unbindDynamic();
		if(this.$element && this.events.length > 0) this.undelegateEvents.call(this, this.events);
		this.currentValue = null;
		this.value = null;
	},

	delegateEvents: kff.View.prototype.delegateEvents,

	undelegateEvents: kff.View.prototype.undelegateEvents,

	modelChange: function(event)
	{
		var modelValue;
		if(this.model instanceof kff.Model)
		{
			if(this.getter && typeof this.model[this.getter] === 'function') modelValue = this.model[this.getter](this.attr);
			else if(event !== true) modelValue = event.changed[this.attr];
			else if(typeof this.attr === 'string') modelValue = this.model.get(this.attr);
			else modelValue = null;

			if(event === true || !this.compareValues(modelValue, this.currentValue))
			{
				this.value = this.format(modelValue);
				this.currentValue = modelValue;
				this.refresh();
			}
		}
	},

	compareValues: function(value1, value2)
	{
		if((value1 instanceof Array) && (value2 instanceof Array))
		{

			var l = value1.length;
			if(l !== value2.length) return false;
			for(var i = 0; i < l; i++)
			{
				if(value1[i] !== value2[i]) return false;
			}
			return true;
		}
		else return value1 === value2;
	},

	getFormattedValue: function()
	{
		return this.value;
	},

	updateModel: function(value)
	{
		var i, l;
		if(value instanceof Array)
		{
			for(i = 0, l = value.length; i < l; i++) value[i] = this.parse(value[i]);
		}
		else
		{
			value = this.parse(value);
		}
		if(this.compareValues(value, this.currentValue)) return;
		this.currentValue = value;
		if(this.setter && typeof this.model[this.setter] === 'function')
		{
			if(this.attr === null) this.model[this.setter](this.currentValue);
			else this.model[this.setter](this.attr, this.currentValue);
		}
		else this.model.set(this.attr, this.currentValue);
	},

	refresh: function(value){},

	format: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.formatters.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.formatters[i].fn.apply(this, [value[j]].concat(this.formatters[i].args));
				value = value2;
			}
			else value = this.formatters[i].fn.apply(this, [value].concat(this.formatters[i].args));
		}
		return value;
	},

	parse: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.parsers.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.parsers[i].fn.apply(this, [value[j]].concat(this.parsers[i].args));
				value = value2;
			}
			else value = this.parsers[i].fn.apply(this, [value].concat(this.parsers[i].args));
		}
		return value;
	},

	getBindingIndex: function(modelName)
	{
		modelName = modelName || '*';
		return this.view.getBindingIndex(modelName);
	},

	clone: function()
	{
		var obj = new this.constructor({
			eventNames: this.eventNames,
			view: null,
			$element: this.$element,
			attr: this.attr,
			model: null,
			modelName: this.modelName,
			modelPathArray: this.modelPathArray,
			parsers: this.parsers,
			formatters: this.formatters,
			params: this.params,
			fill: this.options.fill
		});
		obj.setter = this.setter;
		obj.getter = this.getter;
		return obj;
	},

	fill: function(){},

	rebindTimed: function(event)
	{
		kff.setZeroTimeout(this.f('rebind'));
	},

	rebind: function(event)
	{
		this.unbindDynamic();
		if(this.model instanceof kff.Model)
		{
			this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.undelegateEvents.call(this, this.events);
		}

		this.bindDynamic();
		if(this.model instanceof kff.Model)
		{
			this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.delegateEvents.call(this, this.events);
			this.modelChange(true);
		}
	},

	bindDynamic: function()
	{
		var modelName = this.modelPathArray[0],
			model = this.view.getModel(modelName),
			attr;

		for(var i = 1, l = this.modelPathArray.length; i < l; i++)
		{
			attr = this.modelPathArray[i];
			if(model instanceof kff.Model)
			{
				model.on('change:' + attr, this.f('rebindTimed'));
				this.dynamicBindings.push({ model: model, attr: attr });
				model = model.get(attr);
			}
			else if(model !== null && typeof model === 'object' && (attr in model)) model = model.attr;
			else model = null;
		}
		if(model instanceof kff.Model) this.model = model;
		else this.model = null;
	},

	unbindDynamic: function()
	{
		for(var i = 0, l = this.dynamicBindings.length; i < l; i++)
		{
			this.dynamicBindings[i].model.off('change:' + this.dynamicBindings[i].attr, this.f('rebindTimed'));
		}
		this.dynamicBindings = [];
	}

});


kff.EventBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.EventBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for generic DOM event.
	 * Sets model atrribute to defined value when event occurs.
	 * Event defaults to click.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options.events = [
			[eventNames, 'triggerEvent']
		];
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.userValue = this.params[0] || null;
		kff.EventBinder._super.init.call(this);
	},

	triggerEvent: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.userValue);
		}));
		event.preventDefault();
	},

	compareValues: function(value1, value2)
	{
		return false;
	}

});

kff.BindingView.registerBinder('event', kff.EventBinder);



kff.AttrBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.AttrBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for an element attribute.
	 * Sets the attribute of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.attribute = this.params[0] || null;
		this.prefix = this.params[1] || '';
		this.suffix = this.params[2] || '';
		kff.AttrBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.value + this.suffix);
	}
});

kff.BindingView.registerBinder('attr', kff.AttrBinder);


kff.CheckBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.CheckBinder.prototype */
{
	/**
	 * Two-way data binder for checkbox.
	 * Checks input when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click change';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':checked'));
		}));
	},

	refresh: function()
	{
		this.$element.prop('checked', !!this.value);
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.is(':checked');
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.fillVal);
		}));
	}
});

kff.BindingView.registerBinder('check', kff.CheckBinder);


kff.DisabledBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.DisabledBinder.prototype */
{
	/**
	 * Two-way data binder for checkbox.
	 * Checks input when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	refresh: function()
	{
		this.$element.prop('disabled', !!this.value);
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.is(':disbaled');
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.fillVal);
		}));
	}
});

kff.BindingView.registerBinder('disabled', kff.DisabledBinder);


kff.ClassBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ClassBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for CSS class.
	 * Sets the class of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.className = this.params[0] || null;
		this.equalsTo = this.params[1] || true;
		this.operator = this.params[2] || null;
		kff.ClassBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.className) this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
	},

	matchValue: function()
	{
		if(this.equalsTo)
		{
			if(this.operator === 'ne')	return this.value !== this.parse(this.equalsTo);
			else return this.value === this.parse(this.equalsTo);
		}
		else return this.value;
	}
});

kff.BindingView.registerBinder('class', kff.ClassBinder);


kff.StyleBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.StyleBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for CSS class.
	 * Sets the class of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.styleProperty = this.params[0] || null;
		kff.StyleBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.styleProperty) this.$element.css(this.styleProperty, this.value);
	}
});

kff.BindingView.registerBinder('style', kff.StyleBinder);


kff.ClickBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.ClickBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for click event.
	 * Sets model atrribute to defined value when click event occurs.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['click'];
		kff.EventBinder.call(this, options);
	}
});

kff.BindingView.registerBinder('click', kff.ClickBinder);



kff.DoubleClickBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.DoubleClickBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for double click event.
	 * Sets model atrribute to defined value when dblclick event occurs.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['dblclick'];
		kff.EventBinder.call(this, options);
	}

});

kff.BindingView.registerBinder('dblclick', kff.DoubleClickBinder);

kff.FocusBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.FocusBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for focus event.
	 * Sets model atrribute to defined value when element gets focus.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus'];
		kff.EventBinder.call(this, options);
	}

});

kff.BindingView.registerBinder('focus', kff.FocusBinder);

kff.BlurBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.BlurBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for blur event.
	 * Sets model atrribute to defined value when element looses focus.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['blur'];
		kff.EventBinder.call(this, options);
	}

});

kff.BindingView.registerBinder('blur', kff.BlurBinder);

kff.FocusBlurBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.FocusBlurBinder.prototype */
{
	/**
	 * Two-way data binder for focus/blur event.
	 * Sets model atrribute to true when element gets focus or to false when it looses focus.
	 * Also triggers focus/blur event on attribute change.
	 * Values are passed throught eventual parsers/formatters of course.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus blur'];
		kff.EventBinder.call(this, options);
	},

	triggerEvent: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':focus'));
		}));
	},

	refresh: function()
	{
		if(this.value)
		{
			if(!this.$element.is(':focus')) this.$element.trigger('focus');
		}
		else
		{
			if(this.$element.is(':focus')) this.$element.trigger('blur');
		}
	}
});

kff.BindingView.registerBinder('focusblur', kff.FocusBlurBinder);

kff.HtmlBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.HtmlBinder.prototype */
{
	/**
	 * One-way data binder for html content of the element.
	 * Renders html content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	refresh: function()
	{
		this.$element.html(this.value);
	}
});

kff.BindingView.registerBinder('html', kff.HtmlBinder);


kff.RadioBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.RadioBinder.prototype */
{
	/**
	 * Two-way data binder for radio button.
	 * Checks radio when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			if(this.$element.is(':checked'))
			{
				this.updateModel(this.$element.val());
			}
		}));
	},

	refresh: function()
	{
		this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.is(':checked');
		kff.setZeroTimeout(this.f(function()
		{
			if(this.fillVal)
			{
				this.updateModel(this.$element.val());
			}
		}));
	}

});

kff.BindingView.registerBinder('radio', kff.RadioBinder);


kff.TextBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text content of the element.
	 * Renders text content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	refresh: function(value)
	{
		this.$element.text(this.value);
	}
});

kff.BindingView.registerBinder('text', kff.TextBinder);


kff.ValueBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ValueBinder.prototype */
{
	/**
	 * Two-way data binder for input, select, textarea elements.
	 * Triggers model change on keydown, drop and change events on default.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'keydown drop change';
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.$element.val());
		}));
	},

	refresh: function()
	{
		this.$element.val(this.getFormattedValue());
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.val();
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.fillVal);
		}));
	}
});

kff.BindingView.registerBinder('val', kff.ValueBinder);


kff.ViewFactory = kff.createClass(
/** @lends kff.ViewFactory.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		this.serviceContainer = options.serviceContainer || null;
		this.precedingViews = options.precedingViews || {};
	},

	createView: function(viewName, options)
	{
		var view = null, viewClass;
		options = options || {};

		if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName)) view = this.serviceContainer.getService(viewName, [options]);
		else
		{
			if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
			else viewClass = viewName;
			if(viewClass) view = new viewClass(kff.mixins({}, options, { viewFactory: this }));
		}
		return view;
	},

	getServiceConstructor: function(viewName)
	{
		if(typeof viewName === 'function') return viewName;
		if(this.serviceContainer && this.serviceContainer.hasService(viewName)) return this.serviceContainer.getServiceConstructor(viewName);
		else return kff.evalObjectPath(viewName);
	},

	getPrecedingView: function(viewName)
	{
		var viewCtor;
		if(typeof viewName === 'string' && this.precedingViews[viewName] !== undefined) return this.precedingViews[viewName];
		else
		{
			viewCtor = this.getServiceConstructor(viewName);
			if(viewCtor && viewCtor.precedingView) return viewCtor.precedingView;
		}
		return null;
	}

});

/*
 *  Parts of kff.Route code from https://github.com/visionmedia/page.js
 *  Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 */

kff.Route = kff.createClass(
/** @lends kff.Route.prototype */
{
	/**
		@constructs
	*/
	constructor: function(pattern, target)
	{
		this.pattern = pattern;
		this.target = target;
		this.keys = null;
		this.regexp = this.compileRegex();
	},

	getTarget: function()
	{
		return this.target;
	},

	match: function(path, params)
	{
		var keys = this.keys,
			qsIndex = path.indexOf('?'),
			pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
			m = this.regexp.exec(pathname);

		if (!m) return false;

		for (var i = 1, len = m.length; i < len; ++i) {
			var key = keys[i - 1];

			var val = 'string' == typeof m[i]
				? decodeURIComponent(m[i])
				: m[i];

			if (key) {
				params[key.name] = undefined !== params[key.name]
					? params[key.name]
					: val;
			} else {
				params.push(val);
			}
		}

		return true;
	},

	/**
	 * Normalize the given path string,
	 * returning a regular expression.
	 *
	 * An empty array should be passed,
	 * which will contain the placeholder
	 * key names. For example "/user/:id" will
	 * then contain ["id"].
	 *
	 * @param  {String|RegExp|Array} path
	 * @param  {Array} keys
	 * @param  {Boolean} sensitive
	 * @param  {Boolean} strict
	 * @return {RegExp}
	 * @api private
	 */
	compileRegex: function(sensitive, strict)
	{
		var keys = this.keys = [];
		var path;

		path = this.pattern
			.concat(strict ? '' : '/?')
			.replace(/\/\(/g, '(?:/')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
				keys.push({ name: key, optional: !! optional });
				slash = slash || '';
				return ''
					+ (optional ? '' : slash)
					+ '(?:'
					+ (optional ? slash : '')
					+ (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
					+ (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.*)');
		return new RegExp('^' + path + '$', sensitive ? '' : 'i');
	}


});


kff.Router = kff.createClass(
/** @lends kff.Router.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		this.options = options || {};
		this.routes = [];
		this.buildRoutes();
	},

	buildRoutes: function()
	{
		this.routes = [];
		var routesConfig = this.options.routes;
		for(var key in routesConfig)
		{
			this.routes.push(new kff.Route(key, routesConfig[key]));
		}
	},

	match: function(path)
	{
		var params;
		for(var i = 0, l = this.routes.length; i < l; i++)
		{
			params = [];
			if(this.routes[i].match(path, params)) return { target: this.routes[i].getTarget(), params: params };
		}
		return null;
	}

});


kff.FrontController = kff.createClass(
/** @lends kff.FrontController.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		this.options = options;
		this.views = null;
		this.viewsQueue = [];
		this.viewFactory = options.viewFactory || new kff.ViewFactory();
		this.router = options.router || null;
	},

	init: function()
	{
		if(this.router) $(window).bind('hashchange', this.f('hashChange')).trigger('hashchange');
		else this.setState(null);
	},

	createViewFromState: function(state)
	{
		if(this.router)
		{
			var path = state.path;
			var result;

			if(path === '') path = '#';

			result = this.router.match(path);
			if(result)
			{
				state.params = result.params;
				return result.target;
			}
		}
		return this.options.defaultView;
	},

	hashChange: function(event)
	{
		var hash = location.hash;
		if(hash.indexOf('#') !== 0 && hash != '') return false;

		this.setState({ path: hash, params: {} });
		return false;
	},

	getLastView: function()
	{
		if(this.viewsQueue.length > 0) return this.viewsQueue[this.viewsQueue.length - 1];
		else return null;
	},

	pushView: function(view)
	{
		var lastView = this.getLastView();
		this.viewsQueue.push(view);
		if(lastView)
		{
			lastView.instance.on('render', kff.bindFn(view.instance, 'init'));
			lastView.instance.on('setState', kff.bindFn(view.instance, 'setState'));
		}
	},

	popView: function()
	{
		if(this.viewsQueue.length === 0) return;

		var removedView = this.viewsQueue.pop(),
			lastView = this.getLastView();

		removedView.instance.off('init', kff.bindFn(this, 'cascadeState'));
		if(lastView)
		{
			lastView.instance.off('init', kff.bindFn(removedView.instance, 'init'));
			lastView.instance.off('setState', kff.bindFn(removedView.instance, 'setState'));
		}
		return removedView;
	},

	cascadeState: function()
	{
		if(this.viewsQueue[0]) this.viewsQueue[0].instance.setState(this.state);
	},

	setState: function(state)
	{
		var destroyQueue = [], lastViewName, sharedViewName, i;

		this.state = state;
		this.newViewName = this.createViewFromState(state);
		lastViewName = this.getLastView() ? this.getLastView().name : null;
		sharedViewName = this.findSharedView(this.newViewName, lastViewName);

		while((lastViewName = this.getLastView() ? this.getLastView().name : null) !== null)
		{
			if(lastViewName === sharedViewName) break;
			destroyQueue.push(this.popView());
		}

		for(i = 0; i < destroyQueue.length; i++)
		{
			if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'startDestroy'));
			else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
		}

		if(destroyQueue[0]) destroyQueue[0].instance.startDestroy();
		else this.startInit();
	},

	startInit: function()
	{
		var i, l,
			precedingViewNames = this.getPrecedingViews(this.newViewName),
			from = 0;

		for(i = 0, l = precedingViewNames.length; i < l; i++)
		{
			if(i >= this.viewsQueue.length) this.pushView({ name: precedingViewNames[i], instance: this.viewFactory.createView(precedingViewNames[i], { viewFactory: this.viewFactory })});
			else from = i + 1;
		}

		this.newViewName = null;
		if(this.getLastView()) this.getLastView().instance.on('render', kff.bindFn(this, 'cascadeState'));
		if(this.viewsQueue[from]) this.viewsQueue[from].instance.init();
		else this.cascadeState();
	},

	findSharedView: function(c1, c2)
	{
		var i,
			c1a = this.getPrecedingViews(c1),
			c2a = this.getPrecedingViews(c2),
			c = null;

		for(i = 0, l = c1a.length < c2a.length ? c1a.length : c2a.length; i < l; i++)
		{
			if(c1a[i] !== c2a[i]) break;
			c = c1a[i];
		}
		return c;
	},

	getPrecedingViews: function(viewName)
	{
		var c = viewName, a = [c];

		while(c)
		{
			c = this.viewFactory.getPrecedingView(c);
			if(c) a.unshift(c);
		}
		return a;
	}
});


kff.App = kff.createClass(
/** @lends kff.App.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		var models;
		options = options || {};
		models = options.models || {};

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				viewFactory: {
					construct: 'kff.ViewFactory',
					args: [{
						serviceContainer: '@'
					}],
					shared: true
				},
				frontController: {
					construct: 'kff.FrontController',
				    args: [{
				    	viewFactory: '@viewFactory',
				    	defaultView: 'pageView'
				    }],
				    shared: true
				},
				pageView: {
					construct: 'kff.PageView',
					args: [{
				    	viewFactory: '@viewFactory',
				    	models: models
				    }]
				}
			}
		};

		this.serviceContainer = new kff.ServiceContainer(config);
		if('parameters' in options) this.serviceContainer.registerParameters(options.parameters, true);
		if('services' in options) this.serviceContainer.registerServices(options.services, true);

		return this;
	},

	init: function()
	{
		this.serviceContainer.getService('frontController').init();
	},

	getServiceContainer: function()
	{
		return this.serviceContainer;
	}

});



})(this);
