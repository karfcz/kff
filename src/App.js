
var createClass = require('./functions/createClass');
var ServiceContainer = require('./ServiceContainer');
var Service = require('./Service');
var PageView = require('./PageView');
var Dispatcher = require('./Dispatcher');

var App = createClass(
/** @lends App.prototype */
{
	/**
	 * Convenient class for basic application structure. Contains service
	 * container with preddefined services:
	 *
	 * * Dispatcher
	 * * PageView
	 *
	 * @constructs
	 */
	constructor: function(options)
	{
		var scope, element, dispatcher;
		this.options = options = options || {};
		scope = options.scope || {};
		element = options.element || null;
		var modules = options.modules || null;
		this.env = options.env || { document: document, window: window };
		this.dispatcher = null;

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

		var AppPageView = new Service({
			construct: PageView,
			args: [{
				serviceContainer: '@',
				dispatcher: '@AppDispatcher',
				element: element,
				scope: scope,
				env: this.env
			}]
		});

		this.serviceContainer = new ServiceContainer();
		this.serviceContainer.registerServices(options.services);

		this.serviceContainer.registerServices({
			AppPageView: AppPageView,
			AppDispatcher: AppDispatcher
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
		var appPageView = this.serviceContainer.getService('AppPageView');
		appPageView.renderAll();
		appPageView.runAll();
	},

	/**
	 * Destroys the application
	 */
	destroy: function()
	{
		var appPageView = this.serviceContainer.getService('AppPageView');
		appPageView.destroyAll();
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