
var settings = require('./settings');
var createClass = require('./functions/createClass');
var mixins = require('./functions/mixins');
var immerge = require('./functions/immerge');
var evalObjectPath = require('./functions/evalObjectPath');
var noop = require('./functions/noop');
var arrayConcat = require('./functions/arrayConcat');
var isPlainObject = require('./functions/isPlainObject');
var on = require('./Dom').on;
var off = require('./Dom').off;
var findViewElements = require('./functions/findViewElements');
var nextNode = require('./functions/nextNode');

var ServiceContainer = require('./ServiceContainer');
var Dispatcher = require('./Dispatcher');
var Cursor = require('./Cursor');
var CollectionBinder = require('./CollectionBinder');
var BinderMap = require('./BinderMap');

var bindingRegex = /(?:([_.a-zA-Z0-9*-]+))(?:\(([@.a-zA-Z0-9*,\s-]+)*\))?((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g;

var operatorsRegex = /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g;

var commaSeparateRegex = /\s*,\s*/;

var modifierSeparateRegex = /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\.\s@*]+})/g;

var leadingPeriodRegex = /^\./;

var trailingPeriodRegex = /\.$/;

function parseNamedParams(params)
{
	var namedParams = {};
	var param;
	for(var j = params.length - 2; j >= 1; j -= 2)
	{
		param = params[j];
		if(param[param.length - 1] === ':')
		{
			param = param.slice(0, -1);
			namedParams[param] = params[j + 1];
			params.splice(j, 2);
		}
	}
	return namedParams;
}

var View = createClass(
{
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
		 * @param {Binder} binder Binder class to register
		 */
		registerBinder: function(alias, binder)
		{
			View.binders[alias] = binder;
		},

		/**
		 * Registers helper function to be used as parser/formatter
		 *
		 * @param {string} alias Name of helper function
		 * @param {function} helper Helper function
		 */
		registerHelper: function(alias, helper)
		{
			View.helpers[alias] = helper;
		}
	}
},
/** @lends View.prototype */
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

		this._modelBindersMap = null;
		this._collectionBinder = null;
		this._bindingIndex = null;
		this._itemAlias = null;

		this._subviewsStruct = null;
		this._explicitSubviewsStruct = null;
		this._cachedRegions = null;
		this._pendingRefresh = false;
		this._subviewsArgs = null;
		this._isRunning = false;
		this._isSuspended = false;
		this.subviews = null;
		this.serviceContainer = null;

		if(options.scope)
		{
			this.scope = options.scope;
			options.scope = null;
		}
		else this.scope = {};

		if(options.serviceContainer)
		{
			this.serviceContainer = options.serviceContainer;
		}

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
			this.element = options.element
			options.element = null;
		}

		if(options.dispatcher)
		{
			this.dispatcher = options.dispatcher;
		}
		else this.dispatcher = null;

		if(options.actions)
		{
			this.actions = options.actions;
		}
		else this.actions = null;

		if(options.env)
		{
			this.env = options.env;
		}

		if(options.regions)
		{
			this.regions = options.regions;
		}
		else this.regions = null;

		this.options = options;
	},


	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	render: noop,

	/**
	 * Runs the view. It will be called automatically. Should not be called
	 * directly.
	 */
	run: noop,

	afterRun: noop,

	suspend: noop,

	resume: noop,

	/**
	 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
	 */
	refresh: noop,

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 */
	destroy: noop,

	initAll: function()
	{
		this.renderAll();
		this.runAll();
		this.afterRunAll();
	},

	/**
	 * Renders the view. It will be called automatically. Should not be called
	 * directly.
	 */
	renderAll: function()
	{
		if(!this._modelBindersMap) this.initBinding();
		if(!this._collectionBinder)
		{
			if(!this.serviceContainer) this.serviceContainer = new ServiceContainer();
			this._explicitSubviewsStruct = null;
			this.renderRegions(this.regions);
			if(this.render !== noop) this.render();
			this.renderSubviews();
		}
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function()
	{
		if(this._collectionBinder)
		{
			this.runSubviews();
		}
		else
		{
			if(this._modelBindersMap) this._modelBindersMap.initBinders();

			if(this.run !== noop) this.run();
			this.runSubviews();

			this.delegateEvents();

			if(this.actions)
			{
				if(!this.dispatcher) this.dispatcher = new Dispatcher();
				this.dispatcher.registerActions(this.actions);
			}

			if(this.dispatcher)
			{
				this.dispatcher.on('refresh', this.f('refreshAll'));
				this.dispatcher.on('refreshFromRoot', this.f('refreshFromRoot'));
				this.dispatcher.on('dispatcher:noaction', this.f('dispatchNoAction'));
			}

			if(typeof this.afterRender === 'function') this.afterRender();

			this.element.setAttribute(settings.DATA_RENDERED_ATTR, true);

			this.refreshOwnBinders(true);
		}
		this._isRunning = true;
	},

	afterRunAll: function()
	{
		if(this._modelBindersMap)
		{
			this._modelBindersMap.afterRun();
		}
		if(this._collectionBinder)
		{
			this.afterRunSubviews();
		}
		else
		{
			if(this.afterRun !== noop) this.afterRun();
			this.afterRunSubviews();
		}
	},

	isSuspended: function()
	{
		return this._isSuspended;
	},

	suspendAll: function()
	{
		if(!this._isSuspended)
		{
			if(this._collectionBinder)
			{
				this.suspendSubviews();
			}
			else
			{
				this._isSuspended = true;
				if(this.suspend !== noop) this.suspend();
				this.suspendSubviews();
			}
		}
	},

	resumeAll: function()
	{
		if(this._isSuspended)
		{
			if(this._collectionBinder)
			{
				this.resumeSubviews();
			}
			else
			{
				this._isSuspended = false;
				if(this.resume !== noop) this.resume();
				this.resumeSubviews();
			}
		}
	},

	dispatchNoAction: function(event)
	{
		if(this.parentView)
		{
			this.parentView.dispatchEvent(event.value);
		}
	},

	requestRefreshAll: function()
	{
		if(this.env.window.requestAnimationFrame)
		{
			if(!this._pendingRefresh)
			{
				this._pendingRefresh = true;
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
		if(this._isRunning && !this._isSuspended)
		{
			var shouldRefresh = true;
			if(typeof this.shouldRefresh === 'function') shouldRefresh = this.shouldRefresh();
			if(shouldRefresh)
			{
				if(typeof this.refresh === 'function') this.refresh();
				if(this._collectionBinder)
				{
					this._collectionBinder.refreshBoundViews();
					this._collectionBinder.refreshAll();
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
			}
			this._pendingRefresh = false;
		}
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

		if(this._collectionBinder) this._collectionBinder.destroyBoundViews();

		this._modelBindersMap = null;
		this._collectionBinder = null;
		this._bindingIndex = null;
		this._itemAlias = null;

		this.element.removeAttribute(settings.DATA_RENDERED_ATTR);
		this.undelegateEvents();
		this.destroySubviews();
		if(this.dispatcher)
		{
			this.dispatcher.off('refresh', this.f('refreshAll'));
			this.dispatcher.off('refreshFromRoot', this.f('refreshFromRoot'));
			this.dispatcher.off('dispatcher:noaction', this.f('dispatchNoAction'));
		}

		if(this.destroy !== noop) this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this._subviewsStruct = null;
		this._explicitSubviewsStruct = null;
		this.subviews = null;
		this._isRunning = false;
		this._isSuspended = false;

		this.clearRegions(this.regions);
	},

	/**
	 * Renders subviews. Will find all DOM descendats with
	 * settings.DATA_KFF_VIEW (or settings.DATA_BIND_ATTR) attribute and
	 * initializes subviews on them. If an element has the
	 * settings.DATA_BIND_ATTR but not the settings.DATA_KFF_VIEW attribute,
	 * adds settings.DATA_KFF_VIEW attribute = "View" and inits
	 * implicit data-binding.
	 */
	renderSubviews: function()
	{
		if(!this._collectionBinder)
		{
			var i, l, element = this.element,
				subView, options, opt, rendered, subviewsStruct = null;

			if(element) this._subviewsStruct = findViewElements(element);

			if(this._explicitSubviewsStruct !== null)
			{
				if(this._subviewsStruct === null) this._subviewsStruct = [];
				subviewsStruct = arrayConcat(this._subviewsStruct, this._explicitSubviewsStruct);
			}
			else if(this._subviewsStruct !== null) subviewsStruct = this._subviewsStruct.slice();

			// Render subviews
			if(subviewsStruct !== null)
			{
				for(i = 0, l = subviewsStruct.length; i < l; i++)
				{
					options = subviewsStruct[i].options;
					options.element = subviewsStruct[i].element;
					options.env = this.env;
					subView = this.createView(subviewsStruct[i].viewName, options);
					if(subView instanceof View)
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
		if(this._collectionBinder)
		{
			this._collectionBinder.renderBoundViews();
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

	afterRunSubviews: function()
	{
		if(this.subviews)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i].afterRunAll();
			}
		}
	},

	suspendSubviews: function()
	{
		if(this.subviews)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i].suspendAll();
			}
		}
	},

	resumeSubviews: function()
	{
		if(this.subviews)
		{
			for(var i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i].resumeAll();
			}
		}
	},

	/**
	 * Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
	destroySubviews: function()
	{
		if(this._collectionBinder)
		{
			this._collectionBinder.destroyBoundViews();
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
			this._subviewsStruct = null;
		}
	},

	/**
	 * Destroys and renders+runs the view with optional new html content
	 * @param  {string} html HTML tepmlate (optional)
	 */
	rerender: function(html)
	{
		this.destroyAll();
		if(html !== undefined) this.element.innerHTML = html;
		this.initAll();
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
		keyPath = keyPath.slice(1);
		var rootCursor = this.scope[rootCursorName];
		if(!(rootCursor instanceof Cursor)) rootCursor = new Cursor(rootCursor, keyPath);

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
	 * @param {DOMElement} element A DOM element to bind. If not provided, the view element will be used.
	 */
	delegateEvents: function(events, element)
	{
		var event, i, l, fn;
		this.undelegateEvents(events, element);
		events = events || this.domEvents;

		if(!element)
		{
			element = this.element;
			if(this.env && element === this.env.document.body) element = this.env.document;
		}

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length >= 3)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];

				if(typeof event[1] === 'string') on(this.handlers, element, event[0], event[1], fn);
				else event[1].on(event[0], fn);
			}
			else if(event.length === 2)
			{
				if(typeof event[1] === 'string') fn = this.f(event[1]);
				else fn = event[1];
				on(this.handlers, element, event[0], fn);
			}
		}
	},

	/**
	 * Unbinds DOM events from the view element. Accepts array of arrays as in
	 * the delegateEvents method.
	 *
	 * @param {Array} events Array of arrays of binding config
	 * @param {DOMElement} element A DOM element to unbind. If not provided, the view element will be used.
	 */
	undelegateEvents: function(events, element)
	{
		var event, i, l, fn;
		events = events || this.domEvents;
		if(!this.handlers) this.handlers = {};

		if(!element)
		{
			element = this.element;
			if(this.env && element === this.env.document.body) element = this.env.document;
		}

		for(i = 0, l = events.length; i < l; i++)
		{
			event = events[i];
			if(event.length >= 3)
			{
				if(typeof event[2] === 'string') fn = this.f(event[2]);
				else fn = event[2];

				if(typeof event[1] === 'string') off(this.handlers, element, event[0], event[1]);
				else event[1].off(event[0], fn);
			}
			else if(event.length === 2)
			{
				if(typeof event[1] === 'string') fn = this.f(event[1]);
				else fn = event[1];

				off(this.handlers, element, event[0], fn);
			}
		}
	},

	/**
	 * Creates a new subview and adds it to the internal subviews list.
	 * Do not use this method directly, use addSubview method instead.
	 *
	 * @private
	 * @param  {String} viewName Name of the view
	 * @param  {Object} options  Options object for the subview constructor
	 * @return {View}        Created view
	 */
	createView: function(viewName, options)
	{
		var subView, args;

		if(this._subviewsArgs && this._subviewsArgs[viewName] instanceof Array)
		{
			args = this._subviewsArgs[viewName];
			if(typeof args[0] === 'object' && args[0] !== null) options = immerge(options, args[0]);
		}

		options.parentView = this;

		if(viewName === 'View') subView = new View(options);
		else if(viewName in this.scope) subView = new this.scope[viewName](options);
		else subView = this.serviceContainer.getService(viewName, [options]);
		if(subView instanceof View)
		{
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
		if(this._explicitSubviewsStruct === null) this._explicitSubviewsStruct = [];
		this._explicitSubviewsStruct.push({
			viewName: viewName,
			element: element,
			options: options || {}
		});
	},

	/**
	 * Registers a new view service to the local service container
	 *
	 * @public
	 */
	registerSubview: function(viewName, construct, options)
	{
		if(this.parentView.serviceContainer === this.serviceContainer)
		{
			this.serviceContainer = new ServiceContainer();
			this.serviceContainer.setParent(this.parentView.serviceContainer);
		}

		var services = {};

		services[viewName] = {
			construct: construct,
			args: [options]
		};

		this.serviceContainer.registerServices(services, true);
	},

	setSubviewsArgs: function(subviewsArgs)
	{
		if(subviewsArgs)
		{
			if(this.parentView === null)
			{
				this._subviewsArgs = subviewsArgs;
			}
			else if(this._subviewsArgs)
			{
				var keys = Object.keys(subviewsArgs);
				for(var i = 0, l = keys.length; i < l; i++)
				{
					key = keys[i];
					this._subviewsArgs[key] = subviewsArgs[key];
				}
			}
			else
			{
				this._subviewsArgs = subviewsArgs;
			}
		}
	},

	setTemplate: function(region, template)
	{
		if(arguments.length === 1)
		{
			template = region;
			region = 'self';
		}
		if(this.regions == null)
		{
			this.regions = {};
		}
		this.regions[region] = template;
	},

	/**
	 * Refreshes data-binders in all subviews.
	 *
	 * @param  {Object} event Any event object that caused refreshing
	 */
	refreshBinders: function(force)
	{
		if(this._collectionBinder)
		{
			this._collectionBinder.refreshBinders(force);
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
		if(this._collectionBinder)
		{
			this._collectionBinder.refreshIndexedBinders();
		}
		else
		{
			if(this._modelBindersMap)
			{
				this._modelBindersMap.refreshIndexedBinders();
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
		if(!this._isSuspended)
		{
			var res, view = this;
			while(view)
			{
				if(view.dispatcher !== null && view.dispatcher.hasAction(event.type))
				{
					if(process.env.NODE_ENV !== 'production')
					{
						try {
							view.dispatcher.trigger(event);
						}
						catch(e)
						{
							console.error('Caught exception in ' + this.element.getAttribute('data-kff-view') + '#dispatchEvent');
							console.info('View element', this.element);
							console.info('View object', this);
							console.info('Action object', event);
							console.info('Original error follows…');
							if(this.element)
							{
								this.element.scrollIntoView();
								this.element.style.outline = '2px dashed red';
							}
							throw(e);
						}
					}
					else
					{
						view.dispatcher.trigger(event);
					}
					break;
				}
				view = view.parentView;
			}
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
		if(this._bindingIndex !== null && this.scope.hasOwnProperty(modelName)) return this._bindingIndex;
		if(this.parentView instanceof View) return this.parentView.getBindingIndex(modelName);
		return null;
	},

	/**
	 * Sets current binding index
	 *
	 * @private
	 */
	setBindingIndex: function(index)
	{
		this._bindingIndex = index;
	},


	/**
	 * Clones this binding view
	 *
	 * @return {View} Cloned view
	 */
	clone: function()
	{
		var l;
		var clonedSubview;
		var options = this.options;

		options.parentView = null;
		options.env = this.env;

		var clonedView = new this.constructor(options);
		clonedView.serviceContainer = this.serviceContainer;

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

		if(this._subviewsStruct !== null)
		{
			clonedView._subviewsStruct = this._subviewsStruct.slice();
		}
		if(this._explicitSubviewsStruct !== null)
		{
			clonedView._explicitSubviewsStruct = this._explicitSubviewsStruct.slice();
		}
		if(this._cachedRegions)
		{
			clonedView._cachedRegions = this._cachedRegions;
			clonedView.cloneCachedRegions();
		}

		if(this._collectionBinder)
		{
			clonedView._collectionBinder = new CollectionBinder(
			{
				view: clonedView,
				keyPath: this._collectionBinder.keyPath,
				animate: this._collectionBinder.animate,
				keyProp: this._collectionBinder.keyProp,
				collection: null,
				collectionPathArray: this._collectionBinder.collectionPathArray
			});
		}

		if(this._modelBindersMap)
		{
			clonedView._modelBindersMap = this._modelBindersMap.clone();
			clonedView._modelBindersMap.setView(clonedView);
		}
		clonedView._itemAlias = this._itemAlias;

		return clonedView;
	},

	setParentView: function(parentView)
	{
		var oldScope, key, i, l;

		this.parentView = parentView;

		oldScope = this.scope || null;

		this.scope = Object.create(parentView.scope);

		if(oldScope)
		{
			var keys = Object.keys(oldScope);
			for(i = 0, l = keys.length; i < l; i++)
			{
				key = keys[i];
				this.scope[key] = oldScope[key];
			}
		}

		if(parentView.serviceContainer !== this.serviceContainer)
		{
			if(this.serviceContainer)
			{
				this.serviceContainer.setParent(parentView.serviceContainer);
			}
			else
			{
				this.serviceContainer = parentView.serviceContainer;
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

	/**
	 * Rebinds the view to another DOM element
	 *
	 * @private
	 * @param  {DOMELement} element New DOM element of the view
	 */
	rebindElement: function(element)
	{
		var i, l;

		this.element = element;

		this.rebindSubViews(element, {
			subviewIndex: 0,
			subviewsStructIndex: 0,
			index: 0
		});

		if(this._modelBindersMap)
		{
			this._modelBindersMap.setView(this);
		}

		if(this._collectionBinder)
		{
			this._collectionBinder.view = this;
		}

	},

	rebindSubViews: function(el, ids)
	{
		var node = el, doSubviews = true;
		var subviews = this.subviews, subviewsStruct = this._subviewsStruct;
		if(subviewsStruct !== null)
		{
			if(subviews === null) this.subviews = subviews = [];

			while((node = nextNode(el, node, doSubviews)) !== null)
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

		if(isPlainObject(regions))
		{
			if(!this._cachedRegions) this._cachedRegions = {};
			if('self' in regions) saveRegion(regions, this._cachedRegions, [this.element], 'self');
			for(selector in regions)
			{
				if(selector !== 'self')
				{
					saveRegion(regions, this._cachedRegions, this.element.querySelectorAll(selector), selector);
				}

			}
		}
	},

	clearRegions: function(regions)
	{
		var selector, i, l, nodes, node, fragment;

		var unsaveRegion = function(regions, cachedRegions, nodes, sel)
		{
			var node, fragment;
			for(var i = nodes.length - 1; i >= 0; i--)
			{
				node = nodes[i];
				node.innerHTML = '';
				if(cachedRegions[sel])
				{
					fragment = cachedRegions[sel][i];
					if(fragment)
					{
						node.appendChild(fragment);
						cachedRegions[sel][i] = null;
					}
				}
			}
		};

		if(isPlainObject(regions))
		{
			if('self' in regions) unsaveRegion(regions, this._cachedRegions, [this.element], 'self');
			for(selector in regions)
			{
				if(selector !== 'self')
				{
					unsaveRegion(regions, this._cachedRegions, this.element.querySelectorAll(selector), selector);
				}
			}
		}
	},

	cloneCachedRegions: function()
	{
		var selector, i, l, nodes, node, fragment;
		if(this._cachedRegions)
		{
			for(selector in this._cachedRegions)
			{
				fragments = this._cachedRegions[selector];
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
		var dataBindAttr = this.element.getAttribute(settings.DATA_BIND_ATTR);
		var modelName;

		bindingRegex.lastIndex = 0;

		this._modelBindersMap = new BinderMap();

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
						modelArgs[k] = modelArgs[k].slice(1).replace(leadingPeriodRegex, '*.').replace(trailingPeriodRegex, '.*').split('.');
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
					this._collectionBinder = new CollectionBinder({
						view: this,
						keyPath: keyPath,
						collectionArgs: modelArgs,
						filter: (ret.filter && ret.filter.length > 0) ? ret.filter[0] : null,
						sort: (ret.sort && ret.sort.length > 0) ? ret.sort[0] : null,
						animate: (ret.animate && ret.animate.length > 0) ? ret.animate[0] : null,
						keyProp: (ret.keyProp && ret.keyProp.length > 0) ? ret.keyProp[0] : null
					});
					if(ret.itemAliases && ret.itemAliases.length > 0)
					{
						this._itemAlias = ret.itemAliases[0];
					}
					else this._itemAlias = settings.defaultItemAlias;
				}
			}
			else
			{
				if(!ret.binderName || !(ret.binderName in View.binders)) break;

				var indexed = false;

				for(var j = ret.formatters.length - 1; j >= 0; j--)
				{
					if(ret.formatters[j].fn.indexed === true) indexed = true;
				}

				var modelBinder = new View.binders[ret.binderName]({
					view: this,
					element: this.element,
					params: ret.binderParams,
					keyPath: keyPath,
					modelArgs: modelArgs,
					formatters: ret.formatters,
					parsers: ret.parsers,
					dispatch: ret.dispatch,
					dispatchNamedParams: ret.dispatchNamedParams,
					eventNames: ret.eventNames,
					eventFilters: ret.eventFilters,
					fill: ret.fill,
					nopreventdef: ret.nopreventdef,
					animate: (ret.animate && ret.animate.length > 0) ? ret.animate[0] : null,
					indexed: indexed
				});

				this._modelBindersMap.add(modelBinder);
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
			dispatchNamedParams: null,
			fill: false,
			watchModelPath: false,
			nopreventdef: false,
			animate: [],
			keyProp: [],
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
						ret.dispatchNamedParams = parseNamedParams(ret.dispatch);
						break;
					case 'filter':
						this.parseSetters(modifierParams, ret.filter);
						break;
					case 'sort':
						this.parseSetters(modifierParams, ret.sort);
						break;
					case 'animate':
						this.parseSetters(modifierParams, ret.animate);
						break;
					case 'key':
						this.parseSetters(modifierParams, ret.keyProp);
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
			else if(View.helpers[modifierParam]) modifiers.push({ fn: View.helpers[modifierParam], args: modifierArgs });
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
		if(this._modelBindersMap)
		{
			this._modelBindersMap.destroyBinders();
			this._modelBindersMap = null;
		}
	},

	/**
	 * Rebinds cursors of all binders that belong to this view
	 *
	 * @private
	 */
	rebindCursors: function()
	{
		if(this._modelBindersMap) this._modelBindersMap.rebindCursors();
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function(force)
	{
		if(this._modelBindersMap) this._modelBindersMap.refreshBinders(force);
	}

});


(function(){
	var index = function(v, modelName)
	{
		var bindingIndex = this.getBindingIndex(modelName);
		if(bindingIndex !== null) return bindingIndex;
		return v;
	};
	index.indexed = true;
	View.registerHelper('index', index);

	var indexFromOne = function(v, modelName)
	{
		var bindingIndex = this.getBindingIndex(modelName);
		if(bindingIndex !== null) return bindingIndex + 1;
		return v;
	};
	indexFromOne.indexed = true;
	View.registerHelper('indexFromOne', indexFromOne);

})();


View.registerHelper('boolean', function(v)
{
	var parsed = parseInt(v, 10);
	if(!isNaN(parsed)) return !!parsed;
	return v === 'true';
});

View.registerHelper('not', function(v)
{
	return !v;
});

View.registerHelper('null', function(v)
{
	return v === null || v === 'null' ? null : v;
});

View.registerHelper('int', function(v)
{
	v = parseInt(v, 10);
	if(isNaN(v)) v = 0;
	return v;
});

View.registerHelper('float', function(v)
{
	v = parseFloat(v);
	if(isNaN(v)) v = 0;
	return v;
});

View.registerHelper('string', function(v)
{
	return v.toString();
});

module.exports = View;

