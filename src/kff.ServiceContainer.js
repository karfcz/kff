
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
