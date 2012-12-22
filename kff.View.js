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
					subView.viewFactory = this.viewFactory;
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
	
})(this);
