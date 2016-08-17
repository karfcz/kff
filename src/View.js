
var settings = require('./settings');
var createClass = require('./functions/createClass');
var mixins = require('./functions/mixins');
var immerge = require('./functions/immerge');
var evalObjectPath = require('./functions/evalObjectPath');
var noop = require('./functions/noop');
var arrayConcat = require('./functions/arrayConcat');
var isPlainObject = require('./functions/isPlainObject');
var on = require('./functions/on');
var off = require('./functions/off');
var findViewElements = require('./functions/findViewElements');
var nextNode = require('./functions/nextNode');

var Dispatcher = require('./Dispatcher');
var Cursor = require('./Cursor');
var CollectionBinder = require('./CollectionBinder');
var BinderMap = require('./BinderMap');
var matchBindings = require('./functions/parseBinding').matchBindings;


var push = Array.prototype.push;

function mixin(obj, properties)
{
	var key;
	var keys = Object.keys(properties);

	for(var j = 0, k = keys.length; j < k; j++)
	{
		key = keys[j];
		obj[key] = properties[key];
	}

	return obj;
}

function actionSet(event)
{
	event.cursor.set(event.value);
	return {
		type: 'refreshFromRoot'
	};
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
		this._pendingRefresh = false;
		this._subviewsArgs = null;
		this._isRunning = false;
		this._isSuspended = false;
		this._template = null;
		this._isolated = false;
		this.subviews = null;

		if(options.isolated)
		{
			this._isolated = true;
		}

		if(options.parentView)
		{
			this.scope = options.scope || null;
			this._setParentView(options.parentView);
		}
		else if(options.scope) this.scope = mixin({}, options.scope);
		else this.scope = {};

		options.scope = null;

		if(options.events)
		{
			this.domEvents = options.events.slice();
		}
		else this.domEvents = [];

		if(options.dispatcher)
		{
			this.dispatcher = options.dispatcher;
		}
		else this.dispatcher = null;

		if(options.actions)
		{
			this.actions = mixin({
				set: actionSet
			}, options.actions);
		}
		else if((this.parentView == null || this._isolated )&& !options._clone)
		{
			this.actions = {
				set: actionSet
			};
		}
		else this.actions = null;

		if(options.env)
		{
			this.env = options.env;
		}
		else this.env = { document: document, window: window };

		if(options.element)
		{
			this.element = options.element
			options.element = null;
		}
		else this.element = this.env.document.body;

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
		if(!this._modelBindersMap) this._initBinding();
		if(!this._collectionBinder)
		{
			this._explicitSubviewsStruct = null;

			if(this._template) this.element.innerHTML = this._template;

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
				this.dispatcher.on('dispatcher:noaction', this.f('_dispatchNoAction'));
			}

			if(typeof this.afterRender === 'function') this.afterRender();

			this.element.setAttribute(settings.DATA_RENDERED_ATTR, true);

			this._refreshOwnBinders(true);
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
					this._rebindCursors();
					this._refreshOwnBinders();
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
		this._destroyBinding();

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
			this.dispatcher.off('dispatcher:noaction', this.f('_dispatchNoAction'));
		}

		if(this.destroy !== noop) this.destroy();
		if(typeof this.afterDestroy === 'function') this.afterDestroy();

		this._subviewsStruct = null;
		this._explicitSubviewsStruct = null;
		this.subviews = null;
		this._isRunning = false;
		this._isSuspended = false;
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
		if(!Array.isArray(events))
		{
			if(arguments.length === 2 || arguments.length === 3) this.domEvents.push(Array.prototype.slice.apply(arguments));
			return;
		}
		else if(!Array.isArray(events[0]))
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

		if(this._subviewsArgs && Array.isArray(this._subviewsArgs[viewName]))
		{
			args = this._subviewsArgs[viewName];
			if(typeof args[0] === 'object' && args[0] !== null) options = immerge(options, args[0]);
		}

		options.parentView = this;

		if(viewName === 'View') subView = new View(options);
		else if(viewName in this.scope) subView = new this.scope[viewName](options);
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

	setTemplate: function(template)
	{
		this._template = template;
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
			this._refreshOwnBinders(force);
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
				if(view._isolated) view = null;
				else view = view.parentView;
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

	_dispatchNoAction: function(event)
	{
		if(this.parentView)
		{
			this.parentView.dispatchEvent(event.value);
		}
	},

	/**
	 * Clones this binding view
	 *
	 * @return {View} Cloned view
	 */
	_clone: function()
	{
		var l;
		var clonedSubview;
		var options = this.options;

		options.parentView = null;
		options.env = this.env;
		options._clone = true;

		var clonedView = new this.constructor(options);

		if(this.subviews !== null)
		{
			l = this.subviews.length;
			clonedView.subviews = new Array(l);
			while(l--)
			{
				clonedSubview = this.subviews[l]._clone();
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

	_setParentView: function(parentView)
	{
		var oldScope, key, i, l;

		this.parentView = parentView;

		if(!this._isolated)
		{
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
		}

		if(!this.scope) this.scope = {};

		if(this.subviews !== null)
		{
			for(i = 0, l = this.subviews.length; i < l; i++)
			{
				this.subviews[i]._setParentView(this);
			}
		}
	},

	/**
	 * Rebinds the view to another DOM element
	 *
	 * @private
	 * @param  {DOMELement} element New DOM element of the view
	 */
	_rebindElement: function(element)
	{
		var i, l;

		this.element = element;

		this._rebindSubViews(element, {
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

	_rebindSubViews: function(el, ids)
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
							subviews[ids.subviewIndex]._rebindElement(node);
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

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	_initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, i, ret, modelArgs;
		var dataBindAttr = this.element.getAttribute(settings.DATA_BIND_ATTR);
		var modelName;

		this._modelBindersMap = new BinderMap();

		if(dataBindAttr == null) return;

		var parsedBindings = matchBindings(dataBindAttr);

		if(process.env.NODE_ENV !== 'production')
		{
			if(parsedBindings.error)
			{
				if(this.element && this.element.parentNode)
				{
					this.element.parentNode.scrollIntoView();
					this.element.parentNode.style.outline = '2px dashed red';
				}
				console.error('Error parsing binding expression: ');
				console.error(parsedBindings.error);
				console.log(this.element);
			}
		}

		if(parsedBindings.match && parsedBindings.match.bindings)
		{
			parsedBindings = parsedBindings.match.bindings;

			for(var i = 0, l = parsedBindings.length; i < l; i++)
			{
				var parsedBinding = parsedBindings[i];

				if(parsedBinding.binder === 'each')
				{
					if(process.env.NODE_ENV !== 'production')
					{
						if(this._collectionBinder)
						{
							if(this.element && this.element.parentNode)
							{
								this.element.parentNode.scrollIntoView();
								this.element.parentNode.style.outline = '2px dashed red';
							}
							console.error('You cannot have two :each binders on the same element');
							console.log(this.element);
						}
					}
					if(!this.options.isBoundView)
					{
						var animate = null;
						var keyProp = null;
						var alias = null;

						if(parsedBinding.operators)
						{
							for(var j = 0, k = parsedBinding.operators.length; j < k; j++)
							{
								var operator = parsedBinding.operators[j];
								if(operator.args.length >= 1 && operator.args[0].type === 'ident')
								{
									if(operator.name === 'animate') animate = operator.args[0].value;
									if(operator.name === 'key') keyProp = operator.args[0].value;
									if(operator.name === 'as') alias = operator.args[0].value;
								}
							}
						}

						this._collectionBinder = new CollectionBinder({
							view: this,
							keyPath: parsedBinding.keyPath,
							collectionArgs: parsedBinding.modelArgs,
							animate: animate,
							keyProp: keyProp
						});

						if(alias)
						{
							this._itemAlias = alias;
						}
						else this._itemAlias = settings.defaultItemAlias;
					}
				}
				else
				{
					if(!(parsedBinding.binder in View.binders)) break;

					var scope = this.scope;
					var isIdent = function(v){ return v != null && v.type === 'ident'; }
					var identToParser = function(v)
					{
						if(scope[v.value]) return { fn: scope[v.value], args: [] };
						else if(View.helpers[v.value]) return { fn: View.helpers[v.value], args: [] };
					}
					var argToValue = function(v)
					{
						return v.value;
					}
					var isNotNull = function(v)
					{
						return v != null;
					}

					var binderConfig = {
						view: this,
						element: this.element,
						params: parsedBinding.binderArgs.filter(isNotNull),
						keyPath: parsedBinding.keyPath,
						modelArgs: parsedBinding.modelArgs.filter(isNotNull),
						formatters: [],
						parsers: [],
						dispatch: null,
						// dispatchNamedParams: ret.dispatchNamedParams,
						eventNames: [],
						eventFilters: null,
						fill: false,
						nopreventdef: false,
						animate: null,
						indexed: false
					};


					for(var j = 0, k = parsedBinding.operators.length; j < k; j++)
					{
						var operator = parsedBinding.operators[j];
						switch(operator.name)
						{
							case 'format':
							case 'f':
								binderConfig.formatters = operator.args.filter(isIdent).map(identToParser);
								break;
							case 'parse':
							case 'p':
								binderConfig.parsers = operator.args.filter(isIdent).map(identToParser);
								break;
							case 'dispatch':
								if(operator.args.length > 0)
								{
									binderConfig.dispatch = operator.args;
								}
								break;
							case 'on':
								if(operator.args.length > 0)
								{
									binderConfig.eventNames = operator.args.filter(isIdent).map(argToValue);
								}
								break;
							case 'evf':
								binderConfig.eventFilters = operator.args.filter(isIdent).map(identToParser);
								break;
							case 'fill':
								binderConfig.fill = true;
								break;
							case 'nopreventdef':
								binderConfig.nopreventdef = true;
								break;
							case 'animate':
								binderConfig.animate = operator.args[0].value;
								break;
						}
					}

					for(var j = binderConfig.formatters.length - 1; j >= 0; j--)
					{
						if(binderConfig.formatters[j].fn.indexed === true) binderConfig.indexed = true;
					}

					var modelBinder = new View.binders[parsedBinding.binder](binderConfig);

					this._modelBindersMap.add(modelBinder);
				}
			}
		}

		// Check for invalid combination of :each and :if binders:
		if(process.env.NODE_ENV !== 'production')
		{
			var ifBinders = this._modelBindersMap.binders.filter(function(binder){ return binder instanceof View.binders.if || binder instanceof View.binders.ifnot; });

			if(this._collectionBinder && ifBinders.length > 0)
			{
				if(this.element && this.element.parentNode)
				{
					this.element.parentNode.scrollIntoView();
					this.element.parentNode.style.outline = '2px dashed red';
				}
				console.error('You cannot combine :each binder with :if binder on the same element');
				console.log(this.element);
			}

			if(ifBinders.length > 2)
			{
				if(this.element && this.element.parentNode)
				{
					this.element.parentNode.scrollIntoView();
					this.element.parentNode.style.outline = '2px dashed red';
				}
				console.error('You cannot combine multiple :if binders on the same element');
				console.log(this.element);
			}
		}

	},

	/**
	 * Destroys all bindings
	 */
	_destroyBinding: function()
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
	_rebindCursors: function()
	{
		if(this._modelBindersMap) this._modelBindersMap.rebindCursors();
	},

	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	_refreshOwnBinders: function(force)
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

