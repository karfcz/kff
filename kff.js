
(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	kff.widgets = {};

	/**
	 * Extends constructor function (class) from parent constructor using prototype inherinatce
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
	 * @param {Object} obj Object to be extended
	 * @param {Object} properties Object by which to extend
	 */
	kff.mixins = function(obj, properties)
	{
		for(var key in properties) if(properties.hasOwnProperty(key)) obj[key] = properties[key];
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


})(this);
