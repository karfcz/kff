

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/**
	 * kff.ViewFactory
	 */
	kff.ViewFactory = kff.createClass(
	{
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

			if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName)) view = this.serviceContainer.getService(viewName);
			else
			{
				if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
				else viewClass = viewName;
				if(viewClass) view = new viewClass({ viewFactory: this });
			}
			if(view instanceof kff.View) view.setOptions(options);
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

})(this);
