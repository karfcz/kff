
kff.ViewFactory = kff.createClass(
/** @lends kff.ViewFactory.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		this.serviceContainer = options.serviceContainer || null;
		this.precedingViews = options.precedingViews || {};
	},

	createView: function(viewName, options)
	{
		var view = null, viewClass;
		options = options || {};

		if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName)) view = this.serviceContainer.getService(viewName, [options]);
		else
		{
			if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
			else viewClass = viewName;
			if(viewClass) view = new viewClass(kff.mixins({}, options, { viewFactory: this }));
		}
		return view;
	},

	getServiceConstructor: function(viewName)
	{
		if(typeof viewName === 'function') return viewName;
		if(this.serviceContainer && this.serviceContainer.hasService(viewName)) return this.serviceContainer.getServiceConstructor(viewName);
		else return kff.evalObjectPath(viewName);
	},

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
