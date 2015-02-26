
(function()
{

var bindingRegex = /(?:([_.a-zA-Z0-9*-]+))(?:\(([@.a-zA-Z0-9*,\s-]+)*\))?((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g;

var operatorsRegex = /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g;

var commaSeparateRegex = /\s*,\s*/;

var modifierSeparateRegex = /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\.\s@*]+})/g;

var leadingPeriodRegex = /^\./;

var trailingPeriodRegex = /\.$/;


kff.View = kff.createClass(
{
	mixins: kff.EventsMixin,
	statics: {

		/**
		 * Object hash that holds references to binder classes under short key names
		 * @private
		*/
		binders: {},

		helpers: {},

		/**
		 * Registers binder class
		 *
		 * @param {string} alias Alias name used in binding data-attributes
		 * @param {kff.Binder} binder Binder class to register
		 */
		registerBinder: function(alias, binder)
		{
			kff.View.binders[alias] = binder;
		},

		/**
		 * Registers helper function to be used as parser/formatter
		 *
		 * @param {string} alias Name of helper function
		 * @param {function} helper Helper function
		 */
		registerHelper: function(alias, helper)
		{
			kff.View.helpers[alias] = helper;
		}
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
	 * @param {Array} options.scope Array of model instances to be used by the view
	 */
	constructor: function(options)
	{
		options = options || {};

		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.collectionCountBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;

		this.subviewsStruct = null;
		this.explicitSubviewsStruct = null;
		this.subviews = null;
		this.viewFactory = null;
		this.cachedRegions = null;
		this.pendingRefresh = false;
		this.subviewsScope = null;

		this.initEvents();

		if(options.scope)
		{
			this.scope = options.scope;
			options.scope = null;
		}
		else this.scope = {};

		if(options.parentView)
		{
			this.setParentView(options.parentView);
		}

		if(options.events)
		{
			this.domEvents = options.events.slice();
		}
		else this.domEvents = [];

		if(options.element)
		{
			this.$element = $(options.element);
			options.element = null;
		}

		if(options.viewFactory)
		{
			this.viewFactory = options.viewFactory;
		}

		if(options.dispatcher)
		{
			this.dispatcher = options.dispatcher;
		}
		else this.dispatcher = null;

		if(options.actions && this.dispatcher)
		{
			this.actions = options.actions;
		}
		else this.actions = null;

		if(options.env)
		{
			this.env = options.env;
		}

		this.options = options;

	},


	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	render: kff.noop,

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	run: kff.noop,

	/**
	 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: kff.noop,

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 */
	destroy: kff.noop,

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
	renderAll: function()
	{
		if(!this.modelBindersMap) this.initBinding();
		if(!this.collectionBinder)
		{
			if(!this.viewFactory) this.viewFactory = new kff.ViewFactory();
			this.explicitSubviewsStruct = null;
			this.renderRegions(this.options.regions);
			if(this.render !== kff.noop) this.render();
			this.renderSubviews();
		}
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function()
	{
		if(this.collectionBinder)
		{
			this.runSubviews();
		}
		else
		{
			if(this.modelBindersMap) this.modelBindersMap.initBinders();

			if(this.run !== kff.noop) this.run();
			this.runSubviews();

			this.delegateEvents();

			if(this.actions)
			{
				if(!this.dispatcher) this.dispatcher = new kff.Dispatcher();
				this.dispatcher.registerActions(this.actions);
			}

			if(this.dispatcher)
			{
				this.dispatcher.on('refresh', this.f('refreshAll'));
				this.dispatcher.on('refreshFromRoot', this.f('refreshFromRoot'));
			}

			if(typeof this.afterRender === 'function') this.afterRender();

			this.$element[0].setAttribute(kff.DATA_RENDERED_ATTR, true);

			this.refreshOwnBinders(true);
		}
	},

	requestRefreshAll: function()
	{
		if(this.env.window.requestAnimationFrame)
		{
			if(!this.pendingRefresh)
			{
				this.pendingRefresh = true;
				this.env.window.requestAnimationFrame(this.f('refreshAll'));
			}
		}
		else this.refreshAll();
	},

	/**
	 * Refreshes all binders, subviews and bound views
	 */
	refreshAll: function()
	{
		if(typeof this.refresh === 'function') this.refresh();
		if(this.collectionBinder)
		{
			this.collectionBinder.refreshBoundViews();
			this.collectionBinder.refreshAll();
		}
		else
		{
			this.rebindCursors();
			this.refreshOwnBinders();
			if(this.subviews !== null)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshAll();
			}
		}
		this.pendingRefresh = false;
	},

	/**
	 * Refreshes all views from root
	 */
	refreshFromRoot: function()
	{
		var view = this;
		while(view.parentView)
		{
			view = view.parentView;
		}

		if(view.dispatcher !== null)
		{
			view.dispatcher.trigger({ type: 'refresh' });
		}
	},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 */
	destroyAll: function()
	{
		this.destroyBinding();

		if(this.collectionBinder) this.collectionBinder.destroyBoundViews();

		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;

		this.$element[0].removeAttribute(kff.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.destroySubviews();
		if(this.dispatcher)
		{
			this.dispatcher.off('refresh', this.f('refreshAll'));
			this.dispatcher.off('refreshFromRoot', this.f('refreshFromRoot'));
		}

		if(this.destroy !== kff.noop) this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this.subviewsStruct = null;
		this.explicitSubviewsStruct = null;
		this.subviews = null;

		this.clearRegions(this.options.regions);
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
		if(!this.collectionBinder)
		{
			var i, l, element = this.$element[0],
				subView, options, opt, rendered, subviewsStruct = null;

			if(element) this.subviewsStruct = this.findViewElements(element);

			if(this.explicitSubviewsStruct !== null)
			{
				if(this.subviewsStruct === null) this.subviewsStruct = [];
				subviewsStruct = kff.arrayConcat(this.subviewsStruct, this.explicitSubviewsStruct);
			}
			else if(this.subviewsStruct !== null) subviewsStruct = this.subviewsStruct.slice();

			// Render subviews
			if(subviewsStruct !== null)
			{
				for(i = 0, l = subviewsStruct.length; i < l; i++)
				{
					options = subviewsStruct[i].options;
					options.element = subviewsStruct[i].$element[0];
					options.env = this.env;
					subView = this.createView(subviewsStruct[i].viewName, options);
					if(subView instanceof kff.View)
					{
						subView.renderAll();
					}
				}
			}
		}
	},

	/**
	 * Runs subviews
	 */
	runSubviews: function()
	{
		if(this.collectionBinder)
		{
			this.collectionBinder.renderBoundViews();
		}
		else
		{
			if(this.subviews)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++)
				{
					this.subviews[i].runAll();
				}
			}
		}
	},

	/**
	 * Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
	destroySubviews: function()
	{
		if(this.collectionBinder)
		{
			this.collectionBinder.destroyBoundViews();
		}
		else
		{
			var subView, i, l;

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
		}
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
	 * Returns a model object bound to the view or to the parent view.
	 *
	 * Accepts the model name as a string or key path in the form of "modelName.attribute.nextAttribute etc.".
	 * Will search for "modelName" in current view, then in parent view etc. When found, returns a value of
	 * "attribute.nextAtrribute" using model's	mget method.
	 *
	 * @param {string} modelPath Key path of model in the form of "modelName.attribute.nextAttribute etc.".
	 * @return {mixed} A model instance or attribute value or null if not found.
	 */
	getCursor: function(keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');

		var rootCursorName = keyPath[0];
		var keyPath = keyPath.slice(1);
		var rootCursor = this.scope[rootCursorName];
		if(!(rootCursor instanceof kff.Cursor)) rootCursor = new kff.Cursor(rootCursor, keyPath);

		var cursor = rootCursor.refine(keyPath);

		return cursor;
	},

	/**
	 * Adds events config to the internal events array.
	 *
	 * @private
	 * @param {Array} events Array of arrays of binding config
	 */
	addEvents: function(events)
	{
		if(!(events instanceof Array))
		{
			if(arguments.length === 2 || arguments.length === 3) this.domEvents.push(Array.prototype.slice.apply(arguments));
			return;
		}
		else if(!(events[0] instanceof Array))
		{
			events = Array.prototype.slice.apply(arguments);
		}
		Array.prototype.push.apply(this.domEvents, events);
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
		var subviewScope;
		options.parentView = this;

		if(this.subviewsScope)
		{
			subviewScope = this.subviewsScope[viewName];

			if(typeof subviewScope === 'object' && subviewScope !== null)
			{
				var defaultViewOptions = this.viewFactory.getDefaultViewOptions(viewName);
				if(defaultViewOptions) options = kff.mixins(defaultViewOptions, options);
				if(options.scope) kff.mixins(options.scope, subviewScope);
				else options.scope = subviewScope;
			}
		}
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
	 * @param {DOM element} element Element of the subview
	 * @param {String} viewName Name of the view
	 * @param {[type]} options  Options object for the subview constructor
	 */
	addSubview: function(element, viewName, options)
	{
		if(this.explicitSubviewsStruct === null) this.explicitSubviewsStruct = [];
		this.explicitSubviewsStruct.push({
			viewName: viewName,
			$element: $(element),
			options: options || {}
		});
	},

	setSubviewsScope: function(subviewsScope)
	{
		if(subviewsScope)
		{
			if(this.parentView === null)
			{
				this.subviewsScope = subviewsScope;
			}
			else if(this.subviewsScope)
			{
				var keys = Object.keys(subviewsScope);
				for(var i = 0, l = keys.length; i < l; i++)
				{
					key = keys[i];
					this.subviewsScope[key] = subviewsScope[key];
				}
			}
			else
			{
				this.subviewsScope = subviewsScope;
			}
		}
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
		var node = el, viewName = null, rendered, onAttr, optAttr, index = 0, subviewsStruct = null;

		while((node = this.nextNode(el, node, viewName === null)) !== null)
		{
			viewName = null;
			rendered = node.getAttribute(kff.DATA_RENDERED_ATTR);

			if(!rendered)
			{
				viewName = node.getAttribute(kff.DATA_VIEW_ATTR);
				if(!viewName && node.getAttribute(kff.DATA_BIND_ATTR))
				{
					viewName = 'kff.View';
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
			}
			index++;
		}
		return subviewsStruct;
	},

	/**
	 * Refreshes data-binders in all subviews.
	 *
	 * @param  {Object} event Any event object that caused refreshing
	 */
	refreshBinders: function(force)
	{
		if(this.collectionBinder)
		{
			this.collectionBinder.refreshBinders(force);
		}
		else
		{
			this.refreshOwnBinders(force);
			if(this.subviews !== null)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshBinders(force);
			}
		}
	},

	/**
	 * Refreshes all indexed binders of this view or subviews
	 *
	 * @private
	 * @return {[type]} [description]
	 */
	refreshIndexedBinders: function()
	{
		if(this.collectionBinder)
		{
			this.collectionBinder.refreshIndexedBinders();
		}
		else
		{
			if(this.modelBindersMap)
			{
				this.modelBindersMap.refreshIndexedBinders();
			}
			if(this.subviews !== null)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshIndexedBinders();
			}
		}
	},

	/**
	 * Dispatches event to the dispatcher
	 *
	 * @param  {object} event Event object to dispatch
	 */
	dispatchEvent: function(event)
	{
		var res, view = this;
		while(view)
		{
			if(view.dispatcher !== null && view.dispatcher.hasAction(event.type))
			{
				view.dispatcher.trigger(event);
				break;
			}
			view = view.parentView;
		}
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function(modelName)
	{
		modelName = modelName || '*';
		if(this.bindingIndex !== null && this.scope.hasOwnProperty(modelName)) return this.bindingIndex;
		if(this.parentView instanceof kff.View) return this.parentView.getBindingIndex(modelName);
		return null;
	},

	/**
	 * Sets current binding index
	 *
	 * @private
	 */
	setBindingIndex: function(index)
	{
		this.bindingIndex = index;
	},


	/**
	 * Clones this binding view
	 *
	 * @return {kff.View} Cloned view
	 */
	clone: function()
	{
		var l;
		var clonedSubview;
		var options = this.options;

		options.parentView = null;
		options.env = this.env;

		var clonedView = new this.constructor(options);
		clonedView.viewFactory = this.viewFactory;

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

		if(this.collectionBinder)
		{
			clonedView.collectionBinder = new kff.CollectionBinder(
			{
				view: clonedView,
				collection: null,
				collectionPathArray: this.collectionBinder.collectionPathArray
			});
		}

		if(this.modelBindersMap)
		{
			clonedView.modelBindersMap = this.modelBindersMap.clone();
			clonedView.modelBindersMap.setView(clonedView);
		}
		clonedView.itemAlias = this.itemAlias;

		return clonedView;
	},

	setParentView: function(parentView)
	{
		var oldScope, key, i, l;

		this.parentView = parentView;

		oldScope = this.scope || null;

		this.scope = kff.createObject(parentView.scope);

		if(oldScope)
		{
			var keys = Object.keys(oldScope);
			for(i = 0, l = keys.length; i < l; i++)
			{
				key = keys[i];
				this.scope[key] = oldScope[key];
			}
		}

		var oldSubviewsScope = this.subviewsScope || null;

		if(parentView.subviewsScope)
		{
			this.subviewsScope = kff.createObject(parentView.subviewsScope);

			if(oldSubviewsScope)
			{
				var keys = Object.keys(oldSubviewsScope);
				for(i = 0, l = keys.length; i < l; i++)
				{
					key = keys[i];
					this.subviewsScope[key] = oldSubviewsScope[key];
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


	/**
	 * Rebinds the view to another DOM element
	 *
	 * @private
	 * @param  {DOMELement} element New DOM element of the view
	 */
	rebindElement: function(element)
	{
		var i, l;

		this.$element = $(element);

		this.rebindSubViews(element, {
			subviewIndex: 0,
			subviewsStructIndex: 0,
			index: 0
		});

		if(this.modelBindersMap)
		{
			this.modelBindersMap.setView(this);
		}

		if(this.collectionBinder)
		{
			this.collectionBinder.view = this;
		}

	},

	rebindSubViews: function(el, ids)
	{
		var node = el, doSubviews = true;
		var subviews = this.subviews, subviewsStruct = this.subviewsStruct;
		if(subviewsStruct !== null)
		{
			if(subviews === null) this.subviews = subviews = [];

			while((node = this.nextNode(el, node, doSubviews)) !== null)
			{
				if(subviewsStruct[ids.subviewIndex])
				{
					ids.subviewsStructIndex = subviewsStruct[ids.subviewIndex].index;
					if(ids.index === ids.subviewsStructIndex)
					{
						if(subviews[ids.subviewIndex])
						{
							subviews[ids.subviewIndex].rebindElement(node);
						}
						ids.subviewIndex++;
						doSubviews = false;
					}
					else doSubviews = true;
				}
				ids.index++;
			}
		}
	},

	nextNode: function(root, node, deep)
	{
		var parentNode, nextSibling, tempNode;
		do {
			if(deep && (tempNode = node.firstChild))
			{
				node = tempNode;
			}
			else
			{
				parentNode = node.parentNode;
				nextSibling = node.nextSibling;
				while(node !== root && nextSibling === null && parentNode !== null)
				{
					node = parentNode;
					parentNode = node.parentNode;
					nextSibling = node.nextSibling;
				}
				if(node && node !== root) node = nextSibling;
				else node = null;
			}
		} while (node && node.nodeType !== 1);
		return node;
	},

	renderRegions: function(regions)
	{
		var selector, env = this.env;

		var saveRegion = function(regions, cachedRegions, nodes, selector)
		{
			var node, fragment, childNodes;
			for(var i = 0, l = nodes.length; i < l; i++)
			{
				node = nodes[i];
				if(node.hasChildNodes())
				{
					if(!cachedRegions[selector]) cachedRegions[selector] = [];

					cachedRegions[selector][i] = fragment = env.document.createDocumentFragment();

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
					saveRegion(regions, this.cachedRegions, this.$element[0].querySelectorAll(selector), selector);
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
					unsaveRegion(regions, this.cachedRegions, this.$element[0].querySelectorAll(selector), selector);
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
						fragment = this.env.document.createDocumentFragment();

						for(i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
						{
							fragment.appendChild(childNodes[i2].cloneNode(true));
						}
						fragments[i] = fragment;
					}
				}
			}
		}
	},

	/* Methods from former BindingView */

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, i, ret, modelArgs;
		var dataBindAttr = this.$element[0].getAttribute(kff.DATA_BIND_ATTR);
		var modelName;

		bindingRegex.lastIndex = 0;

		this.modelBindersMap = new kff.BinderMap();

		while((result = bindingRegex.exec(dataBindAttr)) !== null)
		{
			modelPathArray = result[1].replace(leadingPeriodRegex, '*.').replace(trailingPeriodRegex, '.*').split('.');

			modelArgs = result[2];

			if(modelArgs)
			{
				modelArgs = modelArgs.split(commaSeparateRegex);
				for(var k = 0, kl = modelArgs.length; k < kl; k++)
				{
					if(modelArgs[k].charAt(0) === '@')
					{
						modelArgs[k] = modelArgs[k].slice(1).split('.');
					}
				}
			}

			var keyPath = modelPathArray;
			if(keyPath.length > 1 && keyPath[keyPath.length - 1] === '*') keyPath.pop();

			ret = this.parseBindingRegexp(result, true);

			if(ret.binderName === 'each')
			{
				if(!this.options.isBoundView)
				{
					this.collectionBinder = new kff.CollectionBinder({
						view: this,
						keyPath: keyPath,
						collectionArgs: modelArgs,
						filter: (ret.filter && ret.filter.length > 0) ? ret.filter[0] : null,
						sort: (ret.sort && ret.sort.length > 0) ? ret.sort[0] : null
					});
					if(ret.itemAliases && ret.itemAliases.length > 0)
					{
						this.itemAlias = ret.itemAliases[0];
					}
					else this.itemAlias = kff.defaultItemAlias;
				}
			}
			else
			{
				if(!ret.binderName || !(ret.binderName in kff.View.binders)) break;

				var indexed = false;

				for(var j = ret.formatters.length - 1; j >= 0; j--)
				{
					if(ret.formatters[j].fn.indexed === true) indexed = true;
				}

				var modelBinder = new kff.View.binders[ret.binderName]({
					view: this,
					$element: this.$element,
					params: ret.binderParams,
					keyPath: keyPath,
					modelArgs: modelArgs,
					formatters: ret.formatters,
					parsers: ret.parsers,
					dispatch: ret.dispatch,
					eventNames: ret.eventNames,
					eventFilters: ret.eventFilters,
					fill: ret.fill,
					nopreventdef: ret.nopreventdef,
					indexed: indexed
				});

				this.modelBindersMap.add(modelBinder);
			}
		}
	},

	/**
	 * Parses single binding expression
	 *
	 * @private
	 * @param  {string} result           binding subexpression
	 * @param  {boolean} parseBinderName False for collection binder, true for regular binder
	 * @return {object}                  Object with parsed binding data
	 */
	parseBindingRegexp: function(result, parseBinderName)
	{
		var result2, i, modifierName, modifierParams;

		operatorsRegex.lastIndex = 0;

		var ret = {
			binderName: null,
			binderParams: null,
			formatters: [],
			parsers: [],
			setters: [],
			getters: [],
			eventNames: [],
			eventFilters: [],
			dispatch: null,
			fill: false,
			watchModelPath: false,
			nopreventdef: false,
			itemAliases: [],
			filter: [],
			sort: []
		};

		i = 0;
		while((result2 = operatorsRegex.exec(result[3])) !== null)
		{
			if(parseBinderName && i === 0)
			{
				// Parse binder name and params
				ret.binderName = result2[1];
				ret.binderParams = result2[2];

				if(ret.binderParams)
				{
					ret.binderParams = ret.binderParams.split(commaSeparateRegex);
				}
				else ret.binderParams = [];
			}
			else
			{
				modifierName = result2[1];
				modifierParams = [];

				if(result2[2])
				{
					modifierParams = result2[2].match(modifierSeparateRegex);
				}

				switch(modifierName){
					case 'f':
						this.parseHelpers(modifierParams, ret.formatters);
						break;
					case 'p':
						this.parseHelpers(modifierParams, ret.parsers);
						break;
					case 'on':
						this.parseSetters(modifierParams, ret.eventNames);
						break;
					case 'as':
						this.parseSetters(modifierParams, ret.itemAliases);
						break;
					case 'evf':
						this.parseHelpers(modifierParams, ret.eventFilters);
						break;
					case 'dispatch':
						ret.dispatch = [];
						this.parseSetters(modifierParams, ret.dispatch);
						break;
					case 'filter':
						this.parseSetters(modifierParams, ret.filter);
						break;
					case 'sort':
						this.parseSetters(modifierParams, ret.sort);
						break;
					case 'fill':
						ret.fill = true;
						break;
					case 'nopreventdef':
						ret.nopreventdef = true;
						break;
				}
			}
			i++;
		}
		return ret;
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseHelpers: function(modifierParams, modifiers)
	{
		var modifierParam, modifierArgs;

		for(var j = 0, l = modifierParams.length; j < l; j++)
		{
			modifierParam = modifierParams[j];

			if(j + 1 < l && modifierParams[j + 1].indexOf('{') === 0)
			{
				modifierArgs = modifierParams[j + 1].match(/([^,{}]+)/g);
				j++;
			}
			else
			{
				modifierArgs = [];
			}
			if(this.scope[modifierParam]) modifiers.push({ fn: this.scope[modifierParam], args: modifierArgs });
			else if(kff.View.helpers[modifierParam]) modifiers.push({ fn: kff.View.helpers[modifierParam], args: modifierArgs });
		}
	},

	/**
	 * Parses modifier that accepts one or more parameters
	 * @param  {Array} modifierParams Array of modifier params
	 * @param  {Array} modifiers      Array of modifiers
	 */
	parseGetters: function(modifierParams, modifiers)
	{
		var modifierParam, modifierArgs;

		for(var j = 0, l = modifierParams.length; j < l; j++)
		{
			modifierParam = modifierParams[j];

			if(j + 1 < l && modifierParams[j + 1].indexOf('{') === 0)
			{
				modifierArgs = modifierParams[j + 1].match(/([^,{}]+)/g);
				j++;
			}
			else
			{
				modifierArgs = [];
			}
			for(var i = 0, n = modifierArgs.length; i < n; i++)
			{
				modifierArgs[i] = modifierArgs[i].replace(/^\s+|\s+$/g, '').replace(/^\./, '*.');
			}
			modifiers.push({ fn: modifierParam, args: modifierArgs });
		}
	},

	/**
	 * Parses modifier parameters of binding. Used to create parsers and formatters.
 	 *
	 * @param {Array} modifierParams An arrray with modifier names
	 * @param {Array} modifiers An empty array that will be filled by modifier classes that corresponds to modifier names
	 */
	parseSetters: function(modifierParams, modifiers)
	{
		for(var j = 0; j < modifierParams.length; j++)
		{
			modifiers.push(modifierParams[j]);
		}
	},

	/**
	 * Destroys all bindings
	 */
	destroyBinding: function()
	{
		if(this.modelBindersMap)
		{
			this.modelBindersMap.destroyBinders();
			this.modelBindersMap = null;
		}
	},

	/**
	 * Rebinds cursors of all binders that belong to this view
	 *
	 * @private
	 */
	rebindCursors: function()
	{
		if(this.modelBindersMap) this.modelBindersMap.rebindCursors();
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function(force)
	{
		if(this.modelBindersMap) this.modelBindersMap.refreshBinders(force);
	}

});
})()

kff.BindingView = kff.View;
