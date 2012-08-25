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
	else kff = (scope.kff = scope.kff || {});

	/**
	 *  kff.View
	 */
	kff.View = kff.createClass(
	{
		mixins: kff.EventsMixin
	},
	{
		constructor: function(options)
		{
			this.events = new kff.Events();
			this.options = {
				element: null,	
				events: []
			};

			if(options.events)
			{
				this.options.events = this.options.events.concat(options.events);
				delete options.events;
			}

			$.extend(this.options, options);
			
			this.$element = $(this.options.element);

			this.subViews = [];
			return this;
		},


		//     [
		//       ['mousedown, mouseup', '.title', 'edit'],
		//       ['click',  '.button', 'save' ],
		//       ['click', function(e) { ... }]
		//     ]

		delegateEvents: function(events)
		{
			var event;
			this.undelegateEvents();
			events = events || this.options.events;	
			
			for(var i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length == 3) this.$element.on(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length == 2) this.$element.on(event[0], kff.bindFn(this, event[1]));
			}
		},

		undelegateEvents: function(events)
		{
			var event;
			events = events || this.options.events;	
			for(var i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length == 3) this.$element.off(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length == 2) this.$element.off(event[0], kff.bindFn(this, event[1]));
			}
		},

		init: function()
		{
			this.render();
		},

		destroy: function(silent)
		{
			this.destroySubviews();
			this.undelegateEvents();
			if(!silent) this.trigger('destroy');
		},

		render: function(silent)
		{
			this.delegateEvents();
			this.renderSubviews();
			if(!silent) this.trigger('init');
		},

		renderSubviews: function()
		{
			var viewNames = [], 
				viewName, viewClass, subView, options, i, l,
				filter = this.options.filter || undefined;
				
			var findViewElements = function(el)
			{
				var j, k, children, child;
				if(el.hasChildNodes())
				{
					children = el.childNodes;
					for(j = 0, k = children.length; j < k; j++)
					{
						child = children[j];
						if(child.getAttribute)
						{
							viewName = child.getAttribute('data-kff-view');
							if(viewName)
							{
								if(!filter || (filter && $(child).is(filter)))
								{
									viewNames.push({ objPath: viewName, $element: $(child) });	
								}						
							}
							else
							{
								findViewElements(child);
							}
						}
					}
				}				
			};

			findViewElements(this.$element.get(0));
			
			// Initialize subviews
			for(i = 0, l = viewNames.length; i < l; i++)
			{
				viewClass = kff.evalObjectPath(viewNames[i].objPath);
				if(viewClass)
				{
					options = viewNames[i].$element.attr('data-kff-options') || {};
					options.element = viewNames[i].$element;
					options.parentView = this;
					subView = new viewClass(options);
					this.subViews.push(subView);
					subView.init();
				}
			}			
		},
		
		destroySubviews: function()
		{
			var subView, i;
				
			// Destroy subviews
			for(i = 0; i < this.subViews.length; i++)
			{				
				subView = this.subViews[i];
				subView.destroy();
				delete this.subViews[i];
			}			
			this.subViews = [];
		},
		
		refresh: function()
		{
		}

	});

	/**
	 * kff.PageView
	 */
	kff.PageView = kff.createClass(
	{
		extend: kff.View,
		staticProperties: 
		{
			precedingView: null
		}
	},
	{
		constructor: function(options)
		{
			options.element = $('body');
			return kff.PageView._super.constructor.call(this, options);
		},
		
		setState: function(state, silent)
		{
			if(!silent) this.trigger('setState');
		},
				
	});
	
	

	kff.FrontController = kff.createClass(
	{
		constructor: function() 
		{
			this.views = null;
			this.viewsQueue = [];
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
				lastView.on('init', kff.bindFn(view, 'init'));
				lastView.on('setState', kff.bindFn(view, 'setState'));
			}
		},

		popView: function()
		{
			if(this.viewsQueue.length == 0) return;

			var removedView = this.viewsQueue.pop();
			var lastView = this.getLastView();
			
			removedView.off('init', kff.bindFn(this, 'cascadeState'));
			if(lastView)
			{
				lastView.off('init', kff.bindFn(removedView, 'init'));
				lastView.off('setState', kff.bindFn(removedView, 'setState'));
			}
			return removedView;
		},

		cascadeState: function()
		{
			if(this.viewsQueue[0])
			{
				this.viewsQueue[0].setState(this.state);
			}
		},

		setState: function(state)
		{
			//console.log('setState');
			this.newViewCtor = this.createViewFromState(state);
			//console.log('newViewCtor: ' + this.newViewCtor );
			var lastViewCtor = this.getLastView() ? this.getLastView().constructor : null;
			var sharedViewCotr = this.findSharedView(this.newViewCtor, lastViewCtor);
			
			var destroyQueue = [];

			do 
			{
				if(lastViewCtor === sharedViewCotr) break;
				destroyQueue.push(this.popView());
			} while(this.getLastView());
			
				
			for(var i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1])
				{
					destroyQueue[i].on('destroy', kff.bindFn(destroyQueue[i + 1], 'destroy'));
				}
				else
				{
					destroyQueue[i].on('destroy', kff.bindFn(this, 'startInit'));
				}
			};

			if(destroyQueue[0]) destroyQueue[0].destroy();
			else this.startInit();
		},

		startInit: function()
		{			
//			console.log('startInit');
			var precedingViewCtors = this.getPrecedingViews(this.newViewCtor);
			
			//console.log('precedingViewCtors: ' + precedingViewCtors);
			// console.log('this.viewsQueue.length: ' + this.viewsQueue.length);
			precedingViewCtors.push(this.newViewCtor);
			for(var i = 0; i < precedingViewCtors.length; i++)
			{
				if(i >= this.viewsQueue.length) this.pushView(new precedingViewCtors[i](this));
			};
			this.newViewCtor = null;
			
//			console.log('this.viewsQueue.length: ' + this.viewsQueue.length);

			if(this.getLastView())
			{
				this.getLastView().on('init', kff.bindFn(this, 'cascadeState'));
			}
//console.log('ControllerQueue: ' + this.viewsQueue);
			if(this.viewsQueue[0])
			{
				this.viewsQueue[0].init();
			}
		},

		findSharedView: function(c1, c2)
		{
			var c1a = this.getPrecedingViews(c1);
			var c2a = this.getPrecedingViews(c2);
			var c = null;
			for(var i = 0, l = c1a.length < c2a.length ? c1a.length : c2a.length; i < l; i++)
			{
				if(c1a[i] != c2a[i]) break;
				c = c1a[i];
			}
			return c;
		},

		getPrecedingViews: function(viewCtor)
		{
			var c = viewCtor, a = [];
			while(c)
			{
				c = c.precedingView || null;
				if(typeof c == 'string') c =  kff.evalObjectPath(c);
				if(c) a.unshift(c);
			}	
			return a;
		}

	});

	
	
})(this);
