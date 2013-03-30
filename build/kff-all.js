/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
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
				if(deep && typeof prop === 'object' && prop !== null && prop.constructor === Object)
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
kff.bindFn = function(obj, fnName)
{
	if(typeof obj[fnName] !== 'function') throw new TypeError("Expected function: " + fnName + ' (kff.bindFn)');
	if(!('_boundFns' in obj)) obj._boundFns = {};
	if(fnName in obj._boundFns) return obj._boundFns[fnName];
	else obj._boundFns[fnName] = function(){ return obj[fnName].apply(obj, arguments); };
	return obj._boundFns[fnName];
};

kff.classMixin = {
	f: function(fnName)
	{
		var obj = this;
		if(typeof fnName === 'string') return kff.bindFn(obj, fnName);
		if(typeof fnName === 'function') return function(){ return fnName.apply(obj, arguments); };
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
	var parts = path.split('.');
	while(parts.length)
	{
		if(!(parts[0] in obj)) return null;
		obj = obj[parts.shift()];
	}
	return obj;
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
					if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = [];
					this.subscribers[eventType[i]].push(fn);
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
			if(this.subscribers[eventType] instanceof kff.List) this.subscribers[eventType].removeVal(fn);
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
					val.call(null, eventData);
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

kff.EventsMixin = {
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
		this.count = this.array.length;
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
		@param {mixed} val Item to be appended
	 */
	append: function(val)
	{
		this.array.push(val);
		this.count++;
	},

	/**
		Inserts an item at specified index
		@param {mixed} val Item to be inserted
	 */
	insert: function(val, index)
	{
		this.array.splice(index, 0, val);
		this.count++;
	},

	/**
		Removes item from the list
		@param {mixed} val Reference to the item to be removed
		@returns {Boolean} True if item was removed or false if not found
	 */
	remove: function(val)
	{
		var i = this.indexOf(val);
		if(i === -1) return false;

		this.array.splice(i, 1);
		this.count--;

		return true;
	},

	/**
		Removes all items from the list
	 */
	empty: function()
	{
		this.array = [];
		this.count = 0;
	},

	/**
		Returns an index of given item

		@param {mixed} val Value to be found
		@returns {number} index of the item or -1 if not found
	 */
	indexOf: function(val)
	{
		var i = 0, a = this.array, l = a.length;
		if(a.indexOf) return a.indexOf(val);
		for(; i < l; i++) if(a[i] === val) return i;
		return -1;
	},

	/**
		Returns an item at given position

		@param {number} index Index of item
		@returns {mixed} Item at given position (or undefined if not found)
	 */
	findByIndex: function(index)
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
kff.List.prototype.removeVal = kff.List.prototype.remove;


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
		@param {function} options.valFactory Factory function for creating new collection items (optional)
		@param {function} options.valType Type (class or constructor function) of collection items
	 */
	constructor: function(options)
	{
		options = options || {};
		this.valFactory = options.valFactory || null;
		this.valType = options.valType || kff.Model;
		this.serializeAttrs = options.serializeAttrs || null;
		this.events = new kff.Events();
		kff.List.call(this);
		return this;
	},

	/**
		Appends the item at the end of the collection

		@param {mixed} val Item to be appended
		@param {Boolean} silent If true, do not trigger event
	 */
	append: function(val, silent)
	{
		kff.Collection._super.append.call(this, val);
		if(!silent) this.trigger('change', { addedValue: val });
	},

	/**
		Inserts an item at the end of the collection

		@param {mixed} val Item to be inserted
		@param {Boolean} silent If true, do not trigger event
	 */
	insert: function(val, index, silent)
	{
		kff.Collection._super.insert.call(this, val, index);
		if(!silent) this.trigger('change', { insertedValue: val, insertedIndex: index });
	},

	/**
		Removes the item from the collection

		@param {mixed} val Reference to the item to be removed
		@param {Boolean} silent If true, do not trigger event
		@returns {mixed} Removed item or false if not found
	 */
	remove: function(val, silent)
	{
		var ret = kff.Collection._super.remove.call(this, val);
		if(ret && !silent) this.trigger('change', { removedValue: val });
		return ret;
	},

	/**
		Creates a JSON representation of collection (= array object).

		If item of collection is object, tries to call toJson on it recursively.
		This function returns a plain object, not a stringified JSON.

		@returns {Array} Array representation of collection
	 */
	toJson: function()
	{
		var serializeAttrs = this.serializeAttrs, obj = [];
		this.each(function(val)
		{
			if(val && val.toJson) obj.push(val.toJson(serializeAttrs));
			else obj.push(val);
		});
		return obj;
	},

	/**
		Reads collection from JSON representation (= from JavaScript array)

		@param {Array} obj Array to read from
		@param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(obj, silent)
	{
		var val, valFactory = this.valFactory;
		this.empty();
		for(var i = 0; i < obj.length; i++)
		{
			if(valFactory) val = valFactory(obj[i]);
			else val = new this.valType();
			val.fromJson(obj[i], silent);
			this.append(val, true);
		}
		if(!silent) this.trigger('change', { fromJson: true });
	},

	/**
		Finds an item with given attribute value

		@param {string} attr Attribute name
		@param {mixed} value Attribute value
		@returns {mixed} First found item or null
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
		Removes all items from collection

		@param {Boolean} silent If true, do not trigger event
	 */
	empty: function(silent)
	{
		kff.Collection._super.empty.call(this);
		if(!silent) this.trigger('change');
	},

	/**
		Sorts collection using a compare function. The compare function follows the same specification
		as the standard Array.sort function

		@param {function} compareFunction Compare function
		@param {Boolean} silent If true, do not trigger event
	 */
	sort: function(compareFunction, silent)
	{
		kff.Collection._super.sort.call(this, compareFunction);
		if(!silent) this.trigger('change');
	},

	/**
		Creates a clone (shallow copy) of the collection.

		@returns {kff.Collection} Cloned collection
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
		Randomizes items in the collection.

		@param {Boolean} silent If true, do not trigger event
	 */
	shuffle: function(silent)
	{
		kff.Collection._super.shuffle.call(this);
		if(!silent) this.trigger('change');
	}

});

kff.Collection.prototype.removeVal = kff.Collection.prototype.remove;

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
		/**
			Events object (used by mixed-in methods)
			@private
		*/
		this.events = new kff.Events();

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
			if(attr instanceof kff.Model) return attr.mget(attrPath);
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
				this.trigger('change:' + changedAttr, { model: this, changedAttributes: changed });
			}
			this.trigger('change', { model: this, changedAttributes: changed });
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
		if(!this.config.services[service]) throw('Service ' + service + ' not defined');
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
		return this.config.services.hasOwnProperty(serviceName);
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
					if(args[i] !== null && typeof args[i] === 'object' && args[i].constructor === Object
						&& argsExtend[i] !== null && typeof argsExtend[i] === 'object' && argsExtend[i].constructor === Object) argsExtended[i] = kff.mixins({}, args[i], argsExtend[i]);
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
		var serviceConfig, ctor;
		serviceConfig = this.config.services[serviceName];
		if(!serviceConfig) return null;
		if(!serviceConfig.hasOwnProperty('constructor'))
		{
			ctor = kff.evalObjectPath(serviceName);
			if(typeof ctor === 'function') serviceConfig.constructor = ctor;
		}
		else if(typeof serviceConfig.constructor === 'string') serviceConfig.constructor = kff.evalObjectPath(serviceConfig.constructor);
		if(typeof serviceConfig.constructor !== 'function') throw new TypeError('expected function in getServiceConstructor: ' + serviceConfig.constructor);
		return serviceConfig.constructor;
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
		else if(typeof params === 'object' && params !== null && params.constructor === Object)
		{
			ret = {};
			for(i in params)
			{
				ret[i] = this.resolveParameters(params[i]);
			}
		}
		else
		{
			ret = params;
		}
		return ret;
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
		options = options || {};
		this.options = {
			element: null,
			models: null,
			events: []
		};
		this.events = new kff.Events();
		this.models = {};

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
		if(options.parentView)
		{
			this.parentView = options.parentView;
		}
		if(options.models)
		{
			this.models = options.models;
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
		var model;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		model = modelPath.shift();

		if(this.models && model in this.models)
		{
			if(modelPath.length > 0)
			{
				if(this.models[model] instanceof kff.Model) return this.models[model].mget(modelPath);
				else return null;
			}
			else return this.models[model];
		}
		if(this.options.parentView)
		{
			modelPath.unshift(model);
			return this.options.parentView.getModel(modelPath);
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
				if(typeof event[1] === 'string') $element.on(event[0], event[1], kff.bindFn(this, event[2]));
				else event[1].on(event[0], kff.bindFn(this, event[2]));
			}
			else if(event.length === 2) $element.on(event[0], kff.bindFn(this, event[1]));
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
				if(typeof event[1] === 'string') $element.off(event[0], event[1], kff.bindFn(this, event[2]));
				else event[1].off(event[0], kff.bindFn(this, event[2]));
			}
			else if(event.length === 2) $element.off(event[0], kff.bindFn(this, event[1]));
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
	},

	/**
	 * Initializes the view. Calls the render method. Should not be overloaded by subclasses.
	 *
	 * @private
	 * @param
	 */
	init: function()
	{
		this.render();
	},

	/**
	 * Renders the view. It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'render' event won't be called
	 */
	render: function(silent)
	{
		this.$element.attr(kff.View.DATA_RENDERED_ATTR, true);
		this.renderSubviews();
		this.delegateEvents();
		if(!silent) this.trigger('init');
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

		var onAttr = element.getAttribute(kff.View.DATA_TRIGGER_ATTR);
		if(onAttr) this.processChildEvents(element, onAttr);

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
								this.processChildEvents(child, onAttr);
							}

							this.findViewElements(child, viewNames, filter);
						}
					}
				}
			}
		}
	},

	processChildEvents: function(child, onAttr)
	{
		var onAttrSplit, onAttrSplit2, events = [], i, l;
		onAttrSplit = onAttr.split(/\s+/);
		for(i = 0, l = onAttrSplit.length; i < l; i++)
		{
			onAttrSplit2 = onAttrSplit[i].split(':');
			events.push([
				onAttrSplit2[0].replace('|', ' '),
				$(child),
				onAttrSplit2[1]
			]);
		}
		this.addEvents(events);
	},


	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroy: function(silent)
	{
		this.$element.removeAttr(kff.View.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.destroySubviews();
		if(!silent) this.trigger('destroy');
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
			subView.destroy();
			delete this.subViews[i];
		}
		this.subViews = [];
	},

	/**
	 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: function(){},

	refreshBinders: function()
	{
		for(var i = 0, l = this.subViews.length; i < l; i++) this.subViews[i].refreshBinders();
	}


});


kff.View.helpers =
{
	'index': function(v)
	{
		if(this.getBindingIndex() !== null) return this.getBindingIndex();
		return v;
	},

	'indexFromOne': function(v)
	{
		if(this.getBindingIndex() !== null) return this.getBindingIndex() + 1;
		return v;
	},

	'boolean': function(v)
	{
		var parsed = parseInt(v, 10);
		if(!isNaN(parsed)) return !!parsed;
		return v === 'true';
	},

	'not': function(v)
	{
		return !v;
	},

	'null': function(v)
	{
		return v === null || v === 'null' ? null : v;
	},

	'int': function(v)
	{
		v = parseInt(v, 10);
		if(isNaN(v)) v = 0;
		return v;
	},

	'float': function(v)
	{
		v = parseFloat(v);
		if(isNaN(v)) v = 0;
		return v;
	},

	'string': function(v)
	{
		return v.toString();
	},

	'uppercase': function(v)
	{
		return (v || '').toUpperCase();
	},

	'lowercase': function(v)
	{
		return (v || '').toLowerCase();
	},

	'strong': function(v)
	{
		return '<strong>' + v + '</strong>';
	}

	// 'stringToNull': function(v)
	// {
	// 	return v === '' || v === 'null' || v === '0';
	// },

	// 'nullToString': function(v)
	// {
	// 	return v ? 'true' : 'false';
	// }

};


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


kff.BindingView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	/** @lends kff.BindingView */
	{
		/**
		 * Object hash that holds references to binder classes under short key names
		 * @private
		*/
		binders: {},

		/**
		 * Registers binder class
		 *
		 * @param {string} alias Alias name used in binding data-attributes
		 * @param {kff.Binder} binder Binder class to register
		 */
		registerBinder: function(alias, binder)
		{
			kff.BindingView.binders[alias] = binder;
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
		this.modelBinders = {};
		this.collectionBinder = null;
		this.bindingIndex = null;

		this.values = {};
		this.formatters = [];
		this.parsers = [];

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	render: function(silent)
	{
		this.initBinding();
		if(this.collectionBinder) this.renderBoundViews();
		kff.BindingView._super.render.call(this, silent);
		setTimeout(this.f('refreshOwnBinders'), 0);
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	destroy: function(silent)
	{
		this.destroyBinding();
		kff.BindingView._super.destroy.call(this, true);
		this.destroyBoundViews();
		if(!silent) this.trigger('destroy');
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, subresults, name, binderName, binderParams, formatters, parsers, getters, setters, eventNames;
		var modifierName, modifierParams;
		var dataBind = this.$element.attr(kff.View.DATA_BIND_ATTR);

		var regex = /([.a-zA-Z0-9]+):?([a-zA-Z0-9]+)?(\([^\(\))]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?/g;

		this.modelBinders = {};

		while((result = regex.exec(dataBind)) !== null)
		{
			name = result[1];
			name = name.replace(/^\./, '*.').split('.');

			binderName = result[2];
			binderParams = result[3];

			if(binderParams)
			{
				binderParams = binderParams.slice(1,-1).split(/\s*,\s*/);
			}
			else binderParams = [];

			formatters = [];
			parsers = [];
			setters = [];
			getters = [];
			eventNames = [];

			for(var i = 4, l = result.length; i < l && result[i]; i++)
			{
				subresults = result[i].match(/([a-zA-Z0-9]+)\(([^\(\)]*)\)/);

				if(subresults)
				{
					modifierName = subresults[1];
					modifierParams = [];

					if(subresults[2])
					{
						modifierParams = subresults[2].split(/\s*,\s*/);
					}

					switch(modifierName){
						case 'f':
							this.parseModifiers(modifierParams, formatters);
							break;
						case 'p':
							this.parseModifiers(modifierParams, parsers);
							break;
						case 'on':
							this.parseSetters(modifierParams, eventNames);
							break;
						case 'set':
							this.parseSetters(modifierParams, setters);
							break;
						case 'get':
							this.parseSetters(modifierParams, getters);
							break;
					}
				}
			}

			model = this.getModel([].concat(name));

			if(model instanceof kff.Collection)
			{
				if(!this.options.isBoundView)
				{
					this.collectionBinder = {
						collection: model
					};
					this.renderSubViews = function(){};
				}
			}
			else
			{
				if(!binderName || !(binderName in kff.BindingView.binders)) break;

				attr = name.pop();
				model = this.getModel(name);

				// Special binding for collection count property
				if(model instanceof kff.Collection && attr === 'count')
				{
					model = this.bindCollectionCount(model);
				}

				if(model instanceof kff.Model)
				{
					if(!(binderName in this.modelBinders))
					{
						this.modelBinders[binderName] = [];
						this.values[binderName] = [];
					}
					var valueIndex = this.modelBinders[binderName].length;
					var modelBinder = new kff.BindingView.binders[binderName]({
						view: this,
						$element: this.$element,
						valueIndex: valueIndex,
						values: this.values[binderName],
						params: binderParams,
						attr: attr,
						model: model,
						formatters: formatters,
						parsers: parsers,
						setters: setters,
						getters: getters,
						eventNames: eventNames
					});

					this.modelBinders[binderName].push(modelBinder);
					this.values[binderName].push(null);

					modelBinder.init();
				}
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
			model.set('count', collection.count);
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
	parseModifiers: function(modifierParams, modifiers)
	{
		for(var j = 0; j < modifierParams.length; j++)
		{
			if(kff.View.helpers[modifierParams[j]]) modifiers.push(kff.View.helpers[modifierParams[j]]);
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
		for(var b in this.modelBinders)
		{
			for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].destroy();
		}
		this.modelBinders = {};
		this.values = {};
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

		this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));

		this.refreshBoundViews();
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
		if(this.$elements) this.$elements.remove();
		this.$elements = null;
		if(this.$anchor)
		{
			this.$anchor.after(this.$element);
			this.$anchor.remove();
		}
		this.destroySubviews();
	},

	/**
	 * Updates bound views when collection changes.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		if(event && 'addedValue' in event)
		{
			this.subViewsMap.push({
				renderIndex: null,
				rendered: false
			});
			event.addedValue.on('change', this.f('collectionItemChange'));
			this.collectionItemChange({ model: event.addedValue });
		}
		else if(event && 'insertedValue' in event)
		{
			this.subViewsMap.splice(event.insertedIndex, 0, {
				renderIndex: null,
				rendered: false
			});
			event.insertedValue.on('change', this.f('collectionItemChange'));
			this.collectionItemChange({ model: event.insertedValue });
			this.refreshBinders();
		}
		else if(event && 'removedValue' in event)
		{
			event.removedValue.off('change', this.f('collectionItemChange'));

			// Find render index:
			for(var i = 0, l = this.subViews.length; i < l; i++)
			{
				if(event.removedValue === this.subViews[i].models['*']) break;
			}

			var renderIndex = i;
			var realIndex = null;

			// Find real index in collection:
			for(var i = 0, l = this.subViewsMap.length; i < l; i++)
			{
				if(this.subViewsMap[i].renderIndex === renderIndex)
				{
					realIndex = i;
					break;
				}
			}

			if(realIndex !== null)
			{
				if(this.subViewsMap[i].rendered) this.removeSubViewAt(renderIndex);
				this.subViewsMap.splice(i, 1);
			}
			this.refreshBinders();
		}
		else
		{
			this.destroySubviews();
			if(this.$elements) this.$elements.remove();
			this.$elements = $([]);
			this.subViewsMap = [];

			var j = 0;

			this.collectionBinder.collection.each(this.f(function(item, i)
			{
				this.subViewsMap.push({
					renderIndex: null,
					rendered: false
				});
				item.on('change', this.f('collectionItemChange'));
				this.collectionItemChange({ model: item });

			}));
			this.reindexSubviews();
		}
	},

	/**
	 * Event handler for collection item change
	 *
	 * @private
	 * @param  {mixed} event Model's event object
	 */
	collectionItemChange: function(event)
	{
		var item = event.model;
		var i = this.collectionBinder.collection.indexOf(item);
		if(this.collectionFilter)
		{
			var filterModel = item;
			if(this.collectionFilter.model) filterModel = this.collectionFilter.model;

			var j = 0;
			var filter = !!filterModel[this.collectionFilter.fn].call(filterModel, item);

			if(!this.subViewsMap[i].rendered || filter !== this.subViewsMap[i].rendered)
			{
				if(filter)
				{
					for(j = i; j > 0; j--)
					{
						if(this.subViewsMap[j].rendered) break;
					}
					this.addSubViewAt(i, this.subViewsMap[j].renderIndex + 1);
				}
				else if(this.subViewsMap[i].rendered)
				{
					this.subViewsMap[i].rendered = false;
					this.removeSubViewAt(this.subViewsMap[i].renderIndex);
				}
			}
		}
		else
		{
			if(!this.subViewsMap[i].rendered) this.addSubViewAt(i, i);
		}
	},

	/**
	 * Removes a view at given index (rendered index)
	 *
	 * @private
	 * @param  {number} renderIndex Rendered index of item
	 */
	removeSubViewAt: function(renderIndex)
	{
		this.subViews[renderIndex].destroy();
		this.subViews.splice(renderIndex, 1);
		this.$elements.eq(renderIndex).remove();
		this.$elements = this.$elements.slice(0, renderIndex).add(this.$elements.slice(renderIndex + 1));

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

		// debugger;
		if(this.$elements.length === 0)
		{
			this.$elements = this.$elements.add($element);
			this.$anchor.after($element);
		}
		else
		{
			this.$elements.eq(renderIndex - 1).after($element);
			this.$elements = this.$elements.slice(0, renderIndex).add($element).add(this.$elements.slice(renderIndex));
		}

		this.subViewsMap[collectionIndex].renderIndex = renderIndex;
		this.subViewsMap[collectionIndex].rendered = true;

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
			this.subViews[i].refreshBinders();
		}
		// Reindex subViewsMap
		for(var i = 0, l = this.subViewsMap.length, j = 0; i < l; i++)
		{
			if(this.subViewsMap[i].rendered)
			{
				this.subViewsMap[i].renderIndex = j;
				j++;
			}
			else this.subViewsMap[i].renderIndex = null;
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
		var $element = this.$element.clone();

		this.subViewOptions.element = $element;
		this.subViewOptions.models = { '*': item };
		this.subViewOptions.isBoundView = true;
		var subView = this.viewFactory.createView(this.subViewName, this.subViewOptions);
		if(subView instanceof kff.View)
		{
			subView.viewFactory = this.viewFactory;
			this.subViews.push(subView);
			subView.setBindingIndex(i);
			subView.init();
			$element.attr(kff.View.DATA_RENDERED_ATTR, true);
			subView.refresh();
		}
		return $element;
	},

	/**
	 * Returns model object for given keypath.
	 *
	 * @param  {string|Array} modelPath Object keypath
	 * @return {kff.Model}           	Model found
	 */
	getModel: function(modelPath)
	{
		var modelIndex;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		modelIndex = parseInt(modelPath[0], 10);

		if(this.collectionBinder && !isNaN(modelIndex)) return this.collectionBinder.collection.findByIndex(modelIndex);

		return kff.BindingView._super.getModel.call(this, modelPath);
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function()
	{
		for(var b in this.modelBinders)
		{
			for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].modelChange(true);
		}
		if(this.collectionBinder) this.refreshBoundViews();
	},

	/**
	 * Refreshes binders
	 *
	 * @private
	 */
	refreshBinders: function()
	{
		this.refreshOwnBinders();
		kff.BindingView._super.refreshBinders.call(this);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function()
	{
		if(this.bindingIndex !== null) return this.bindingIndex;
		if(this.parentView instanceof kff.BindingView) return this.parentView.getBindingIndex();
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
	},

	/**
	 * Concatenates multiple values using single space as separator.
	 *
	 * @param  {Array} values Array of values
	 * @return {string}       Concatenated string
	 */
	concat: function(values)
	{
		if(values.length === 1) return values[0];
		else return values.join(' ');
	}
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
		this.options.events = this.options.events || [];
		this.view = options.view;
		this.$element = options.$element;
		this.attr = options.attr;
		this.model = options.model;
		this.parsers = options.parsers;
		this.formatters = options.formatters;
		this.setter = (options.setters instanceof Array && options.setters.length > 0) ? options.setters[0] : null;
		this.getter = (options.getters instanceof Array && options.getters.length > 0) ? options.getters[0] : null;
		this.values = options.values;
		this.valueIndex = options.valueIndex;
		this.params = options.params;
		this.currentValue = null;
		this.bindingIndex = null;
	},

	init: function()
	{
		this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
		this.delegateEvents.call(this, this.options.events);
	},

	destroy: function()
	{
		this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
		this.undelegateEvents.call(this, this.options.events);
		this.currentValue = null;
		this.values[this.valueIndex] = null;
		// this.refresh(); // Vrácení do původního stavu dělá problém s bindingy v kolekcích
	},

	delegateEvents: kff.View.prototype.delegateEvents,

	undelegateEvents: kff.View.prototype.undelegateEvents,

	modelChange: function(event)
	{
		var modelValue;
		if(this.getter && typeof this.model[this.getter] === 'function') modelValue = this.model[this.getter](this.attr);
		else if(event !== true) modelValue = event.changedAttributes[this.attr];
		else modelValue = this.model.get(this.attr);

		if(event === true || !this.compareValues(modelValue, this.currentValue))
		{
			this.values[this.valueIndex] = this.format(modelValue);
			this.currentValue = modelValue;
			this.refresh();
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
		if(this.values.length > 1) return this.values.join(' ');
		else return this.values[this.valueIndex];
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
		if(this.setter && typeof this.model[this.setter] === 'function') this.model[this.setter](this.currentValue);
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.formatters[i].call(this, value[j]);
				value = value2;
			}
			else value = this.formatters[i].call(this, value);
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.parsers[i].call(this, value[j]);
				value = value2;
			}
			value = this.parsers[i].call(this, value);
		}
		return value;
	},

	getBindingIndex: function()
	{
		return this.view.getBindingIndex();
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
		this.value = this.params[0] || null;
		kff.EventBinder._super.init.call(this);
	},

	triggerEvent: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.value);
		}), 0);
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
		if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue() + this.suffix);
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
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':checked'));
		}), 0);
	},

	refresh: function()
	{
		this.$element.prop('checked', !!this.values[this.valueIndex]);
	}
});

kff.BindingView.registerBinder('check', kff.CheckBinder);


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
		kff.ClassBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.className) this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
	},

	matchValue: function()
	{
		if(this.equalsTo) return this.values[this.valueIndex] === this.parse(this.equalsTo);
		else return this.values[this.valueIndex];
	}
});

kff.BindingView.registerBinder('class', kff.ClassBinder);


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
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':focus'));
		}), 0);
	},

	refresh: function()
	{
		if(this.values[this.valueIndex])
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
		this.$element.html(this.values.join(' '));
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
		setTimeout(this.f(function()
		{
			if(this.$element.is(':checked'))
			{
				this.updateModel(this.$element.val());
			}
		}), 0);
	},

	refresh: function()
	{
		this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
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
		this.$element.text(this.values.join(' '));
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
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.val());
		}), 0);
	},

	refresh: function()
	{
		this.$element.val(this.getFormattedValue());
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
			return this.options.defaultView;
		}
		else return null;
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
			lastView.instance.on('init', kff.bindFn(view.instance, 'init'));
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
			if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'destroy'));
			else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
		}

		if(destroyQueue[0]) destroyQueue[0].instance.destroy();
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
		if(this.getLastView()) this.getLastView().instance.on('init', kff.bindFn(this, 'cascadeState'));
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



})(this);
