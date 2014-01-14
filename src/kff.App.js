
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
		options = options || {};
		models = options.models || {};

		// Dependency injection container configuration:
		var config = {
			parameters: {},
			services: {
				'kff.PageView': {
					args: [{
						viewFactory: '@kff.ViewFactory',
						models: '@models'
					}]
				},
				models: {
					construct: models
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
		this.serviceContainer.getService('frontController').init();
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
