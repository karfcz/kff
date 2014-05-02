
kff.App = kff.createClass(
/** @lends kff.App.prototype */
{
	/**
	 * Convenient class for basic application structure. Contains service
	 * container with preddefined services:
	 *
	 * - viewFactory
	 * - frontController
	 * - pageView
	 *
	 * @constructs
	 */
	constructor: function(options)
	{
		var models;
		this.options = options = options || {};
		models = options.models || {};

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				'kff.PageView': {
					args: [{
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

	/**
	 * Initiates application. Gets a 'frontController' service from container
	 * and calls its init method.
	 *
	 * @return {[type]} [description]
	 */
	init: function()
	{
		var frontController = this.serviceContainer.getService('kff.FrontController');
		if(!frontController.getViewFactory()) frontController.setViewFactory(this.serviceContainer.getService('kff.ViewFactory'));
		if(this.options.router)
		{
			var routerOptions = {
				routes: this.options.router.routes || [],
				params: this.options.router.params || null
			};

			if(this.options.router.params) routerOptions.params = this.serviceContainer.resolveParameters(this.options.router.params);

			var router = this.serviceContainer.getService('kff.Router', [routerOptions]);
			frontController.setRouter(router);
		}
		if(this.options.defaultView)
		{
			frontController.setDefaultView(this.options.defaultView);
		}
		frontController.init();
	},

	/**
	 * Returns internal service container instance.
	 *
	 * @return {kff.ServiceContainer} service container instance
	 */
	getServiceContainer: function()
	{
		return this.serviceContainer;
	}

});
