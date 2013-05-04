
kff.FrontController = kff.createClass(
/** @lends kff.FrontController.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		this.options = options;
		this.views = null;
		this.viewsQueue = [];
		this.viewFactory = options.viewFactory || new kff.ViewFactory();
		this.router = options.router || null;
	},

	init: function()
	{
		if(this.router) $(window).bind('hashchange', this.f('hashChange')).trigger('hashchange');
		else this.setState(null);
	},

	createViewFromState: function(state)
	{
		if(this.router)
		{
			var path = state.path;
			var result;

			if(path === '') path = '#';

			result = this.router.match(path);
			if(result)
			{
				state.params = result.params;
				return result.target;
			}
		}
		return this.options.defaultView;
	},

	hashChange: function(event)
	{
		var hash = location.hash;
		if(hash.indexOf('#') !== 0 && hash != '') return false;

		this.setState({ path: hash, params: {} });
		return false;
	},

	getLastView: function()
	{
		if(this.viewsQueue.length > 0) return this.viewsQueue[this.viewsQueue.length - 1];
		else return null;
	},

	pushView: function(view)
	{
		var lastView = this.getLastView();
		this.viewsQueue.push(view);
		if(lastView)
		{
			lastView.instance.on('render', kff.bindFn(view.instance, 'init'));
			lastView.instance.on('setState', kff.bindFn(view.instance, 'setState'));
		}
	},

	popView: function()
	{
		if(this.viewsQueue.length === 0) return;

		var removedView = this.viewsQueue.pop(),
			lastView = this.getLastView();

		removedView.instance.off('init', kff.bindFn(this, 'cascadeState'));
		if(lastView)
		{
			lastView.instance.off('init', kff.bindFn(removedView.instance, 'init'));
			lastView.instance.off('setState', kff.bindFn(removedView.instance, 'setState'));
		}
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
			if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'startDestroy'));
			else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
		}

		if(destroyQueue[0]) destroyQueue[0].instance.startDestroy();
		else this.startInit();
	},

	startInit: function()
	{
		var i, l,
			precedingViewNames = this.getPrecedingViews(this.newViewName),
			from = 0;

		for(i = 0, l = precedingViewNames.length; i < l; i++)
		{
			if(i >= this.viewsQueue.length) this.pushView({ name: precedingViewNames[i], instance: this.viewFactory.createView(precedingViewNames[i], { viewFactory: this.viewFactory })});
			else from = i + 1;
		}

		this.newViewName = null;
		if(this.getLastView()) this.getLastView().instance.on('render', kff.bindFn(this, 'cascadeState'));
		if(this.viewsQueue[from]) this.viewsQueue[from].instance.init();
		else this.cascadeState();
	},

	findSharedView: function(c1, c2)
	{
		var i,
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
			c = this.viewFactory.getPrecedingView(c);
			if(c) a.unshift(c);
		}
		return a;
	}
});
