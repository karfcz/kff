/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	
	/**
	 * kff.FrontController
	 */
	kff.FrontController = kff.createClass(
	{
		constructor: function(options)
		{
			options = options || {};
			this.views = null;
			this.viewsQueue = [];
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
		},

		init: function()
		{

		},

		createViewFromState: function(state)
		{
			return null;
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
				lastView.instance.on('init', kff.bindFn(view.instance, 'init'));
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
			var destroyQueue = [], lastViewCtor, sharedViewCtor, i;
			
			this.state = state;
			this.newViewCtor = this.createViewFromState(state);
			lastViewCtor = this.getLastView() ? this.getLastView().name : null;
			sharedViewCtor = this.findSharedView(this.newViewCtor, lastViewCtor);
			
			while((lastViewCtor = this.getLastView() ? this.getLastView().name : null) !== null)
			{
				if(lastViewCtor === sharedViewCtor) break;
				destroyQueue.push(this.popView());
			}
			
			for(i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'destroy'));
				else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
			}

			if(destroyQueue[0]) destroyQueue[0].instance.destroy();
			else this.startInit();
		},

		startInit: function()
		{			
			var i, l, 
				precedingViewCtors = this.getPrecedingViews(this.newViewCtor), 
				from = 0;
			
			for(i = 0, l = precedingViewCtors.length; i < l; i++)
			{
				if(i >= this.viewsQueue.length) this.pushView({ name: precedingViewCtors[i], instance: this.viewFactory.createView(precedingViewCtors[i], { viewFactory: this.viewFactory })});
				else from = i + 1;
			}
			
			this.newViewCtor = null;			
			if(this.getLastView()) this.getLastView().instance.on('init', kff.bindFn(this, 'cascadeState'));
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

		getPrecedingViews: function(viewCtor)
		{
			var c = viewCtor, a = [c];
			
			while(c)
			{
				c = this.viewFactory.getPrecedingView(c);
				if(c) a.unshift(c);
			}	
			return a;
		}
	});
	
})(this);
