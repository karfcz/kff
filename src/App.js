
var createClass = require('./functions/createClass');
var ServiceContainer = require('./ServiceContainer');
var Service = require('./Service');
var HashStateHandler = require('./HashStateHandler');
var PageView = require('./PageView');
var FrontController = require('./FrontController');
var Dispatcher = require('./Dispatcher');
var Router = require('./Router');

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

		var AppDispatcher;

		// Dependency injection container configuration:
		if(this.options.dispatcher)
		{
			AppDispatcher = new Service({
				construct: Dispatcher,
				args: [this.options.dispatcher.actions || {}],
				shared: true
			});
		}

		var AppHashStateHandler = new Service({
			construct: HashStateHandler,
			shared: true
		});

		var AppPageView = new Service({
			construct: PageView,
			args: [{
				serviceContainer: '@',
				element: element,
				scope: scope,
				env: this.env
			}]
		});

		var AppRouter = new Service({
			construct: Router,
			shared: true
		});

		var AppFrontController = new Service({
			construct: FrontController,
			args: [{
				serviceContainer: '@',
				defaultView: 'AppPageView',
				stateHandler: '@AppHashStateHandler',
				dispatcher: AppDispatcher ? '@AppDispatcher' : undefined,
				middlewares: middlewares,
				element: null,
				env: this.env
			}],
			shared: true
		});

		this.serviceContainer = new ServiceContainer();

		this.serviceContainer.registerServices(options.services);


		this.serviceContainer.registerServices({
			AppPageView: AppPageView,
			AppFrontController: AppFrontController,
			AppDispatcher: AppDispatcher,
			AppHashStateHandler: AppHashStateHandler,
			AppRouter: AppRouter
		});

		if('services' in options) this.serviceContainer.registerServices(options.services);

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
		var frontController = this.frontController = this.serviceContainer.getService('AppFrontController', [frontControllerOptions]);
		if(this.options.router)
		{
			var routerOptions = {
				routes: this.options.router.routes || [],
				params: this.options.router.params || null
			};

			if(this.options.router.params) routerOptions.params = this.serviceContainer.resolveParameters(this.options.router.params);

			var router = this.serviceContainer.getService('AppRouter', [routerOptions]);
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