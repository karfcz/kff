
import createClass from './functions/createClass';
import Route from './Route';

var Router = createClass(
/** @lends Router.prototype */
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
			this.routes.push(new Route(key, routesConfig[key]));
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
				return { target: this.routes[i].getTarget(), params: params };
			}
		}
		return null;
	}

});

export default Router;
