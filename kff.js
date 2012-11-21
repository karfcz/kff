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
		if(meta.mixins)
		{
			if(!(meta.mixins instanceof Array)) meta.mixins = [meta.mixins];
			for(var i = 0, l = meta.mixins.length; i < l; i++) kff.mixins(properties, meta.mixins[i]);
		}

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

	kff.bindFn = function(obj, fnName)
	{
		if(typeof obj[fnName] !== 'function') throw new TypeError("expected function");
		if(!('boundFns' in obj)) obj.boundFns = {};
		if(fnName in obj.boundFns) return obj.boundFns[fnName];
		else obj.boundFns[fnName] = function(){ return obj[fnName].apply(obj, arguments); };
		return obj.boundFns[fnName];
	};

	kff.isTouchDevice = function()
	{
		return !!('ontouchstart' in window);
	};
	

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
