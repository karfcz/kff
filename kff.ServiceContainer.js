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
	 *  kff.ServiceContainer
	 *
	 */
	kff.ServiceContainer = kff.createClass(
	{
		staticProperties:
		{
			singleParamRegex: /^%[^%]+%$/g,
			multipleParamsRegex: /%([^%]+)%/g
		}
	},
	{
		constructor: function(config)
		{
			this.config = config || { parameters: {}, services: {} };
			this.services = {};
			this.cachedParams = {};
		},
		
		getService: function(service)
		{
			if(!this.config.services[service]) throw('Service ' + service + ' not defined');
			if(this.config.services[service].shared)
			{
				if(typeof this.services[service] === 'undefined') this.services[service] = this.createService(service);;
				return this.services[service];
			}
			return this.createService(service);
		},
		
		hasService: function(serviceName)
		{
			return this.config.services.hasOwnProperty(serviceName);
		},
		
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
		
		getServiceConstructor: function(serviceName)
		{
			var serviceConfig;
			serviceConfig = this.config.services[serviceName];
			if(!serviceConfig) return null;
			if(typeof serviceConfig.constructor !== 'function') serviceConfig.constructor = kff.evalObjectPath(serviceConfig.constructor);	
			return serviceConfig.constructor;
		},
		
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
