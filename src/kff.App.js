
kff.App = kff.createClass(
/** @lends kff.App.prototype */
{
	/**
	 * Convenient class for basic application structure. Contains service
	 * container with preddefined services:
	 *
	 * * kff.ViewFactory
	 * * kff.FrontController
	 * * kff.PageView
	 *
	 * @constructs
	 */
	constructor: function(options)
	{
		var models, helpers, element, require, middlewares, dispatcher;
		this.options = options = options || {};
		models = options.models || {};
		helpers = options.helpers || {};
		element = options.element || null;
		require = options.require || kff.require;
		this.env = options.env || { document: document, window: window };
		this.dispatcher = null;

		if(this.options.middlewares instanceof Array) middlewares = this.options.middlewares;
		else middlewares = [];

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				'kff.PageView': {
					args: [{
						element: element,
						models: models,
						helpers: helpers
					}]
				},
				'kff.FrontController': {
					args: [{
						viewFactory: '@kff.ViewFactory',
						defaultView: 'kff.PageView',
						stateHandler: '@kff.HashStateHandler',
						middlewares: middlewares,
						element: null,
						env: this.env
					}],
					shared: true
				}
			}
		};

		this.serviceContainer = new kff.ServiceContainer(config, require);
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
		var frontControllerOptions = { element: this.options.element };
		var frontController = this.frontController = this.serviceContainer.getService('kff.FrontController', [frontControllerOptions]);
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
		if(this.options.stateHandler)
		{
			frontController.setStateHandler(this.serviceContainer.resolveParameters(this.options.stateHandler));
		}
		if(this.options.dispatcher)
		{
			var dispatcher = this.serviceContainer.resolveParameters(this.options.dispatcher);
			if(dispatcher && typeof dispatcher.registerActions === 'function')
			{
				if(this.options.actions) dispatcher.registerActions(this.options.actions);
				frontController.setDispatcher(dispatcher);
			}
		}
		if(this.options.defaultView)
		{
			frontController.setDefaultView(this.options.defaultView);
		}
		frontController.init();
	},

	/**
	 * Destroys the application
	 */
	destroy: function()
	{
		if(this.frontController) this.frontController.destroy();
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
