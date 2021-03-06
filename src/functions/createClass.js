
import mixins from './mixins.js';
import extend from './extend.js';
import bindFn from './bindFn.js';

var classMixin = {
	f: function(fnName, args)
	{
		if(typeof fnName === 'string') return bindFn(this, fnName, args);
		if(typeof fnName === 'function')
		{
			return Function.prototype.bind.apply(fnName, args ? [this].concat(args) : [this]);
		}
		throw new TypeError("Expected function: " + fnName + ' (f)');
	}
};


/**
 * Factory function for creating a class
 *
 * The first "meta" parameter must be an object with the following optional properties:
 * * extend - reference to base class to be extended
 * * statics - object with static properties of the class. These properties will be set directly to the constructor
 *   function
 *
 * @param {Object} meta Object with metadata describing inheritance and static properties of the class
 * @param {Object} properties Properties of a class prototype (or class members)
 * @returns {function} A constructor function (class)
 */
export default function createClass(meta, properties)
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
	if(meta.extend) extend(constructor, meta.extend);

	// Concatenate properties from properties objects and mixin objects
	if(!('mixins' in meta))
	{
		meta.mixins = [];
	}
	else if(!Array.isArray(meta.mixins)) meta.mixins = [meta.mixins];

	meta.mixins.push(classMixin);

	for(var i = 0, l = meta.mixins.length; i < l; i++) mixins(properties, meta.mixins[i]);

	// Static properties of constructor
	if(meta.statics)
	{
		mixins(constructor, meta.statics);
	}

	// Add properties to prototype
	mixins(constructor.prototype, properties);

	// Set proper constructor
	constructor.prototype.constructor = constructor;

	return constructor;
}
