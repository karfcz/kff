
import mixins from './mixins';
import extend from './extend';
import bindFn from './bindFn';

var classMixin = {
	f: function(fnName, args)
	{
		var obj = this;
		if(typeof fnName === 'string') return bindFn(obj, fnName, args);
		if(typeof fnName === 'function')
		{
			return function()
			{
				if(args) return fnName.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
				else return fnName.apply(obj, arguments);
			};
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
 * * service, args, shared - shorthands for service constructor annotations. These will be included into the
 *   statics.service object
 *
 * @param {Object} meta Object with metadata describing inheritance and static properties of the class
 * @param {Object} properties Properties of a class prototype (or class members)
 * @returns {function} A constructor function (class)
 */
function createClass(meta, properties)
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
	else if(!(meta.mixins instanceof Array)) meta.mixins = [meta.mixins];

	meta.mixins.push(classMixin);

	for(var i = 0, l = meta.mixins.length; i < l; i++) mixins(properties, meta.mixins[i]);

	// Static properties of constructor

	if(meta.statics)
	{
		mixins(constructor, meta.statics);
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
	mixins(constructor.prototype, properties);

	// Set proper constructor
	constructor.prototype.constructor = constructor;

	return constructor;
}

export default createClass;
