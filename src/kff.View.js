
kff.View = kff.createClass(
{
	mixins: kff.EventsMixin,

	statics:
	/** @lends kff.View */
	{
		/**
		 * Data-attribute name used for view names
		 * @constant
		 */
		DATA_VIEW_ATTR: 'data-kff-view',

		/**
		 * Data-attribute name used for view options (as JSON serialized object)
		 * @constant
		 */
		DATA_OPTIONS_ATTR: 'data-kff-options',

		/**
		 * Data-attribute name used for marking of rendered views
		 * @constant
		 */
		DATA_RENDERED_ATTR: 'data-kff-rendered',

		/**
		 * Data-attribute name used for data-binding
		 * @constant
		 */
		DATA_BIND_ATTR: 'data-kff-bind',

		/**
		 * Data-attribute name used for action-binding
		 * @constant
		 */
		DATA_TRIGGER_ATTR: 'data-kff-trigger'
	}
},
/** @lends kff.View.prototype */
{
	/**
	 * Base class for views
	 *
	 * @constructs
	 * @param {Object} options Options object
	 * @param {DOM Element|jQuery} options.element A DOM element that will be a root element of the view
	 * @param {Array} options.models Array of model instances to be used by the view
	 */
	constructor: function(options)
	{
		options = options || {};

		this.subviewsStruct = [];
		this.explicitSubviewsStruct = [];
		this.subviews = [];
		this.eventTriggers = [];
		this.viewFactory = null;

		this.initEvents();

		if(options.models)
		{
			this.models = options.models;
			options.models = null;
		}
		else this.models = {};

		if(options.parentView)
		{
			this.setParentView(options.parentView);
		}

		if(options.events)
		{
			this.domEvents = options.events.slice();
		}
		else this.domEvents = [];

		if(options.modelEvents)
		{
			this.modelEvents = options.modelEvents.slice();
		}
		else this.modelEvents = [];

		if(options.element)
		{
			this.$element = $(options.element);
			options.element = null;
		}

		if(options.viewFactory)
		{
			this.viewFactory = options.viewFactory;
		}

		this.options = options;

		return this;
	},

	/**
	 * Returns a model object bound to the view or to the parent view.
	 *
	 * Accepts the model name as a string or key path in the form of "modelName.attribute.nextAttribute etc.".
	 * Will search for "modelName" in current view, then in parent view etc. When found, returns a value of
	 * "attribute.nextAtrribute" using model's	mget method.
	 *
	 * @param {string} modelPath Key path of model in the form of "modelName.attribute.nextAttribute etc.".
	 * @return {mixed} A model instance or attribute value or null if not found.
	 */
	getModel: function(modelPath)
	{
		var modelName;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		modelName = modelPath[0];
		modelPath = modelPath.slice(1);

		if(modelPath.length > 0)
		{
			if(this.models[modelName]) return this.models[modelName].mget(modelPath);
			else return null;
		}
		else return this.models[modelName];
		return null;
	},

	/**
	 * Binds DOM events to the view element. Accepts array of arrays in the form:
	 *
	 * [
	 *     ['mousedown, mouseup', '.title', 'edit'],
	 *     ['click',  '.button', 'save' ],
	 *     ['click', function(e) { ... }]
	 * ]
	 *
	 * The first item is name of DOM event (or comma separated event names).
	 * The second item is a CSS experession (jquery expression) relative to the view element for event delegation (optional)
	 * The third item is the view method name (string) that acts as an event handler
	 *
	 * @param {Array} events Array of arrays of binding config
	 * @param {jQuery} $element A jQuery object that holds the DOM element to bind. If not provided, the view element will be used.
	 */
	delegateEvents: function(events, $element)
	{
		var event, i, l, fn;
		this.undelegateEvents(events, $element);
		events = events || this.domEvents;
		$element = $element || this.$element;
		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length >= 3)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];

				if(typeof event[1] === 'string') $element.on(event[0], event[1], fn);
				else event[1].on(event[0], fn);
			}
			else if(event.length === 2)
			{
				if(typeof event[1] === 'string') fn = this.f(event[1]);
				else fn = event[1];

				$element.on(event[0], fn);
			}
		}
	},

	/**
	 * Unbinds DOM events from the view element. Accepts array of arrays as in
	 * the delegateEvents method.
	 *
	 * @param {Array} events Array of arrays of binding config
	 * @param {jQuery} $element A jQuery object that holds the DOM element to
	 * unbind. If not provided, the view element will be used.
	 */
	undelegateEvents: function(events, $element)
	{
		var event, i, l, fn;
		events = events || this.domEvents;
		$element = $element || this.$element;
		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length >= 3)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];

				if(typeof event[1] === 'string') $element.off(event[0], event[1], fn);
				else event[1].off(event[0], fn);
			}
			else if(event.length === 2)
			{
				if(typeof event[1] === 'string') fn = this.f(event[1]);
				else fn = event[1];

				$element.off(event[0], fn);
			}
		}
	},

	/**
	 * Adds events config to the internal events array.
	 *
	 * @private
	 * @param {Array} events Array of arrays of binding config
	 */
	addEvents: function(events)
	{
		this.domEvents = this.domEvents.concat(events);
	},

	/**
	 * Adds events config to the internal eventTriggers array.
	 *
	 * @private
	 * @param {Array} events Array of arrays of binding config
	 */
	addEventTriggers: function(events)
	{
		this.eventTriggers = this.eventTriggers.concat(events);
	},

	/**
	 * Binds model events to the view. Accepts array of arrays in the form:
	 *
	 * [
	 *     ['modelName', 'eventType', 'methodName'],
	 * ]
	 *
	 * The first item is a name of the model.
	 * The second item is an event name
	 * The third item is the view method name (string) that acts as an event
	 * handler
	 *
	 * @param {Array} events Array of arrays of binding config
	 */
	delegateModelEvents: function(events)
	{
		var event, i, l, fn, model;
		this.undelegateModelEvents();
		events = events || this.modelEvents;

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			model = this.getModel(event[0]);
			if(event.length === 3 && model)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];
				model.on(event[1], fn);
			}
		}
	},

	delegateEventTriggers: function()
	{
		for(var i = 0, l = this.eventTriggers.length; i < l; i++)
		{
			this.eventTriggers[i][2] = this.f(function(){
				this.callTriggerMethod.apply(this, arguments);
			}, [this.eventTriggers[i][3]]);
		}
		this.delegateEvents(this.eventTriggers);
	},

	/**
	 * Unbinds model events from the view. Accepts array of arrays in the form:
	 *
	 * [
	 *     ['modelName', 'eventType', 'methodName']
	 * ]
	 *
	 * The first item is a name of the model. The second item is an event name
	 * The third item is the view method name (string) that acts as an event
	 * handler
	 *
	 * @param {Array} events Array of arrays of binding config
	 */
	undelegateModelEvents: function(events)
	{
		var event, i, l, fn, model;
		events = events || this.modelEvents;

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			model = this.getModel(event[0]);
			if(event.length === 3 && model)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];
				model.off(event[1], fn);
			}
		}
	},

	/**
	 * Initializes the view. Calls the render method. Should not be overloaded
	 * by subclasses.
	 *
	 * @private
	 * @param
	 */
	init: function()
	{
		this.renderAll();
		this.runAll();
	},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 *
	 * @param {Boolean} silent If true, the 'render' event won't be called
	 */
	render: function(){},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 *
	 * @param {Boolean} silent If true, the 'render' event won't be called
	 */
	run: function(){},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	renderAll: function()
	{
		if(!this.viewFactory) this.viewFactory = new kff.ViewFactory();
		this.explicitSubviewsStruct = [];
		this.render();
		this.renderSubviews();
		this.processEventTriggers();
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function(silent)
	{
		var ret = this.run();
		this.runSubviews();

		this.delegateEvents();
		this.delegateModelEvents();

		if(typeof this.afterRender === 'function') this.afterRender();

		this.$element[0].setAttribute(kff.View.DATA_RENDERED_ATTR, true);

		return ret;
	},

	/**
	 * Renders subviews. Will find all DOM descendats with
	 * kff.View.DATA_KFF_VIEW (or kff.View.DATA_BIND_ATTR) attribute and
	 * initializes subviews on them. If an element has the
	 * kff.View.DATA_BIND_ATTR but not the kff.View.DATA_KFF_VIEW attribute,
	 * adds kff.View.DATA_KFF_VIEW attribute = "kff.BindingView" and inits
	 * implicit data-binding.
	 */
	renderSubviews: function()
	{
		var i, l, element = this.$element[0],
			subView, options, opt, rendered, subviewsStruct;

		if(element) this.findViewElements(element, this.subviewsStruct);

		subviewsStruct = this.subviewsStruct.concat(this.explicitSubviewsStruct);

		// Render subviews
		for(i = 0, l = subviewsStruct.length; i < l; i++)
		{
			options = subviewsStruct[i].options;
			options.element = subviewsStruct[i].$element;
			subView = this.createView(subviewsStruct[i].viewName, options);
			if(subView instanceof kff.View)
			{
				subView.renderAll();
			}
		}

	},

	runSubviews: function()
	{
		this.delegateEventTriggers();
		for(var i = 0, l = this.subviews.length; i < l; i++)
		{
			this.subviews[i].runAll();
		}
	},

	/**
	 * Creates a new subview and adds it to the internal subviews list.
	 * The new subview is created using the viewFactory and gets properly set
	 * parentView.
	 *
	 * Do not use this method directly, use addSubview method instead.
	 *
	 * @private
	 * @param  {String} viewName Name of the view
	 * @param  {Object} options  Options object for the subview constructor
	 * @return {kff.View}        Created view
	 */
	createView: function(viewName, options)
	{
		options.parentView = this;
		var subView = this.viewFactory.createView(viewName, options);
		if(subView instanceof kff.View)
		{
			subView.viewFactory = this.viewFactory;
			this.subviews.push(subView);
		}
		return subView;
	},

	/**
	 * Adds subview metadata to the internal list. The subviews from this list
	 * are then rendered in renderSubviews method which is automatically called
	 * when the view is rendered.
	 *
	 * This method can be used is in the render method to manually create a view
	 * that is not parsed from html/template (for example for an element that
	 * sits at the end od the body element).
	 *
	 * @param {jQuery} $element Element of the subview
	 * @param {String} viewName Name of the view
	 * @param {[type]} options  Options object for the subview constructor
	 */
	addSubview: function($element, viewName, options)
	{
		this.explicitSubviewsStruct.push({
			viewName: viewName,
			$element: $element,
			options: options || {}
		});
	},

	/**
	 * Finds possible subview elements inside an element
	 *
	 * @private
	 * @param  {DOM Element} el Root element from which search starts
	 * @param  {Array} viewNames Array that will be filled by found elements
	 *                           (items will be objects { objPath: viewName, $element: jQuery wrapper })
	 * @param  {string} filter  A jQuery selector for filtering elements (optional)
	 */
	findViewElements: function(el, subviewsStruct)
	{
		var node, viewName, rendered, onAttr, optAttr, index = 0;

		if(el.hasChildNodes())
		{
			node = el.firstChild;
			while(node !== null)
			{
				viewName = null;
				if(node.nodeType === 1)
				{
					rendered = node.getAttribute(kff.View.DATA_RENDERED_ATTR);

					if(!rendered)
					{
						viewName = node.getAttribute(kff.View.DATA_VIEW_ATTR);
						if(!viewName && node.getAttribute(kff.View.DATA_BIND_ATTR))
						{
							viewName = 'kff.BindingView';
							node.setAttribute(kff.View.DATA_VIEW_ATTR, viewName);
						}
						if(viewName)
						{
							optAttr = node.getAttribute(kff.View.DATA_OPTIONS_ATTR);
							subviewsStruct.push({
								viewName: viewName,
								index: index,
								$element: $(node),
								options: optAttr ? JSON.parse(optAttr) : {}
							});
						}
						else
						{
							onAttr = node.getAttribute(kff.View.DATA_TRIGGER_ATTR);
							if(onAttr)
							{
								this.processChildEventTriggers(node, onAttr, index);
							}
						}
					}
					index++;
				}
				node = this.nextNode(el, node, viewName === null);
			}
		}
	},

	/**
	 * Process declarative events bound throught data-kff-trigger attribute on root view element
	 *
	 * @private
	 */
	processEventTriggers: function()
	{
		this.processChildEventTriggers(this.$element[0]);
	},

	/**
	 * Process declarative events bound throught data-kff-trigger attribute on child element
	 * @private
	 * @param  {DOM Element} child  DOM Element
	 */
	processChildEventTriggers: function(child, onAttr, index)
	{
		var onAttrSplit, onAttrSplit2, events = [], i, l;
		onAttr = onAttr || child.getAttribute(kff.View.DATA_TRIGGER_ATTR);
		if(onAttr)
		{
			onAttrSplit = onAttr.split(/\s+/);
			for(i = 0, l = onAttrSplit.length; i < l; i++)
			{
				onAttrSplit2 = onAttrSplit[i].split(':');
				events.push([
					onAttrSplit2[0].replace('|', ' '),
					$(child),
					null,
					onAttrSplit2[1],
					index
				]);
			}
			this.addEventTriggers(events);
		}
	},

	/**
	 * Finds and calls a method registered as trigger handler.
	 *
	 * @private
	 * @param  {Function} fn Function to be called
	 */
	callTriggerMethod: function(fn)
	{
		if(typeof this[fn] === 'function')
		{
			this[fn].apply(this, Array.prototype.slice.call(arguments, 1));
		}

		else if(this.parentView)
		{
			this.parentView.callTriggerMethod.apply(this.parentView, arguments);
		}
	},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroy: function(){},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroyAll: function(silent)
	{
		var ret;
		this.$element[0].removeAttribute(kff.View.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.undelegateModelEvents();
		this.destroySubviews();

		ret = this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this.subviewsStruct = [];
		this.explicitSubviewsStruct = [];
		this.subviews = [];
		this.eventTriggers = [];

		return ret;
	},

	/**
	 * Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
	destroySubviews: function()
	{
		var subView, i, l;

		this.undelegateEvents(this.eventTriggers);

		// Destroy subviews
		for(i = 0, l = this.subviews.length; i < l; i++)
		{
			subView = this.subviews[i];
			subView.destroyAll();
		}
		this.subviews = [];
		this.subviewsStruct = [];
	},

	/**
	 * Destroys and renders+runs the view with optional new html content
	 * @param  {string} html HTML tepmlate (optional)
	 */
	rerender: function(html)
	{
		this.destroyAll();
		if(html !== undefined) this.$element[0].innerHTML = html;
		this.renderAll();
		this.runAll();
	},

	/**
	 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: function(){},

	/**
	 * Refreshes data-binders in all subviews.
	 *
	 * @param  {Object} event Any event object that caused refreshing
	 */
	refreshBinders: function(event)
	{
		for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshBinders(event);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function(modelName)
	{
		if(this.parentView instanceof kff.View) return this.parentView.getBindingIndex(modelName);
		return null;
	},

	clone: function()
	{
		var options = kff.mixins({}, this.options);

		options.parentView = null;

		var clonedView = new this.constructor(options);
		var clonedSubview;

		clonedView.viewFactory = this.viewFactory;

		clonedView.eventTriggers = this.eventTriggers.slice();

		for(var i = 0, l = clonedView.eventTriggers.length; i < l; i++)
		{
			clonedView.eventTriggers[i] = clonedView.eventTriggers[i].slice();
		}

		for(var i = 0; i < this.subviews.length; i++)
		{
			clonedSubview = this.subviews[i].clone();
			clonedView.subviews.push(clonedSubview);
		}

		clonedView.subviewsStruct = this.subviewsStruct.slice();
		clonedView.explicitSubviewsStruct = this.explicitSubviewsStruct.slice();

		return clonedView;
	},

	setParentView: function(parentView)
	{
		var oldModels, F, key, i, l;

		this.parentView = parentView;

		oldModels = this.models || null;

		this.models = kff.createObject(this.parentView.models)

		if(oldModels)
		{
			for(key in oldModels)
			{
				if(oldModels.hasOwnProperty(key))
				{
					this.models[key] = oldModels[key];
				}
			}
		}

		for(i = 0, l = this.subviews.length; i < l; i++)
		{
			this.subviews[i].setParentView(this);
		}
	},

	setViewFactory: function(viewFactory)
	{
		this.viewFactory = viewFactory;
	},

	rebindElement: function(element)
	{
		var i, l, eventTriggersIndex = 0;

		this.$element = $(element);

		while(this.eventTriggers[eventTriggersIndex] && typeof this.eventTriggers[eventTriggersIndex][4] === 'undefined')
		{
			this.eventTriggers[eventTriggersIndex][1] = this.$element;
			eventTriggersIndex++;
		}

		this.rebindSubViews(element, {
			subviewIndex: 0,
			subviewsStructIndex: 0,
			eventTriggersIndex: eventTriggersIndex,
			index: 0
		});
	},

	rebindSubViews: function(el, ids)
	{
		var node, doSubviews;

		if(el.hasChildNodes())
		{
			node = el.firstChild;

			while(node !== null)
			{
				if(node.nodeType === 1)
				{
					if(this.subviewsStruct[ids.subviewIndex])
					{
						ids.subviewsStructIndex = this.subviewsStruct[ids.subviewIndex].index;
						if(ids.index === ids.subviewsStructIndex)
						{
							if(this.subviews[ids.subviewIndex])
							{
								this.subviews[ids.subviewIndex].rebindElement(node);
							}
							ids.subviewIndex++;
							doSubviews = false;
						}
						else doSubviews = true;
					}
					else
					{
						while(this.eventTriggers[ids.eventTriggersIndex] && this.eventTriggers[ids.eventTriggersIndex][4] === ids.index)
						{
							this.eventTriggers[ids.eventTriggersIndex][1] = $(node);
							ids.eventTriggersIndex++;
						}
					}
					ids.index++;
				}
				node = this.nextNode(el, node, doSubviews);
			}
		}
	},

	nextNode: function(root, node, deep)
	{
		if(deep && node.hasChildNodes())
		{
			node = node.firstChild;
		}
		else
		{
			while(node !== root && node.nextSibling === null && node.parentNode !== null)
			{
				node = node.parentNode;
			}
			if(node && node !== root) node = node.nextSibling;
			else node = null;
		}
		return node;
	}
});
