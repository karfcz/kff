
/**
 * Data-attribute name used for view names
 * @constant
 */
kff.DATA_VIEW_ATTR = 'data-kff-view';

/**
 * Data-attribute name used for view options (as JSON serialized object)
 * @constant
 */
kff.DATA_OPTIONS_ATTR = 'data-kff-options';

/**
 * Data-attribute name used for marking of rendered views
 * @constant
 */
kff.DATA_RENDERED_ATTR = 'data-kff-rendered';

/**
 * Data-attribute name used for data-binding
 * @constant
 */
kff.DATA_BIND_ATTR = 'data-kff-bind';

/**
 * Data-attribute name used for event triggers
 * @constant
 */
kff.DATA_TRIGGER_ATTR = 'data-kff-trigger';

/**
 * Data-attribute name used for collection filtering
 * @constant
 */
kff.DATA_FILTER_ATTR = 'data-kff-filter';

/**
 * Data-attribute name used for collection sorting
 * @constant
 */
kff.DATA_SORT_ATTR = 'data-kff-sort';

/**
 * Data-attribute name used forcollection count
 * @constant
 */
kff.DATA_COUNT_ATTR = 'data-kff-count';

kff.debug = false;

(function(){

	if(Object.create)
	{
		kff.createObject = Object.create;
	}
	else
	{
		kff.createObject = function(parent)
		{
			var child, F = function(){};
			F.prototype = parent;
			child = new F();
			return child;
		};
	}

})();

/**
 * Extends constructor function (class) from parent constructor using prototype
 * inherinatce.
 *
 * @public
 * @param {function} child Child class
 * @param {function} parent Parent class
 */
kff.extend = function(child, parent)
{
	child.prototype = kff.createObject(parent.prototype);
	child._super = parent.prototype;
	child.prototype.constructor = child;
};

/**
 * Mixins (using a shallow copy) properties from one object to another.
 * Function accepts multiple arguments with multiple extending objects.
 * The first object will be extended (modified) by the following object(s).
 * When passing true as the last argument, deep copy will be executed (any object ).
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
 * Factory function for creating a class
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

	if(meta.statics)
	{
		kff.mixins(constructor, meta.statics);
	}

	if(meta.service)
	{
		constructor.service = meta.service;
	}

	if(meta.args)
	{
		if(!('service' in constructor)) constructor.service = {};
		constructor.service.args = meta.args;
	}

	if(meta.shared)
	{
		if(!('service' in constructor)) constructor.service = {};
		constructor.service.shared = meta.shared;
	}

	// Add properties to prototype
	kff.mixins(constructor.prototype, properties);

	// Set proper constructor
	constructor.prototype.constructor = constructor;

	return constructor;
};

/**
 * Binds function to an object.
 * Note that it adds a _boundFns property to the object which is an object
 * containing references to the bound methods for caching purposes.
 *
 * @param {Object} obj Object to which bind a function
 * @param {string} fnName Method name to bind
 */
kff.bindFn = function(obj, fnName, args)
{
	if(typeof obj[fnName] !== 'function') throw new TypeError("Expected function: " + fnName + ' (kff.bindFn)');
	if(!('_boundFns' in obj)) obj._boundFns = {};
	if(fnName in obj._boundFns) return obj._boundFns[fnName];
	else
	{
		obj._boundFns[fnName] = function()
		{
			if(args) return obj[fnName].apply(obj, args.concat(Array.prototype.slice.call(arguments)));
			else return obj[fnName].apply(obj, arguments);
		};
	}
	return obj._boundFns[fnName];
};


kff.classMixin = {
	f: function(fnName, args)
	{
		var obj = this;
		if(typeof fnName === 'string') return kff.bindFn(obj, fnName, args);
		if(typeof fnName === 'function')
		{
			return function()
			{
				if(args) return fnName.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
				else return fnName.apply(obj, arguments);
			};
		}
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
	var part, i, l;
	obj = obj || scope;
	if(typeof path === 'string') path = path.split('.');
	if(!(path instanceof Array)) return null;
	for(i = 0, l = path.length; i < l; i++)
	{
		part = path[i];
		if(obj[part] === undefined) return null;
		else obj = obj[part];
	}
	return obj;
};

/**
 * Detects if an object is a plain javascript object (object created as literal
 * or by new Object). Very simple implementation not as robust as the jQuery one
 * but better performing.
 *
 * @param  {mixed}  obj Object to detect
 * @return {Boolean} True if object is a plain object, false otherwise
 */
kff.isPlainObject = function(obj)
{
	return obj !== null && typeof obj === 'object' && obj.constructor === Object;
};


/**
 * Calls a function in the next process cycle with minimal timeout. It is like
 * setTimeout(fn, 0) but with better performance (does not obey the internal
 * browser limits for timeout that exist due to backward compatibility).
 *
 * Fallbacks to setTimeout on older MSIE.
 *
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

kff.arrayIndexOf = function(array, item)
{
	for(var i = 0, l = array.length; i < l; i++)
	{
		if(array[i] === item) return i;
	}
	return -1;
};



kff.modules = {};

kff.define = function(name, deps, factory)
{
	if(!factory && typeof deps === 'function')
	{
		factory = deps;
		deps = [];
	}
	kff.modules[name] = {
		deps: deps,
		factory: factory
	};
};

kff.require = function(serviceName)
{
	if(typeof serviceName === 'string')
	{
		var match = serviceName.match(kff.ServiceContainer.serviceNameRegex);
		if(match)
		{
			serviceName = match[0];
		}

		if(serviceName in kff.modules)
		{
			var deps = [];
			for(var i = 0; i < kff.modules[serviceName].deps.length; i++)
			{
				deps[i] = kff.require(kff.modules[serviceName].deps[i]);
			}

			return kff.modules[serviceName].factory.apply(this, deps);
		}
	}
	return kff.evalObjectPath(serviceName);
};


kff.log = function(message)
{
	if(kff.debug === true && typeof console === 'object') console.log(message);
};
