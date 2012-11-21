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
	 *  kff.View
	 */
	kff.View = kff.createClass(
	{
		mixins: kff.EventsMixin,
		staticProperties:
		{
			DATA_VIEW_ATTR: 'data-kff-view',
			DATA_OPTIONS_ATTR: 'data-kff-options'
		}
	},
	{
		constructor: function(options)
		{
			options = options || {};
			this.events = new kff.Events();
			this.options = {
				element: null,	
				events: []
			};
			this.setOptions(options);
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
			this.subViews = [];
			return this;
		},
		
		setOptions: function(options)
		{
			options = options || {};
			if(options.events)
			{
				this.options.events = this.options.events.concat(options.events);
				delete options.events;
			}
			if(options.element)
			{
				this.$element = $(options.element);
				delete options.element;	
			}
			$.extend(this.options, options);			
		},

		//     [
		//       ['mousedown, mouseup', '.title', 'edit'],
		//       ['click',  '.button', 'save' ],
		//       ['click', function(e) { ... }]
		//     ]

		delegateEvents: function(events, $element)
		{
			var event, i, l;
			this.undelegateEvents();
			events = events || this.options.events;	
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.on(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.on(event[0], kff.bindFn(this, event[1]));
			}
		},

		undelegateEvents: function(events, $element)
		{
			var event, i, l;
			events = events || this.options.events;	
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.off(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.off(event[0], kff.bindFn(this, event[1]));
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
				viewName, viewClass, subView, options, opt, i, l,
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
							viewName = child.getAttribute(kff.View.DATA_VIEW_ATTR);
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
			
			if(this.$element.get(0)) findViewElements(this.$element.get(0));
			
			// Initialize subviews
			for(i = 0, l = viewNames.length; i < l; i++)
			{
				viewName = viewNames[i].objPath;
				opt = viewNames[i].$element.attr(kff.View.DATA_OPTIONS_ATTR);
				options = opt ? JSON.parse(opt) : {};
				options.element = viewNames[i].$element;
				options.parentView = this;
				subView = this.viewFactory.createView(viewName, options);
				if(subView instanceof kff.View)
				{
					this.subViews.push(subView);
					subView.init();
				}
			}			
		},
		
		destroySubviews: function()
		{
			var subView, i, l;
				
			// Destroy subviews
			for(i = 0, l = this.subViews.length; i < l; i++)
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
			options = options || {};
			options.element = $('body');
			return kff.PageView._super.constructor.call(this, options);
		},

		delegateEvents: function(events, $element)
		{
			kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
		},

		undelegateEvents: function(events, $element)
		{
			kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
		},
		
		setState: function(state, silent)
		{
			if(!silent) this.trigger('setState', state);
		}		
	});
	
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
			
 			while(lastViewCtor = this.getLastView() ? this.getLastView().name : null)
			{
				if(lastViewCtor === sharedViewCtor) break;
				destroyQueue.push(this.popView());
			}
			
			for(i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'destroy'));
				else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
			};

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
				if(i >= this.viewsQueue.length) this.pushView({ name: precedingViewCtors[i], instance: this.viewFactory.createView(precedingViewCtors[i])});
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
