
var createClass = require('./functions/createClass');
var ServiceContainer = require('./ServiceContainer');
var Service = require('./Service');
var View = require('./View');
var Dispatcher = require('./Dispatcher');

var App = createClass(
/** @lends App.prototype */
{
	/**
	 * Convenient class for basic application structure. Contains service
	 * container with preddefined services:
	 *
	 * * Dispatcher
	 * * View
	 *
	 * @constructs
	 */
	constructor: function(options)
	{
		if(typeof options !== 'object' || options === null) options = {};

		var scope = options.scope || {};
		var modules = options.modules || null;
		var env = options.env || { document: document, window: window };
		var element = options.element || env.document.body;
		var AppDispatcher;

		var actions;

		// Dependency injection container configuration:
		if(options.actions)
		{
			actions = options.actions;
		}
		else if(options.dispatcher && options.dispatcher.actions)
		{
			actions = options.dispatcher.actions
		}

		this.serviceContainer = new ServiceContainer();
		this.serviceContainer.registerServices({
			AppPageView: {
				construct: View,
				args: [{
					serviceContainer: '@',
					dispatcher: '@AppDispatcher',
					element: element,
					scope: scope,
					env: env
				}]
			},
			AppDispatcher: {
				construct: Dispatcher,
				args: [actions || {}],
				shared: true
			}
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