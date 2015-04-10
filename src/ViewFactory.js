
var createClass = require('./functions/createClass');
var mixins = require('./functions/mixins');
var evalObjectPath = require('./functions/evalObjectPath');
var log = require('./functions/log');

var ViewFactory = createClass(
{
	args: [{
		serviceContainer: '@'
	}],
	shared: true
},
/** @lends ViewFactory.prototype */
{
	/**
	 * Factory class for creating views.
	 * This class uses dependency injection container (ServiceContainer)
	 * to lookup and instantiation of views.
	 *
	 * @param  {Object} options Configuration object
	 * @param  {ServiceContainer} options.serviceContainer DI container for instantiation of views
	 * @param  {Object} options.precedingViews Object containing key-value pairs of preceding page views
	 * @constructs
	 */
	constructor: function(options)
	{
		options = options || {};
		this.serviceContainer = options.serviceContainer || null;
		this.precedingViews = options.precedingViews || {};
	},

	/**
	 * Creates a new view instance. Uses the service container when provided.
	 * If not, tries to lookup for a view name in global namespace (treating
	 * viewName as object keypath)
	 *
	 * @param  {String} viewName Name of the view
	 * @param  {Object} options  Options object passed to the view constuctor
	 * @return {View}        Created view
	 */
	createView: function(viewName, options)
	{
		var view = null, viewClass;
		options = options || {};

		if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName))
		{
			view = this.serviceContainer.getService(viewName, [options]);
		}
		else
		{
			if(typeof viewName !== 'function') viewClass = evalObjectPath(viewName);
			else viewClass = viewName;
			if(viewClass) view = new viewClass(mixins({}, options));
			if(view) view.setViewFactory(this);
			else log('Could not create a view "' + viewName + '" (ViewFactory#createView)');
		}
		return view;
	},

	getDefaultViewOptions: function(viewName)
	{
		var viewConfig = this.serviceContainer.getServiceConfigAnnotation(viewName);
		if(typeof viewConfig === 'object' && viewConfig !== null && viewConfig.args instanceof Array) return this.serviceContainer.resolveParameters(viewConfig.args[0]);
		else return null;
	},

	/**
	 * Returns a name of the preceding page view.
	 *
	 * @param  {String} viewName Name of the view
	 * @return {String}          Name of the preceding view
	 */
	getPrecedingView: function(viewName)
	{
		var viewCtor;
		if(typeof viewName === 'string' && this.precedingViews[viewName] !== undefined) return this.precedingViews[viewName];
		else
		{
			viewCtor = this.getServiceConstructor(viewName);
			if(viewCtor && viewCtor.precedingView) return viewCtor.precedingView;
		}
		return null;
	}

});

module.exports = ViewFactory;
