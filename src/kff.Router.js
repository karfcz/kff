
kff.Router = kff.createClass(
/** @lends kff.Router.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(options)
	{
		this.options = options || {};
		this.routes = [];
		this.params = options.params || null;
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
			if(this.routes[i].match(path, params))
			{
				// if(this.params instanceof kff.Model)
				// {
				// 	var attrs = {};
				// 	var unset = [];
				// 	for(var key in params)
				// 	{
				// 		if(isNaN(parseFloat(key)) && params.hasOwnProperty(key))
				// 		{
				// 			attrs[key] = params[key];
				// 		}
				// 	}
				// 	this.params.each(function(key, val)
				// 	{
				// 		if(!(key in attrs))
				// 		{
				// 			unset.push(key);
				// 		}
				// 	});

				// 	attrs.unnamed = params.slice();

				// 	this.params.unset(unset);
				// 	this.params.set(attrs);
				// }
				return { target: this.routes[i].getTarget(), params: params };
			}
		}
		return null;
	}

});
