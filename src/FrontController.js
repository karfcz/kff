
var createClass = require('./functions/createClass');

// var ViewFactory = require('./ViewFactory');
var ServiceContainer = require('./ServiceContainer');

var FrontController = createClass(
{
	args: [{
		serviceContainer: '@',
		defaultView: 'PageView',
		stateHandler: '@HashStateHandler',
		element: null
	}],
	shared: true
},
/** @lends FrontController.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(options)
	{
		options = options || {};
		this.options = options;
		this.views = null;
		this.viewsQueue = [];
		this.serviceContainer = options.serviceContainer;
		this.defaultView = options.defaultView;
		this.precedingViews = options.precedingViews || {};
		this.router = options.router || null;
		this.rootElement = options.element || null;
		this.stateHandler = options.stateHandler || null;
		this.middlewares = options.middlewares || [];
		this.dispatcher = options.dispatcher || null;
		this.env = options.env || { document: document, window: window };
	},

	/**
	 * Inits front controller
	 */
	init: function()
	{
		if(!this.serviceContainer) this.serviceContainer = new ServiceContainer();
		if(this.router && this.stateHandler)
		{
			this.stateHandler.on('popstate', this.f('setState'));
			this.stateHandler.init();
		}
		else this.setState(null);
	},

	/**
	 * Destroys front controller
	 */
	destroy: function()
	{
		var destroyQueue = [], lastViewName, i;
		while((lastViewName = this.getLastView() ? this.getLastView().name : null) !== null)
		{
			destroyQueue.push(this.popView());
		}

		for(i = 0; i < destroyQueue.length; i++)
		{
			destroyQueue[i].instance.destroyAll();
		}

		this.destroyDone();
	},

	/**
	 * Async callback for destroy method
	 *
	 * @private
	 */
	destroyDone: function()
	{
		if(this.router && this.stateHandler)
		{
			this.stateHandler.off('popstate', this.f('setState'));
			this.stateHandler.destroy();
		}
		// if(this.viewFactory) this.viewFactory = null;
	},

	/**
	 * Constructs view name from state object
	 *
	 * @param  {object} state State object
	 * @return {string}       Name (service name) of the view
	 */
	createViewFromState: function(state)
	{
		var result = null, viewName = this.defaultView;
		if(this.router && this.state)
		{
			var path = state.path;

			if(path === '') path = '#';

			result = this.router.match(path);
			if(result)
			{
				state.params = result.params;
			}
		}
		if(result) viewName = result.target;

		viewName = this.processMiddlewares(viewName, state);

		return viewName;
	},

	/**
	 * Process/transforms view name by middleware functions
	 *
	 * @private
	 * @param  {string} viewName Service name of the view
	 * @param  {object} state    State object
	 * @return {string}          Transformed view name
	 */
	processMiddlewares: function(viewName, state)
	{
		for(var i = 0, l = this.middlewares.length; i < l; i++)
		{
			viewName = this.middlewares[i].call(null, viewName, state);
		}
		return viewName;
	},

	/**
	 * Returns last view metaobject in the views queue
	 *
	 * @private
	 * @return {object} Metaobject with the last view
	 */
	getLastView: function()
	{
		if(this.viewsQueue.length > 0) return this.viewsQueue[this.viewsQueue.length - 1];
		else return null;
	},

	/**
	 * Adds view metaobject to the queue
	 *
	 * @private
	 * @param  {object} view View metaobject
	 */
	pushView: function(view)
	{
		this.viewsQueue.push(view);
	},

	/**
	 * Returns, destroys and removes last view from the queue
	 * @return {object} View metaobject
	 */
	popView: function()
	{
		if(this.viewsQueue.length === 0) return;

		var removedView = this.viewsQueue.pop();

		return removedView;
	},

	cascadeState: function()
	{
		if(this.viewsQueue[0]) this.viewsQueue[0].instance.setState(this.state);
	},

	setState: function(state)
	{
		var destroyQueue = [], lastViewName, sharedViewName, i;

		this.state = state;
		this.newViewName = this.createViewFromState(state);
		lastViewName = this.getLastView() ? this.getLastView().name : null;
		sharedViewName = this.findSharedView(this.newViewName, lastViewName);

		while((lastViewName = this.getLastView() ? this.getLastView().name : null) !== null)
		{
			if(lastViewName === sharedViewName) break;
			destroyQueue.push(this.popView());
		}

		for(i = 0; i < destroyQueue.length; i++)
		{
			destroyQueue[i].instance.destroyAll();
		}

		this.startInit();

		if(this.dispatcher)
		{
			this.dispatcher.trigger({
				type: 'route',
				state: state
			});
		}
	},

	startInit: function()
	{
		var i, l, view, options = {},
			precedingViewNames = this.getPrecedingViews(this.newViewName),
			from = 0;

		if(this.rootElement) options = { element: this.rootElement };
		if(this.dispatcher) options.dispatcher = this.dispatcher;
		options.env = this.env;
		options.serviceContainer = this.serviceContainer;

		for(i = 0, l = precedingViewNames.length; i < l; i++)
		{
			if(i >= this.viewsQueue.length)
			{
				view = this.serviceContainer.createService(precedingViewNames[i], [options]);
				// view.setViewFactory(this.viewFactory);
				this.pushView({ name: precedingViewNames[i], instance: view });
			}
			else from = i + 1;
		}

		this.newViewName = null;

		for(i = from; i < this.viewsQueue.length; i++)
		{
			this.viewsQueue[i].instance.init();
		}
	},

	findSharedView: function(c1, c2)
	{
		var i, l,
			c1a = this.getPrecedingViews(c1),
			c2a = this.getPrecedingViews(c2),
			c = null;

		for(i = 0, l = c1a.length < c2a.length ? c1a.length : c2a.length; i < l; i++)
		{
			if(c1a[i] !== c2a[i]) break;
			c = c1a[i];
		}
		return c;
	},

	getPrecedingViews: function(viewName)
	{
		var c = viewName, a = [c];

		while(c)
		{
			c = this.getPrecedingView(c);
			if(c) a.unshift(c);
		}
		return a;
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
			viewCtor = this.serviceContainer.getServiceConstructor(viewName);
			if(viewCtor && viewCtor.precedingView) return viewCtor.precedingView;
		}
		return null;
	},

	// getViewFactory: function()
	// {
	// 	return this.viewFactory;
	// },

	// setViewFactory: function(viewFactory)
	// {
	// 	this.viewFactory = viewFactory;
	// },

	getRouter: function()
	{
		return this.router;
	},

	setRouter: function(router)
	{
		this.router = router;
	},

	setDefaultView: function(defaultView)
	{
		this.defaultView = defaultView;
	},

	setStateHandler: function(stateHandler)
	{
		this.stateHandler = stateHandler;
	},

	setDispatcher: function(dispatcher)
	{
		this.dispatcher = dispatcher;
	}
});

module.exports = FrontController;
