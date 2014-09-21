
kff.View = kff.createClass(
{
	mixins: kff.EventsMixin
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

		this.subviewsStruct = null;
		this.explicitSubviewsStruct = null;
		this.subviews = null;
		this.eventTriggers = null;
		this.viewFactory = null;
		this.cachedRegions = null;

		this.initEvents();

		if(options.models)
		{
			this.models = options.models;
			options.models = null;
		}
		else this.models = {};

		if(options.helpers)
		{
			this.helpers = options.helpers;
			options.helpers = null;
		}
		else this.helpers = {};

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
			if(this.models[modelName])
			{
				if(typeof this.models[modelName].mget === 'function') return this.models[modelName].mget(modelPath);
				else return kff.evalObjectPath(modelPath, this.models[modelName]);

			}
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
		Array.prototype.push.apply(this.domEvents, events);
	},

	/**
	 * Adds events config to the internal eventTriggers array.
	 *
	 * @private
	 * @param {Array} events Array of arrays of binding config
	 */
	addEventTriggers: function(events)
	{
		if(!this.eventTriggers) this.eventTriggers = [];
		Array.prototype.push.apply(this.eventTriggers, events);
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
		if(this.eventTriggers)
		{
			for(var i = 0, l = this.eventTriggers.length; i < l; i++)
			{
				this.eventTriggers[i][2] = this.f(function(){
					this.callTriggerMethod.apply(this, arguments);
				}, [this.eventTriggers[i][3]]);
			}
			this.delegateEvents(this.eventTriggers);
		}
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
	 */
	render: function(){},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	run: function(){},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	renderAll: function()
	{
		if(!this.viewFactory) this.viewFactory = new kff.ViewFactory();
		this.explicitSubviewsStruct = null;
		this.renderRegions(this.options.regions);
		this.render();
		this.renderSubviews();
		this.processEventTriggers();
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function()
	{
		var ret = this.run();
		this.runSubviews();

		this.delegateEvents();
		this.delegateModelEvents();

		if(typeof this.afterRender === 'function') this.afterRender();

		this.$element[0].setAttribute(kff.DATA_RENDERED_ATTR, true);

		return ret;
	},

	/**
	 * Renders subviews. Will find all DOM descendats with
	 * kff.DATA_KFF_VIEW (or kff.DATA_BIND_ATTR) attribute and
	 * initializes subviews on them. If an element has the
	 * kff.DATA_BIND_ATTR but not the kff.DATA_KFF_VIEW attribute,
	 * adds kff.DATA_KFF_VIEW attribute = "kff.BindingView" and inits
	 * implicit data-binding.
	 */
	renderSubviews: function()
	{
		var i, l, element = this.$element[0],
			subView, options, opt, rendered, subviewsStruct = null;

		if(element) this.subviewsStruct = this.findViewElements(element);

		if(this.explicitSubviewsStruct !== null)
		{
			if(this.subviewsStruct === null) this.subviewsStruct = [];
			subviewsStruct = this.subviewsStruct.concat(this.explicitSubviewsStruct);
		}
		else if(this.subviewsStruct !== null) subviewsStruct = this.subviewsStruct.slice();

		// Render subviews
		if(subviewsStruct !== null)
		{
			for(i = 0, l = subviewsStruct.length; i < l; i++)
			{
				options = subviewsStruct[i].options;
				options.element = subviewsStruct[i].$element[0];
				subView = this.createView(subviewsStruct[i].viewName, options);
				if(subView instanceof kff.View)
				{
					subView.renderAll();
				}
			}
		}
	},

	runSubviews: function()
	{
		this.delegateEventTriggers();
		if(this.subviews)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i].runAll();
			}
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
			if(this.subviews === null) this.subviews = [];
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
		if(this.explicitSubviewsStruct === null) this.explicitSubviewsStruct = [];
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
	findViewElements: function(el)
	{
		var node, viewName, rendered, onAttr, optAttr, index = 0, subviewsStruct = null;

		if(el.hasChildNodes())
		{
			node = el.firstChild;
			while(node !== null)
			{
				viewName = null;
				if(node.nodeType === 1)
				{
					rendered = node.getAttribute(kff.DATA_RENDERED_ATTR);

					if(!rendered)
					{
						viewName = node.getAttribute(kff.DATA_VIEW_ATTR);
						if(!viewName && node.getAttribute(kff.DATA_BIND_ATTR))
						{
							viewName = 'kff.BindingView';
							node.setAttribute(kff.DATA_VIEW_ATTR, viewName);
						}
						if(viewName)
						{
							optAttr = node.getAttribute(kff.DATA_OPTIONS_ATTR);
							if(subviewsStruct === null) subviewsStruct = [];
							subviewsStruct.push({
								viewName: viewName,
								index: index,
								$element: $(node),
								options: optAttr ? JSON.parse(optAttr) : {}
							});
						}
						else
						{
							onAttr = node.getAttribute(kff.DATA_TRIGGER_ATTR);
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
		return subviewsStruct;
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
		onAttr = onAttr || child.getAttribute(kff.DATA_TRIGGER_ATTR);
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
	 */
	destroy: function(){},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 */
	destroyAll: function()
	{
		var ret;
		this.$element[0].removeAttribute(kff.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.undelegateModelEvents();
		this.destroySubviews();

		ret = this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this.subviewsStruct = null;
		this.explicitSubviewsStruct = null;
		this.subviews = null;
		this.eventTriggers = null;

		this.clearRegions(this.options.regions);

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
		if(this.subviews !== null)
		{
			for(i = 0, l = this.subviews.length; i < l; i++)
			{
				subView = this.subviews[i];
				subView.destroyAll();
			}
		}
		this.subviews = null;
		this.subviewsStruct = null;
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
	refreshBinders: function(force)
	{
		if(this.subviews !== null)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshBinders(force);
		}
	},

	refreshIndexedBinders: function()
	{
		if(this.subviews !== null)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshIndexedBinders();
		}
	},

	refreshAll: function()
	{
		if(typeof this.refresh === 'function') this.refresh();
		if(this.subviews !== null)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshAll();
		}
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
		var l;
		var clonedSubview;
		var options = this.options;

		options.parentView = null;

		var clonedView = new this.constructor(options);
		clonedView.viewFactory = this.viewFactory;

		if(this.eventTriggers)
		{
			l = this.eventTriggers.length;
			clonedView.eventTriggers = new Array(l);
			while(l--)
			{
				clonedView.eventTriggers[l] = this.eventTriggers[l].slice();
			}
		}

		if(this.subviews !== null)
		{
			l = this.subviews.length;
			clonedView.subviews = new Array(l);
			while(l--)
			{
				clonedSubview = this.subviews[l].clone();
				clonedView.subviews[l] = clonedSubview;
			}
		}

		if(this.subviewsStruct !== null)
		{
			clonedView.subviewsStruct = this.subviewsStruct.slice();
		}
		if(this.explicitSubviewsStruct !== null)
		{
			clonedView.explicitSubviewsStruct = this.explicitSubviewsStruct.slice();
		}
		if(this.cachedRegions)
		{
			clonedView.cachedRegions = this.cachedRegions;
			clonedView.cloneCachedRegions();
		}

		return clonedView;
	},

	setParentView: function(parentView)
	{
		var oldModels, oldHelpers, F, key, i, l;

		this.parentView = parentView;

		oldModels = this.models || null;

		this.models = kff.createObject(this.parentView.models);

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

		oldHelpers = this.helpers || null;

		this.helpers = kff.createObject(this.parentView.helpers);

		if(oldHelpers)
		{
			for(key in oldHelpers)
			{
				if(oldHelpers.hasOwnProperty(key))
				{
					this.helpers[key] = oldHelpers[key];
				}
			}
		}

		if(this.subviews !== null)
		{
			for(i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i].setParentView(this);
			}
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

		if(this.eventTriggers)
		{
			while(this.eventTriggers[eventTriggersIndex] && typeof this.eventTriggers[eventTriggersIndex][4] === 'undefined')
			{
				this.eventTriggers[eventTriggersIndex][1] = this.$element;
				eventTriggersIndex++;
			}
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
		if(this.subviewsStruct !== null)
		{
			if(this.subviews === null) this.subviews = [];
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
							if(!this.eventTriggers) this.eventTriggers = [];
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
	},

	renderRegions: function(regions)
	{
		var selector;

		var saveRegion = function(regions, cachedRegions, nodes, selector)
		{
			var node, fragment, childNodes;
			for(var i = 0, l = nodes.length; i < l; i++)
			{
				node = nodes[i];
				if(node.hasChildNodes())
				{
					if(!cachedRegions[selector]) cachedRegions[selector] = [];

					cachedRegions[selector][i] = fragment = document.createDocumentFragment();

					childNodes = new Array(node.childNodes.length);
					for(var i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
					{
						childNodes[i2] = node.childNodes[i2];
					}
					for(i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
					{
						fragment.appendChild(childNodes[i2]);
					}
				}
				node.innerHTML = regions[selector];
			}
		};

		if(kff.isPlainObject(regions))
		{
			if(!this.cachedRegions) this.cachedRegions = {};
			if('self' in regions) saveRegion(regions, this.cachedRegions, [this.$element[0]], 'self');
			for(selector in regions)
			{
				if(selector !== 'self')
				{
					saveRegion(regions, this.cachedRegions, this.$docElement[0].querySelectorAll(selector), selector);
				}

			}
		}
	},

	clearRegions: function(regions)
	{
		var selector, i, l, nodes, node, fragment;

		var unsaveRegion = function(regions, cachedRegions, nodes, selector)
		{
			var node, fragment;
			for(var i = nodes.length - 1; i >= 0; i--)
			{
				node = nodes[i];
				node.innerHTML = '';
				if(cachedRegions[selector])
				{
					fragment = cachedRegions[selector][i];
					if(fragment)
					{
						node.appendChild(fragment);
						cachedRegions[selector][i] = null;
					}
				}
			}
		};

		if(kff.isPlainObject(regions))
		{
			if('self' in regions) unsaveRegion(regions, this.cachedRegions, [this.$element[0]], 'self');
			for(var selector in regions)
			{
				if(selector !== 'self')
				{
					unsaveRegion(regions, this.cachedRegions, this.$docElement[0].querySelectorAll(selector), selector);
				}
			}
		}
	},

	cloneCachedRegions: function()
	{
		var selector, i, l, nodes, node, fragment;
		if(this.cachedRegions)
		{
			for(selector in this.cachedRegions)
			{
				fragments = this.cachedRegions[selector];
				for(i = 0, l = fragments.length; i < l; i++)
				{
					if(fragments[i].hasChildNodes())
					{
						childNodes = fragments[i].childNodes;
						fragment = document.createDocumentFragment();

						for(i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
						{
							fragment.appendChild(childNodes[i2].cloneNode(true));
						}
						fragments[i] = fragment;
					}
				}
			}
		}
	}

});
