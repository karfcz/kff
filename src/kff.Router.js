
kff.Router = kff.createClass(
/** @lends kff.Router.prototype */
{
	/**
		@constructs
	*/
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
