
kff.App = kff.createClass(
/** @lends kff.App.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		var models;
		options = options || {};
		models = options.models || {};

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				viewFactory: {
					construct: 'kff.ViewFactory',
					args: [{
						serviceContainer: '@'
					}],
					shared: true
				},
				frontController: {
					construct: 'kff.FrontController',
				    args: [{
				    	viewFactory: '@viewFactory',
				    	defaultView: 'pageView'
				    }],
				    shared: true
				},
				pageView: {
					construct: 'kff.PageView',
					args: [{
				    	viewFactory: '@viewFactory',
				    	models: models
				    }]
				}
			}
		};

		this.serviceContainer = new kff.ServiceContainer(config);
		if('parameters' in options) this.serviceContainer.registerParameters(options.parameters, true);
		if('services' in options) this.serviceContainer.registerServices(options.services, true);

		return this;
	},

	init: function()
	{
		this.serviceContainer.getService('frontController').init();
	},

	getServiceContainer: function()
	{
		return this.serviceContainer;
	}

});
