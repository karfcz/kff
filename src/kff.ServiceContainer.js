
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
