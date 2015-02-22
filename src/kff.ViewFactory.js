
kff.ViewFactory = kff.createClass(
{
	args: [{
		serviceContainer: '@'
	}],
	shared: true
},
/** @lends kff.ViewFactory.prototype */
{
	/**
	 * Factory class for creating views.
	 * This class uses dependency injection container (kff.ServiceContainer)
	 * to lookup and instantiation of views.
	 *
	 * @param  {Object} options Configuration object
	 * @param  {kff.ServiceContainer} options.serviceContainer DI container for instantiation of views
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
	 * @return {kff.View}        Created view
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
			if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
			else viewClass = viewName;
			if(viewClass) view = new viewClass(kff.mixins({}, options));
			if(view) view.setViewFactory(this);
			else kff.log('Could not create a view "' + viewName + '" (kff.ViewFactory#createView)');
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
	 * Returns constructor function of the view. Used only as fallback in the
	 * getPrecedingView method.
	 *
	 * @private
	 * @param  {[type]} viewName [description]
	 * @return {[type]}          [description]
	 */
	getServiceConstructor: function(viewName)
	{
		if(typeof viewName === 'function') return viewName;
		if(this.serviceContainer && this.serviceContainer.hasService(viewName)) return this.serviceContainer.getServiceConstructor(viewName);
		else return kff.evalObjectPath(viewName);
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
