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

	kff.Events = kff.createClass(
	{
		constructor: function()
		{
			this.subscribers = {};
			this.oneSubscribers = {};
		},

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
				if(!this.subscribers[eventType]) this.subscribers[eventType] = new kff.LinkedList();
				this.subscribers[eventType].append(fn);
			}
		},

		one: function(eventType, fn)
		{
			if(!(eventType in this.oneSubscribers)) this.oneSubscribers[eventType] = [];
			this.oneSubscribers[eventType].push(fn);
			this.on(eventType, fn);
		},

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
				if(this.subscribers[eventType] instanceof kff.LinkedList) this.subscribers[eventType].removeVal(fn);
			}
		},

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
				if(this.subscribers[eventType] instanceof kff.LinkedList)
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

})(this);

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

	kff.LinkedList = kff.createClass(
	/** @lends kff.LinkedList */
	{
		/**
		 * Class representing a linked list data structure
		 * @constructs
		 */
		constructor: function()
		{
			this.tail = this.head = { next: null };
			this.count = 0;
		},

		/**
		 * Iterates over each item in the list
		 * @param {function} fn function to be called on each item. Takes one argument - the iterated item
		 */
		each: function(fn)
		{
			var node = this.head.next, i = 0;
			while(node)
			{
				if(fn.call(null, node.val, i) === false) break;
				node = node.next;
				i++;
			}
		},

		/**
		 * Appends an item at the end of the list
		 * @param {mixed} val Item to be appended
		 */
		append: function(val)
		{
			var node = { val: val, next: null };
			this.tail.next = node;
			this.tail = node;
			this.count++;
		},

		/**
		 * Removes item from the list
		 * @param {mixed} val Reference to the item to be removed
		 * @returns {mixed} removed item or false if not found
		 */
		removeVal: function(val)
		{
			var node = this.head.next, prev = this.head, ret = false;
			while(node)
			{
				if(node.val === val)
				{
					if(node.next) prev.next = node.next;
					else
					{
						prev.next = null;
						this.tail = prev;
					}
					this.count--;
					ret = true;
				}
				else prev = node;
				node = node.next;
			}
			return ret;
		},

		/**
		 * Removes all items from list
		 */
		empty: function()
		{
			this.tail = this.head = { next: null };
			this.count = 0;
		}

	});

})(this);

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

	kff.Collection = kff.createClass(
	{
		extend: kff.LinkedList,
		mixins: kff.EventsMixin
	},
	/** @lends kff.Collection */
	{
		/**
		 * Class representing collection of models
		 * @constructs
		 * @param {Object} options Options config
		 * @param {function} options.valFactory Factory function for creating new collection items (optional)
		 * @param {function} options.valType Type (class or constructor function) of collection items
		 */
		constructor: function(options)
		{
			options = options || {};
			this.valFactory = options.valFactory || null;
			this.valType = options.valType || kff.Model;
			this.serializeAttrs = options.serializeAttrs || null;
			this.events = new kff.Events();
			kff.LinkedList.call(this);
			return this;
		},

		/**
		 * Appends an item at the end of collection
		 * @param {mixed} val Item to be appended
		 */
		append: function(val)
		{
			kff.Collection._super.append.call(this, val);
			this.trigger('change', { addedValue: val });
		},

		/**
		 * Removes item from collection
		 * @param {mixed} val Reference to the item to be removed
		 * @returns {mixed} removed item or false if not found
		 */
		removeVal: function(val)
		{
			var ret = kff.Collection._super.removeVal.call(this, val);
			if(ret) this.trigger('change', { removedValue: val });
			return ret;
		},

		/**
		 * Creates a JSON representation of collection.
		 *
		 * If item of collection is object, tries to call toJson on it as well.
		 * This function returns plain object, not stringified JSON.
		 * Collection is represented as array in JSON.
		 *
		 * @returns {Array} Array representation of collection
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
		 * Reads collection from JSON (in fact JavaScript array)
		 *
		 * @param {Array} obj Array to read from
		 */
		fromJson: function(obj)
		{
			var val, valFactory = this.valFactory;
			this.empty();
			for(var i = 0; i < obj.length; i++)
			{
				if(valFactory) val = valFactory(obj[i]);
				else val = new this.valType();
				val.fromJson(obj[i]);
				this.append(val);
			}
			this.trigger('change', { fromJson: true });
		},

		/**
		 * Search in collection for model with given attribute value
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

		findByIndex: function(index)
		{
			var ret = null, i = 0;
			this.each(function(val)
			{
				if(i === index)
				{
					ret = val;
					return false;
				}
				i++;
			});
			return ret;
		},

		/**
		 * Removes all items from collection
		 */
		empty: function()
		{
			kff.Collection._super.empty.call(this);
			this.trigger('change');
		},

		/**
		 * Sorts collection using a compare function
		 *
		 * Comapre function follows the same specification as in standard Array.sort function
		 *
		 * @param {function} compareFunction Compare function
		 */
		sort: function(compareFunction)
		{
			var arr = [], az, bz;
			this.each(function(item)
			{
				arr.push(item);
			});
			arr.sort(compareFunction);
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		},

		/**
		 * Creates clone of the collection. Clone is shallow copy (objects in collections are not cloned)
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
		 * Randomizes order of items in collection
		 */
		shuffle: function()
		{
			var arr = [], az, bz, len, i, p, t;
			this.each(function(item)
			{
				arr.push(item);
			});

			len = arr.length, i = len;
			while(i--)
			{
				p = parseInt(Math.random()*len, 10);
				t = arr[i];
				arr[i] = arr[p];
				arr[p] = t;
			}
			this.empty();
			for(i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		}

	});

})(this);

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

	kff.Model = kff.createClass(
	{
		mixins: kff.EventsMixin
	},
	/** @lends kff.Model */
	{
		/**
		 * Class representing a model
		 * @constructs
		 */
		constructor: function()
		{
			this.events = new kff.Events();
			this.attrs = {};
		},

		/**
		 * Checks if the model has given attribute
		 * @param {string} attr Attribute name
		 * @returns {boolean} True if found, false otherwise
		 */
		has: function(attr)
		{
			return attr in this.attrs;
		},

		/**
		 * Returns value of given attribute
		 * @param {string} attr Attribute name
		 * @returns {mixed} Attribute value
		 */
		get: function(attr)
		{
			return this.attrs[attr];
		},

		/**
		 * Returns value of given attribute using deep lookup (object.attribute.some.value)
		 * @param {string} attrPath Attribute path
		 * @returns {mixed} Attribute value
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
		 * Sets value of given attribute.
		 *
		 * Triggers change event.
		 *
		 * @param {string} attr Attribute name
		 * @param {mixed} value Attribute value
		 */
		set: function(attr, value, options)
		{
			var changed = {};

			if(typeof attr === 'string')
			{
				if(this.get(attr) === value) return;
				changed[attr] = value;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				this.attrs[attr] = value;
			}
			else if(attr === Object(attr))
			{
				options = value;
				changed = attr;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				for(var key in changed) this.attrs[key] = changed[key];
			}

			for(var changedAttr in changed)
			{
				this.trigger('change:' + changedAttr, { changedAttributes: changed });
			}
			this.trigger('change', { changedAttributes: changed });
		},

		/**
		 * Creates a JSON representation of model attributes.
		 *
		 * If an attribute is type of Object, tries to call toJson on it too.
		 * This function returns plain object, not stringified JSON.
		 *
		 * @param {Array.<string>} serializeAttrs If used, only these attributes will be exported
		 * @returns {Object} Plain JavaScript object representation of attributes
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
		 * Reads model's attributes from plain JavaScript object
		 *
		 * If an attribute is type of Object, tries to read appropriate property using its fromJson method.
		 * This function returns plain object, not stringified JSON.
		 *
		 * @param {Object} obj Plain object to read from
		 */
		fromJson: function(obj)
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
			this.set(this.attrs);
		}

	});

})(this);

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

	kff.ServiceContainer = kff.createClass(
	{
		staticProperties:
		{
			singleParamRegex: /^%[^%]+%$/g,
			multipleParamsRegex: /%([^%]+)%/g
		}
	},
	/** @lends kff.ServiceContainer */
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
		 * @returns {Object} Instance of service
		 */		
		getService: function(service)
		{
			if(!this.config.services[service]) throw('Service ' + service + ' not defined');
			if(this.config.services[service].shared)
			{
				if(typeof this.services[service] === 'undefined') this.services[service] = this.createService(service);
				return this.services[service];
			}
			return this.createService(service);
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
		 * Creates instance of service
		 * @param {string} serviceName Name of service to be instantiated
		 * @returns {Object} Instance of service
		 */		
		createService: function(serviceName)
		{
			var serviceConfig, Ctor, Temp, service, ret, i, l, calls;
			
			serviceConfig = this.config.services[serviceName];
			
			Ctor = this.getServiceConstructor(serviceName);			
			Temp = function(){};			
			Temp.prototype = Ctor.prototype;
			service = new Temp();
			ret = Ctor.apply(service, this.resolveParameters(serviceConfig.args || []));	
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
			else if(typeof params !== 'function' && Object(params) === params)
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

})(this);

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

	/**
	 *  kff.View
	 */
	kff.View = kff.createClass(
	{
		mixins: kff.EventsMixin,
		staticProperties:
		{
			DATA_VIEW_ATTR: 'data-kff-view',
			DATA_OPTIONS_ATTR: 'data-kff-options',
			DATA_RENDERED_ATTR: 'data-kff-rendered',
			DATA_BIND_ATTR: 'data-kff-bind'
		}
	},
	{
		constructor: function(options)
		{
			options = options || {};
			this.events = new kff.Events();
			this.options = {
				element: null,
				models: null,
				events: []
			};
			this.models = {};
			this.setOptions(options);
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
			this.subViews = [];
			return this;
		},

		setOptions: function(options)
		{
			options = options || {};
			if(options.events)
			{
				this.options.events = this.options.events.concat(options.events);
				delete options.events;
			}
			if(options.element)
			{
				this.$element = $(options.element);
				delete options.element;
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
				delete options.models;
			}
			$.extend(this.options, options);
		},

		getModel: function(modelPath)
		{
			var model;
			if(typeof modelPath === 'string') modelPath = modelPath.split('.');

			model = modelPath.shift();

			if(this.models && model in this.models)
			{
				if(modelPath.length > 0) return this.models[model].mget(modelPath);
				else return this.models[model];
			}
			if(this.options.parentView)
			{
				modelPath.unshift(model);
				return this.options.parentView.getModel(modelPath);
			}
			return null;
		},

		//     [
		//       ['mousedown, mouseup', '.title', 'edit'],
		//       ['click',  '.button', 'save' ],
		//       ['click', function(e) { ... }]
		//     ]

		delegateEvents: function(events, $element)
		{
			var event, i, l;
			this.undelegateEvents();
			events = events || this.options.events;
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.on(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.on(event[0], kff.bindFn(this, event[1]));
			}
		},

		undelegateEvents: function(events, $element)
		{
			var event, i, l;
			events = events || this.options.events;
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.off(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.off(event[0], kff.bindFn(this, event[1]));
			}
		},

		addEvents: function(events)
		{
			this.options.events = this.options.events.concat(events);
		},

		init: function()
		{
			this.render();
		},

		destroy: function(silent)
		{
			this.destroySubviews();
			this.undelegateEvents();
			if(!silent) this.trigger('destroy');
		},

		render: function(silent)
		{
			this.delegateEvents();
			this.renderSubviews();
			if(!silent) this.trigger('init');
		},

		renderSubviews: function()
		{
			var viewNames = [],
				viewName, viewClass, subView, options, opt, i, l, rendered,
				filter = this.options.filter || undefined;

			var findViewElements = function(el)
			{
				var j, k, children, child;
				if(el.hasChildNodes())
				{
					children = el.childNodes;
					for(j = 0, k = children.length; j < k; j++)
					{
						child = children[j];
						if(child.getAttribute)
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
									findViewElements(child);
								}
							}
						}
					}
				}
			};

			if(this.$element.get(0)) findViewElements(this.$element.get(0));

			// Initialize subviews
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
					viewNames[i].$element.attr(kff.View.DATA_RENDERED_ATTR, true);
				}
			}
		},

		destroySubviews: function()
		{
			var subView, i, l;

			// Destroy subviews
			for(i = 0, l = this.subViews.length; i < l; i++)
			{
				subView = this.subViews[i];
				if(subView.$element) subView.$element.removeAttr(kff.View.DATA_RENDERED_ATTR);
				subView.destroy();
				delete this.subViews[i];
			}
			this.subViews = [];
		},

		refresh: function()
		{
		}

	});

})(this);

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

	/**
	 * kff.PageView
	 */
	kff.PageView = kff.createClass(
	{
		extend: kff.View,
		staticProperties:
		{
			precedingView: null
		}
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.element = $('body');
			return kff.View.call(this, options);
		},

		delegateEvents: function(events, $element)
		{
			kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
		},

		undelegateEvents: function(events, $element)
		{
			kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
		},

		setState: function(state, silent)
		{
			if(!silent) this.trigger('setState', state);
		}
	});

})(this);

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	/**
	 * kff.BindingView
	 */

	kff.BindingView = kff.createClass(
	{
		extend: kff.View,
		staticProperties:
		{
			binders: {}
		}
	},
	{
		constructor: function(options)
		{
			options = options || {};
			this.modelBinders = {};
			this.collectionBinder = null;

			this.values = {};
			this.formatters = [];
			this.parsers = [];

			kff.View.call(this, options);
		},

		render: function(silent)
		{
			this.initBinding();
			if(this.collectionBinder) this.renderBoundViews();
			kff.BindingView._super.render.call(this, silent);
			this.modelChange();
		},

		modelChange: function()
		{
			for(var b in this.modelBinders)
			{
				for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].modelChange();
			}
		},

		destroy: function(silent)
		{
			this.destroyBinding();
			kff.BindingView._super.destroy.call(this, true);
			this.destroyBoundViews();
			if(!silent) this.trigger('destroy');
		},

		initBinding: function()
		{
			var model, attr, result, subresults, name, binderName, binderParams, formatters, parsers;
			var modifierName, modifierParams;
			var dataBind = this.$element.attr(kff.View.DATA_BIND_ATTR);

			var regex = /([.a-zA-Z0-9]+):?([a-zA-Z0-9]+)?(\([^\(\))]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?/g;

			this.modelBinders = [];

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

				for(var i = 4, l = result.length; i < l && result[i]; i++)
				{
					subresults = result[i].match(/([a-zA-Z0-9]+)\(([^,\(\)]*)\)/);

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
					}
				}

				model = this.getModel([].concat(name));

				if(model instanceof kff.Collection)
				{
					if(!this.options.isBoundView)
					{
						this.collectionBinder = {
						//	attr: null,
							collection: model
						};
						this.renderSubViews = function(){};
					}
				}
				else
				{
					if(!binderName) break;

					attr = name.pop();
					model = this.getModel(name);

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
							bindingIndex: this.options.bindingIndex,
							valueIndex: valueIndex,
							values: this.values[binderName],
							params: binderParams,
							attr: attr,
							model: model,
							formatters: formatters,
							parsers: parsers
						});

						this.modelBinders[binderName].push(modelBinder);
						this.values[binderName].push(null);

						modelBinder.init();
					}
				}
			}
		},

		parseModifiers: function(modifierParams, modifiers)
		{
			for(var j = 0; j < modifierParams.length; j++)
			{
				if(kff.View.helpers[modifierParams[j]]) modifiers.push(kff.View.helpers[modifierParams[j]]);
			}
		},

		destroyBinding: function()
		{
			for(var b in this.modelBinders)
			{
				for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].destroy();
			}
			this.modelBinders = {};
			this.values = {};
		},

		renderBoundViews: function()
		{
			var anchor = document.createTextNode('');
			if($.browser && $.browser.msie && $.browser.version < 9) anchor = $('<span/>');
			this.$anchor = $(anchor);
			this.$element.before(this.$anchor);
			this.$element.detach();

			// Subview options:
			this.subViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
			var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

			this.subViewOptions = opt ? JSON.parse(opt) : {};
			this.subViewOptions.parentView = this;

			this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));

			this.refreshBoundViews();
		},

		destroyBoundViews: function()
		{
			if(this.$elements) this.$elements.remove();
			this.$elements = null;
			if(this.$anchor)
			{
				this.$anchor.after(this.$element);
				this.$anchor.remove();
			}
		},

		refreshBoundViews: function()
		{
			this.destroySubviews();
			if(this.$elements) this.$elements.remove();
			this.$elements = $([]);

			this.collectionBinder.collection.each(this.f(function(item, i)
			{
				this.$elements = this.$elements.add(this.createSubView(item, i));
			}));

			this.$anchor.after(this.$elements);
		},

		createSubView: function(item, i)
		{
			var $element = this.$element.clone();

			this.subViewOptions.element = $element;
			this.subViewOptions.models = { '*': item };
			this.subViewOptions.bindingIndex = i;
			this.subViewOptions.isBoundView = true;
			var subView = this.viewFactory.createView(this.subViewName, this.subViewOptions);
			if(subView instanceof kff.View)
			{
				subView.viewFactory = this.viewFactory;
				this.subViews.push(subView);
				subView.init();
				$element.attr(kff.View.DATA_RENDERED_ATTR, true);
				subView.refresh();
			}
			return $element;
		},

		getModel: function(modelPath)
		{
			var modelIndex;
			if(typeof modelPath === 'string') modelPath = modelPath.split('.');

			modelIndex = parseInt(modelPath[0]);

			if(this.collectionBinder && !isNaN(modelIndex)) return this.collectionBinder.collection.findByIndex(modelIndex);

			return kff.BindingView._super.getModel.call(this, modelPath);
		},

		concat: function(values)
		{
			if(values.length === 1) return values[0];
			else return values.join(' ');
		}
	});



	kff.Binder = kff.createClass(
	{
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
			this.values = options.values;
			this.valueIndex = options.valueIndex;
			this.params = options.params;
			this.currentValue = null;
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
		},

		delegateEvents: kff.View.prototype.delegateEvents,

		undelegateEvents: kff.View.prototype.undelegateEvents,

		modelChange: function()
		{
			var modelValue = this.model.get(this.attr);

			if(!this.compareValues(modelValue, this.currentValue))
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
			this.model.set(this.attr, this.currentValue);
		},

		refresh: function(value){},

		format: function(value)
		{
			for(var i = 0, l = this.formatters.length; i < l; i++)
			{
				value = this.formatters[i].call(this, value);
			}
			return value;
		},

		parse: function(value)
		{
			for(var i = 0, l = this.parsers.length; i < l; i++)
			{
				value = this.parsers[i].call(this, value);
			}
			return value;
		}

	});



	/**
	 * kff.ValueBinder
	 */

	kff.ValueBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['keydown drop change', 'inputChange']
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

	/**
	 * kff.CheckBinder
	 */

	kff.CheckBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click change', 'inputChange']
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

	/**
	 * kff.RadioBinder
	 */

	kff.RadioBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click', 'inputChange']
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


	/**
	 * kff.TextBinder
	 */

	kff.TextBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			kff.TextBinder._super.init.call(this);
		},

		refresh: function(value)
		{
			this.$element.text(this.values.join(' '));
		}
	});


	/**
	 * kff.HtmlBinder
	 */

	kff.HtmlBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		refresh: function()
		{
			this.$element.html(this.values.join(' '));
		}
	});


	/**
	 * kff.ClassBinder
	 */

	kff.ClassBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			this.className = this.params[0] || null;
			kff.ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className) this.$element[this.values[this.valueIndex] ? 'addClass' : 'removeClass'](this.className);
		}
	});

	/**
	 * kff.AttrBinder
	 */

	kff.AttrBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			this.attribute = this.params[0] || null;
			this.prefix = this.params[1] || null;
			// this.prefix = this.$element.attr('data-kff-prefix') || '';
			kff.AttrBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue());
		}
	});


	/**
	 * kff.TemplateView
	 */

	// kff.TemplateView = kff.createClass(
	// {
	// 	extend: kff.Binder
	// },
	// {
	// 	refresh: function(value)
	// 	{
	// 		thit.destroySubViews();
	// 		if(this.options.template && this.models['*'])
	// 		{
	// 			this.$element.html(this.options.template(this.models['*'].toJson()));
	// 		}
	// 	}
	// });

	kff.View.helpers =
	{
		'index': function(v)
		{
			if(this.options && this.options.bindingIndex) return this.options.bindingIndex;
			return v;
		},

		'not': function(v)
		{
			return !v;
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

		'boolean': function(v)
		{
			var parsed = parseInt(v);
			if(!isNaN(parsed)) return !!parsed;
			return v === 'true';
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
	};


	kff.BindingView.binders.text = kff.TextBinder;
	kff.BindingView.binders['class'] = kff.ClassBinder;
	kff.BindingView.binders.val = kff.ValueBinder;
	kff.BindingView.binders.check = kff.CheckBinder;
	kff.BindingView.binders.radio = kff.RadioBinder;
	kff.BindingView.binders.html = kff.HtmlBinder;
	kff.BindingView.binders.attr = kff.AttrBinder;


})(this);
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

	/**
	 * kff.ViewFactory
	 */
	kff.ViewFactory = kff.createClass(
	{
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

			if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName)) view = this.serviceContainer.getService(viewName);
			else
			{
				if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
				else viewClass = viewName;
				if(viewClass) view = new viewClass({ viewFactory: this });
			}
			if(view instanceof kff.View) view.setOptions(options);
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

})(this);

/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 *
 *  Parts of kff.Router code from https://github.com/visionmedia/page.js
 *  Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	kff.Route = kff.createClass(
	/** @lends kff.Route */
	{
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

})(this);

/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 *
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	kff.Router = kff.createClass(
	/** @lends kff.Router */
	{
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

})(this);

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

	/**
	 * kff.FrontController
	 */
	kff.FrontController = kff.createClass(
	{
		constructor: function(options)
		{
			options = options || {};
			this.options = options;
			this.views = null;
			this.viewsQueue = [];
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
		},

		init: function()
		{

		},

		createViewFromState: function(state)
		{
			return null;
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
