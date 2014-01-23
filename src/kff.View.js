
kff.View = kff.createClass(
{
	mixins: kff.EventsMixin,

	staticProperties:
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
		var F;
		options = options || {};
		this.options = {
			element: null,
			models: null,
			events: [],
			modelEvents: []
		};

		this.initEvents();

		if(options.parentView)
		{
			this.parentView = options.parentView;
			F = function(){};
			F.prototype = this.parentView.models;
			this.models = new F();
		}
		else this.models = {};

		if(options.events)
		{
			this.options.events = this.options.events.concat(options.events);
		}
		if(options.modelEvents)
		{
			this.options.modelEvents = this.options.modelEvents.concat(options.modelEvents);
		}
		if(options.element)
		{
			this.$element = $(options.element);
		}
		if(options.viewFactory)
		{
			this.viewFactory = options.viewFactory;
		}
		if(options.models)
		{
			kff.mixins(this.models, options.models);
		}
		kff.mixins(this.options, options);

		this.viewFactory = options.viewFactory || new kff.ViewFactory();
		this.subviewsStruct = [];
		this.explicitSubviewsStruct = null;
		this.subviews = [];
		this.renderId = null;
		this.eventTriggers = [];
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
		else modelPath = [].concat(modelPath);

		modelName = modelPath.shift();

		if(this.models && modelName in this.models)
		{
			if(modelPath.length > 0)
			{
				if(this.models[modelName] instanceof kff.Model) return this.models[modelName].mget(modelPath);
				else return null;
			}
			else return this.models[modelName];
		}
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
		events = events || this.options.events;
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
		events = events || this.options.events;
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
		this.options.events = this.options.events.concat(events);
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
		var event, i, l, fn;
		this.undelegateModelEvents();
		events = events || this.options.modelEvents;

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];

			if(event.length === 3 && this.models[event[0]])
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];
				this.models[event[0]].on(event[1], fn);
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
		var event, i, l, fn;
		events = events || this.options.modelEvents;

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];

			if(event.length === 3 && this.models[event[0]])
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];
				this.models[event[0]].off(event[1], fn);
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
		this.renderId = Math.floor(Math.random() * 100000000);
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

		this.$element.attr(kff.View.DATA_RENDERED_ATTR, true);

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
		var i, l, element = this.$element.get(0),
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
	findViewElements: function(el, subviewsStruct, forceRendered)
	{
		var i, l, children, child, viewName, rendered, onAttr, optAttr;
		if(el.hasChildNodes())
		{
			children = el.childNodes;
			for(i = 0, l = children.length; i < l; i++)
			{
				child = children[i];
				if(child.nodeType === 1)
				{
					rendered = child.getAttribute(kff.View.DATA_RENDERED_ATTR);
					if(!rendered || forceRendered)
					{
						viewName = child.getAttribute(kff.View.DATA_VIEW_ATTR);
						if(!viewName && child.getAttribute(kff.View.DATA_BIND_ATTR))
						{
							viewName = 'kff.BindingView';
							child.setAttribute(kff.View.DATA_VIEW_ATTR, viewName);
						}
						if(viewName)
						{
							optAttr = child.getAttribute(kff.View.DATA_OPTIONS_ATTR);
							child.setAttribute('data-kff-renderid', this.renderId);
							subviewsStruct.push({
								viewName: viewName,
								renderId: this.renderId,
								$element: $(child),
								options: optAttr ? JSON.parse(optAttr) : {}
							});
						}
						else
						{
							onAttr = child.getAttribute(kff.View.DATA_TRIGGER_ATTR);
							if(onAttr)
							{
								child.setAttribute('data-kff-triggerid', this.renderId);
								this.processChildEventTriggers(child, onAttr);
							}

							this.findViewElements(child, subviewsStruct, forceRendered);
						}
					}
				}
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
		this.processChildEventTriggers(this.$element.get(0));
	},

	/**
	 * Process declarative events bound throught data-kff-trigger attribute on child element
	 * @private
	 * @param  {DOM Element} child  DOM Element
	 */
	processChildEventTriggers: function(child, onAttr)
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
					onAttrSplit2[1]
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
		this.$element.removeAttr(kff.View.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.undelegateModelEvents();
		this.destroySubviews();

		ret = this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this.subviewsStruct = [];
		this.explicitSubviewsStruct = null;
		this.subviews = [];
		this.renderId = null;
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
		var options = {
			parentView: this.parentView,
			viewFactory: this.viewFactory
		};
		var clonedView = new this.constructor(options);
		var clonedSubview;

		clonedView.options.events = this.options.events;
		clonedView.eventTriggers = this.eventTriggers.slice(0);

		for(var i = 0, l = clonedView.eventTriggers.length; i < l; i++)
		{
			clonedView.eventTriggers[i] = clonedView.eventTriggers[i].slice(0);
		}

		for(var modelName in this.models)
		{
			if(this.models.hasOwnProperty(modelName)) clonedView.models[modelName] = this.models[modelName];
		}

		for(var i = 0; i < this.subviews.length; i++)
		{
			clonedSubview = this.subviews[i].clone();
			clonedSubview.setParentView(clonedView);
			clonedView.subviews.push(clonedSubview);
		}
		clonedView.subviewsStruct = kff.mixins({}, this.subviewsStruct);
		clonedView.renderId = this.renderId;

		return clonedView;
	},

	setParentView: function(parentView)
	{
		var oldModels, F;

		this.parentView = parentView;

		if(this.models.__proto__)
		{
			this.models.__proto__ = parentView.models;
		}
		else
		{
			oldModels = this.models || {};

			F = function(){};
			F.prototype = this.parentView.models;
			this.models = new F();

			for(var key in oldModels)
			{
				if(oldModels.hasOwnProperty(key))
				{
					this.models[key] = oldModels[key];
				}
			}

			for(var i = 0; i < this.subviews.length; i++)
			{
				this.subviews[i].setParentView(this);
			}
		}
	},

	rebindElement: function(element)
	{
		var i, l;

		this.$element = $(element);

		var $subviewsElements = this.$element.find('[data-kff-renderid="' + this.renderId + '"]');

		if($subviewsElements.length > 0)
		{
			for(i = 0, l = this.subviews.length; i < l; i++)
			{
				if(this.subviews[i])
				{
					this.subviews[i].rebindElement($subviewsElements.eq(i).get(0));
				}
			}

		}

		if(this.eventTriggers.length > 0)
		{
			var ownTrigger = this.$element.attr('data-kff-trigger');
			var $eventTriggersElements = $([]);
			if(ownTrigger)
			{
				$eventTriggersElements = $eventTriggersElements.add(this.$element.get(0));
			}

			$eventTriggersElements = $eventTriggersElements.add(this.$element.find('[data-kff-triggerid="' + this.renderId + '"]'));

			if($eventTriggersElements.length > 0)
			{
				for(i = 0, l = this.eventTriggers.length; i < l; i++)
				{
					this.eventTriggers[i][1] = $eventTriggersElements.eq(i);
				}

			}

		}
	}
});
