
var settings = require('./settings');
var createClass = require('./functions/createClass');
var isPlainObject = require('./functions/isPlainObject');
var evalObjectPath = require('./functions/evalObjectPath');
var mixins = require('./functions/mixins');
var log = require('./functions/log');
var immerge = require('./functions/immerge');
var factoryService = require('./functions/factoryService');
var Service = require('./Service');

var ServiceContainer = createClass(
{
	statics:
	{
		CONFIG_CONSTRUCTOR: 'construct',
		serviceNameRegex: /^[^\s#]*/
	}
},
/** @lends ServiceContainer.prototype */
{
	/**
	 * Simple dependency injection (or service) container class.
	 * @constructs
	 * @param {Object} config Configuration object
	 */
	constructor: function(config, loader)
	{
		this.config = { services: [] };
		if(config)
		{
			if(config.services) this.registerServices(config.services);
			if(config.factories) this.registerFactories(config.factories);
		}
		this.sharedInstances = {};
		this.parent = undefined;
		if(loader) this.loadService = loader;
	},

	/**
	 * Returns instance of service class.
	 * @param {string} service Service name (service config to be found in config.services[service])
	 * @param {Array} argsExtend Array to overload default arguments array (optional)
	 * @returns {Object} Instance of service
	 */
	getService: function(serviceName, argsExtend)
	{
		if(serviceName === '__esModule') return;
		var serviceWrapper = this.loadService(serviceName);


		if(!serviceWrapper || !serviceWrapper.module)
		{
			throw new Error('Service ' + serviceName + ' not defined');
		}
		if(serviceWrapper.config.shared)
		{
			if(typeof this.sharedInstances[serviceName] === 'undefined') this.sharedInstances[serviceName] = this.createService(serviceName, serviceWrapper, argsExtend);
			return this.sharedInstances[serviceName];
		}
		return this.createService(serviceName, serviceWrapper, argsExtend);
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
	createService: function(serviceName, serviceWrapper, argsExtend)
	{
		var serviceConfig, Ctor, Temp, service, i, l, args, argsExtended, calls;

		serviceConfig = serviceWrapper.config;

		Ctor = serviceWrapper.module;

		if(typeof Ctor !== 'function' || serviceConfig.type === 'function') return Ctor;

		args = this.resolveParameters(serviceConfig.args || []);
		if(argsExtend && Array.isArray(argsExtend))
		{
			argsExtended = [];
			for(i = 0, l = argsExtend.length; i < l; i++)
			{
				if(argsExtend[i] !== undefined)
				{
					if(isPlainObject(args[i]) && isPlainObject(argsExtend[i])) argsExtended[i] = mixins({}, args[i], argsExtend[i]);
					else argsExtended[i] = argsExtend[i];
				}
				else argsExtended[i] = args[i];
			}
			args = argsExtended;
		}

		if(serviceConfig.type === 'factory')
		{
			service = Ctor.apply(null, args);
		}
		else
		{
			service = new (Function.prototype.bind.apply(Ctor, [null].concat(args)))();
		}

		calls = serviceConfig.calls;
		if(Array.isArray(calls))
		{
			if(typeof calls[0] === 'string')
			{
				service[calls[0]].apply(service, this.resolveParameters(calls.slice(1)));
			}
			else
			{
				for(i = 0, l = calls.length; i < l; i++)
				{
					service[calls[i][0]].apply(service, this.resolveParameters(calls[i].slice(1)));
				}
			}
		}
		return service;
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
			if(params.indexOf('@@') === 0)
			{
				params = params.slice(2);
				if(params.length === 0) ret = null;
				else ret = this.createServiceFactory(params);
			}
			else if(params.charAt(0) === '@')
			{
				params = params.slice(1);
				if(params.length === 0) ret = this;
				else ret = this.getService(params);
			}
			else
			{
				ret = params;
			}
		}
		else if(Array.isArray(params))
		{
			ret = [];
			for(i = 0, l = params.length; i < l; i++)
			{
				ret[i] = this.resolveParameters(params[i]);
			}
		}
		else if(isPlainObject(params))
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
		if(Array.isArray(services))
		{
			if(overwrite) this.config.services = services.concat(this.config.services);
			else this.config.services = this.config.services.concat(services);
		}
		else
		{
			if(overwrite) this.config.services.unshift(services);
			else this.config.services.push(services);
		}
	},

	registerFactories: function(factories, overwrite)
	{
		if(Array.isArray(factories))
		{
			if(overwrite) this.config.services = factories.map(factoryService).concat(this.config.services);
			else this.config.services = this.config.services.concat(factories.map(factoryService));
		}
		else
		{
			var factoryServices = {};
			for(var factory in factories)
			{
				if(factories[factory] instanceof Service)
				{
					factoryServices[factory] = factories[factory];
				}
				else
				{
					factoryServices[factory] = factoryService(factories[factory]);
				}
			}
			if(overwrite) this.config.services.unshift(factoryServices);
			else this.config.services.push(factoryServices);
		}
	},

	/**
	 * Returns a service (constructor, function or another type of service)
	 * @param  {string}   serviceName Name of service
	 * @return {mixed}                Service constructor or factory or any other type of service
	 */
	loadOwnService: function(serviceName)
	{
		var module, services, config, config2, construct;
		var sameNameModules = [];

		var normalizedServiceName = this.normalizeServiceName(serviceName);
		var container = this;
		var j = 0;

		while(container)
		{
			services = container.config.services;
			if(Array.isArray(services))
			{
				for(var i = 0, l = services.length; i < l; i++)
				{
					module = services[i][normalizedServiceName];
					if(module) sameNameModules.push(module);
				}
			}
			else if(typeof services === 'object' || services !== null)
			{
				module = services[normalizedServiceName];
				sameNameModules.push(module);
			}
			container = container.parent;
		}

		module = sameNameModules.shift();

		j = 0;

		while(module instanceof Service || (isPlainObject(module) && 'construct' in module))
		{
			if(module instanceof Service) config2 = module.config;
			else config2 = module;

			// config = immerge(config, config2);
			config = config2;

			construct = config.construct || serviceName;

			if(typeof construct === 'string')
			{
				if(construct === serviceName)
				{
					module = sameNameModules.shift();
				}
				else
				{
					module = this.loadOwnService(construct);
					if(module !== null) module = module.module;
				}
			}
			else module = construct;
		}

		if(config && module.service)
		{
			config = immerge(module.service, config);
		}

		if(module && (typeof module === 'object' || typeof module === 'function'))
		{
			return {
				module: module,
				config: config || module.service || {}
			};
		}

		return null;
	},

	/**
	 * Returns a service (constructor, function or another type of service)
	 * @param  {string}   serviceName Name of service
	 * @return {mixed}                Service constructor or factory or any other type of service
	 */
	loadService: function(serviceName)
	{
		var module = this.loadOwnService(serviceName);
		if(module) return module;

		if(process.env.NODE_ENV !== 'production') log('Cannot load service module ' + serviceName);

		return null;
	},

	hasOwnService: function(serviceName)
	{
		return !!this.loadOwnService(serviceName);
	},

	hasService: function(serviceName)
	{
		return !!this.loadService(serviceName);
	},

	normalizeServiceName: function(serviceName)
	{
		if(typeof serviceName === 'string')
		{
			var match = serviceName.match(ServiceContainer.serviceNameRegex);
			if(match)
			{
				serviceName = match[0];
			}
		}
		return serviceName;
	},


	/**
	 * Creates a factory function for a service
	 * @param  {string} serviceName Name of the service
	 * @return {function}           Factory function that returns the service
	 */
	createServiceFactory: function(serviceName)
	{
		var container = this;
		return function()
		{
			return container.getService(serviceName);
		};
	},

	setParent: function(parent)
	{
		this.parent = parent;
	}

});

module.exports = ServiceContainer;
