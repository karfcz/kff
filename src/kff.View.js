
kff.View = kff.createClass(
{
	mixins: kff.EventsMixin,

	staticProperties:
	/** @lends kff.View */
	{
		/**
			Data-attribute name used for view names
			@constant
		*/
		DATA_VIEW_ATTR: 'data-kff-view',

		/**
			Data-attribute name used for view options (as JSON serialized object)
			@constant
		*/
		DATA_OPTIONS_ATTR: 'data-kff-options',

		/**
			Data-attribute name used for marking of rendered views
			@constant
		*/
		DATA_RENDERED_ATTR: 'data-kff-rendered',

		/**
			Data-attribute name used for data-binding
			@constant
		*/
		DATA_BIND_ATTR: 'data-kff-bind'
	}
},
/** @lends kff.View.prototype */
{
	/**
		Base class for views

		@constructs
		@param {Object} options Options object
		@param {DOM Element|jQuery} options.element A DOM element that will be a root element of the view
		@param {Array} options.models Array of model instances to be used by the view
	 */
	constructor: function(options)
	{
		options = options || {};
		this.events = new kff.Events();
		this.options = {
			element: null,
			models: null,
			events: []
		};
		this.models = {};
		this.setOptions(options);
		this.viewFactory = options.viewFactory || new kff.ViewFactory();
		this.subViews = [];
		return this;
	},

	/**
		Sets internal options

		@private
		@param {Object} options Options object
		@param {Array} options.events Array of event bindings
		@param {kff.ViewFactory} options.viewFactory An instance of kff.ViewFactory class for creating subviews
		@param {kff.View} options.parentView A parent view (the view bound to some of the ascendant DOM elements)
		@param {Array} options.models Array of model instances to be used by the view
	 */
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
		if(options.viewFactory)
		{
			this.viewFactory = options.viewFactory;
		}
		if(options.parentView)
		{
			this.parentView = options.parentView;
		}
		if(options.models)
		{
			this.models = options.models;
			delete options.models;
		}
		$.extend(this.options, options);
	},

	/**
		Returns a model object bound to the view or to the parent view.

		Accepts the model name as a string or key path in the form of "modelName.attribute.nextAttribute etc.".
		Will search for "modelName" in current view, then in parent view etc. When found, returns a value of
		"attribute.nextAtrribute" using model's	mget method.

		@param {string} modelPath Key path of model in the form of "modelName.attribute.nextAttribute etc.".
		@return {mixed} A model instance or attribute value or null if not found.
	 */
	getModel: function(modelPath)
	{
		var model;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		model = modelPath.shift();

		if(this.models && model in this.models)
		{
			if(modelPath.length > 0)
			{
				if(this.models[model] instanceof kff.Model) return this.models[model].mget(modelPath);
				else return null;
			}
			else return this.models[model];
		}
		if(this.options.parentView)
		{
			modelPath.unshift(model);
			return this.options.parentView.getModel(modelPath);
		}
		return null;
	},

	/**
		Binds DOM events to the view element. Accepts array of arrays in the form:

		[
			['mousedown, mouseup', '.title', 'edit'],
			['click',  '.button', 'save' ],
			['click', function(e) { ... }]
		]

		The first item is name of DOM event (or comma separated event names).
		The second item is a CSS experession (jquery expression) relative to the view element for event delegation (optional)
		The third item is the view method name (string) that acts as an event handler

		@param {Array} events Array of arrays of binding config
		@param {jQuery} $element A jQuery object that holds the DOM element to bind. If not provided, the view element will be used.
	 */
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

	/**
		Unbinds DOM events from the view element. Accepts array of arrays as in the delegateEvents method.

		@param {Array} events Array of arrays of binding config
		@param {jQuery} $element A jQuery object that holds the DOM element to unbind. If not provided, the view element will be used.
	 */
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

	/**
		Adds events config to the internal events array.

		@private
		@param {Array} events Array of arrays of binding config
	 */
	addEvents: function(events)
	{
		this.options.events = this.options.events.concat(events);
	},

	/**
		Initializes the view. Calls the render method. Should not be overloaded by subclasses.

		@private
		@param
	 */
	init: function()
	{
		this.render();
	},

	/**
		Renders the view. It will be called automatically. Should not be called directly.

		@param {Boolean} silent If true, the 'render' event won't be called
	 */
	render: function(silent)
	{
		this.$element.attr(kff.View.DATA_RENDERED_ATTR, true);
		this.delegateEvents();
		this.renderSubviews();
		if(!silent) this.trigger('init');
	},

	/**
		Renders subviews. Will find all DOM descendats with kff.View.DATA_KFF_VIEW (or kff.View.DATA_BIND_ATTR) attribute
		and initializes subviews on them. If an element has the kff.View.DATA_BIND_ATTR but not the kff.View.DATA_KFF_VIEW
		attribute, adds kff.View.DATA_KFF_VIEW attribute = "kff.BindingView" and inits implicit data-binding.
	 */
	renderSubviews: function()
	{
		var viewNames = [],
			viewName, viewClass, subView, options, opt, i, l, rendered,
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
						rendered = child.getAttribute(kff.View.DATA_RENDERED_ATTR);
						if(!rendered)
						{
							viewName = child.getAttribute(kff.View.DATA_VIEW_ATTR);
							if(!viewName && child.getAttribute(kff.View.DATA_BIND_ATTR))
							{
								viewName = 'kff.BindingView';
								child.setAttribute(kff.View.DATA_VIEW_ATTR, viewName);
							}
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

	/**
		Destroys the view (destroys all subviews and unbinds previously bound DOM events.
		It will be called automatically. Should not be called directly.

		@param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroy: function(silent)
	{
		this.$element.removeAttr(kff.View.DATA_RENDERED_ATTR);
		this.destroySubviews();
		this.undelegateEvents();
		if(!silent) this.trigger('destroy');
	},

	/**
		Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
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

	/**
		Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: function(){},

	refreshBinders: function()
	{
		for(var i = 0, l = this.subViews.length; i < l; i++) this.subViews[i].refreshBinders();
	}


});


kff.View.helpers =
{
	'index': function(v)
	{
		if(this.getBindingIndex() !== null) return this.getBindingIndex();
		return v;
	},

	'boolean': function(v)
	{
		var parsed = parseInt(v, 10);
		if(!isNaN(parsed)) return !!parsed;
		return v === 'true';
	},

	'not': function(v)
	{
		return !v;
	},

	'null': function(v)
	{
		return v === null || v === 'null' ? null : v;
	},

	'int': function(v)
	{
		v = parseInt(v, 10);
		if(isNaN(v)) v = 0;
		return v;
	},

	'float': function(v)
	{
		v = parseFloat(v);
		if(isNaN(v)) v = 0;
		return v;
	},


	'uppercase': function(v)
	{
		return (v || '').toUpperCase();
	},

	'lowercase': function(v)
	{
		return (v || '').toLowerCase();
	},

	'strong': function(v)
	{
		return '<strong>' + v + '</strong>';
	}
};
