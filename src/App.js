
var createClass = require('./functions/createClass');
var ServiceContainer = require('./ServiceContainer');

var App = createClass(
/** @lends App.prototype */
{
	/**
	 * Convenient class for basic application structure. Contains service
	 * container with preddefined services:
	 *
	 * * ViewFactory
	 * * FrontController
	 * * PageView
	 *
	 * @constructs
	 */
	constructor: function(options)
	{
		var scope, element, require, middlewares, dispatcher;
		this.options = options = options || {};
		scope = options.scope || {};
		element = options.element || null;
		require = options.require || null;
		var modules = options.modules || null;
		this.env = options.env || { document: document, window: window };
		this.dispatcher = null;

		if(this.options.middlewares instanceof Array) middlewares = this.options.middlewares;
		else middlewares = [];

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				'PageView': {
					args: [{
						element: element,
						scope: scope
					}]
				},
				'FrontController': {
					args: [{
						serviceContainer: '@',
						defaultView: 'PageView',
						stateHandler: '@HashStateHandler',
						middlewares: middlewares,
						element: null,
						env: this.env
					}],
					shared: true
				}
			},
			modules: modules
		};

		if(this.options.dispatcher)
		{
			config.services['Dispatcher'] = {
				args: [this.options.dispatcher.actions || {}]
			};

			config.services['FrontController'].args[0].dispatcher = '@Dispatcher';
		}

		this.serviceContainer = new ServiceContainer(config, require);
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
		var frontController = this.frontController = this.serviceContainer.getService('FrontController', [frontControllerOptions]);
		// if(!frontController.getViewFactory()) frontController.setViewFactory(this.serviceContainer.getService('ViewFactory'));
		if(this.options.router)
		{
			var routerOptions = {
				routes: this.options.router.routes || [],
				params: this.options.router.params || null
			};

			if(this.options.router.params) routerOptions.params = this.serviceContainer.resolveParameters(this.options.router.params);

			var router = this.serviceContainer.getService('Router', [routerOptions]);
			frontController.setRouter(router);
		}
		if(this.options.stateHandler)
		{
			frontController.setStateHandler(this.serviceContainer.resolveParameters(this.options.stateHandler));
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
	 * @return {ServiceContainer} service container instance
	 */
	getServiceContainer: function()
	{
		return this.serviceContainer;
	}

});


module.exports = App;