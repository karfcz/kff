
var settings = require('./settings');
var createClass = require('./functions/createClass');
var arrayIndexOf = require('./functions/arrayIndexOf');
var callModelAsFunction = require('./functions/callModelAsFunction');
var defaultInsertBefore = require('./functions/nodeMan').insertBefore;
var defaultRemoveChild = require('./functions/nodeMan').removeChild;

var CollectionBinder = createClass(
/** @lends Binder.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(options)
	{
		this.collection = null;
		this.keyPath = options.keyPath;
		this.collectionArgs = options.collectionArgs;
		this.view = options.view;
		this.elementTemplate = null;
		this.boundViews = null;
		this.anchor = null;
		this.viewTemplate = null;
		this.animate = options.animate;
	},

	/**
	 * Renders "bound" views.
	 * This method generates DOM elements corresponding to each item in the bound collection and
	 * creates the bindingView for each element. If the collection changes, it reflects those changes
	 * automatically in real time.
	 *
	 * @private
	 */
	renderBoundViews: function()
	{
		this.anchor = this.view.env.document.createTextNode('');
		var el = this.view.element;

		if(el.parentNode)
		{
			el.parentNode.insertBefore(this.anchor, el.nextSibling);
			el.parentNode.removeChild(el);
		}

		this.boundViews = [];

		// Boundview options:
		this.boundViewName = this.view.element.getAttribute(settings.DATA_VIEW_ATTR);
		var opt = this.view.element.getAttribute(settings.DATA_OPTIONS_ATTR);

		this.boundViewOptions = opt ? JSON.parse(opt) : {};
		this.boundViewOptions.parentView = this.view;
		this.boundViewOptions.serviceContainer = this.view.serviceContainer;
		this.boundViewOptions.env = this.view.env;
		this.boundViewOptions.isBoundView = true;

		this.refreshBoundViews();
	},

	/**
	 * Destroys previously bound views.
	 *
	 * @private
	 */
	destroyBoundViews: function()
	{
		var boundView, i, l;

		// Destroy boundviews
		if(this.boundViews !== null)
		{
			for(i = 0, l = this.boundViews.length; i < l; i++)
			{
				boundView = this.boundViews[i];
				boundView.destroyAll();
				if(boundView.element && boundView.element.parentNode) boundView.element.parentNode.removeChild(boundView.element);
			}
			this.boundViews = null;
		}

		if(this.anchor)
		{
			if(this.anchor.parentNode)
			{
				this.anchor.parentNode.insertBefore(this.view.element, this.anchor.nextSibling);
				this.anchor.parentNode.removeChild(this.anchor);
			}
			this.anchor = null;
		}
		if(this.elementTemplate)
		{
			if(this.elementTemplate.parentNode)
			{
				this.elementTemplate.parentNode.removeChild(this.elementTemplate);
			}
			this.elementTemplate = null;
		}
		this.viewTemplate = null;
		if(this.collection) this.collection = null;
	},

	refreshAll: function()
	{
		if(this.boundViews !== null)
		{
			for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshAll();
		}
	},

	/**
	 * Updates bound views when collection changes.
	 *
	 * @private
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		this.refreshBoundViewsAll();
	},

	rebindCollection: function()
	{
		this.cursor = this.view.getCursor(this.keyPath);
		this.collection = this.cursor.get();

		if(typeof this.collection === 'function')
		{
			this.collection = callModelAsFunction.call(this.view, this.collection, this.collectionArgs);
		}
		if(!(this.collection instanceof Array)) this.collection = [];
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		var boundView, i, l, el, a;
		var lastView, lastChild, parentNode, item;
		var insertBefore = defaultInsertBefore;
		var removeChild = defaultRemoveChild;
		var oldCollection = this.collection;

		if(this.animate)
		{
			insertBefore = this.view.scope[this.animate]['insert'];
			removeChild = this.view.scope[this.animate]['remove'];
		}

		this.rebindCollection();

		// This will speed up rendering but requires strictly immutable collections
		// if(oldCollection === this.collection) return;

		if(this.boundViews === null) this.boundViews = [];

		if(this.boundViews.length === 0)
		{
			// Fast initial rendering:
			l = this.collection.length;
			if(l > 0)
			{
				a = this.collection;
				lastChild = this.anchor;
				if(this.anchor && this.anchor.parentNode)
				{
					parentNode = this.anchor.parentNode;
					for(i = 0; i < l; i++)
					{
						boundView = this.createBoundView(a[i]);
						this.boundViews[i].runAll();
						this.boundViews[i].afterRunAll();
						el = boundView.element;
						insertBefore(parentNode, lastChild.nextSibling, el);
						lastChild = el;
					}
				}
			}
		}
		else
		{
			// Diff based rendering:
			var newBoundViews = [];
			var recycledViews = [];

			// Merge old and new bound view arrays:
			var tempBoundViews = [];
			var newCollection = this.collection;
			for(i = 0, l = Math.max(oldCollection.length, newCollection.length); i < l; i++)
			{
				if(oldCollection[i] && arrayIndexOf(newCollection, oldCollection[i]) === -1)
				{
					// Item is in the old collection but not in the new one
					boundView = this.boundViews[i];
					if(this.animate)
					{
						tempBoundViews.push(boundView);
						lastView = boundView;
					}
					else lastView = null;
					recycledViews.push(boundView);
				}
				if(newCollection[i])
				{
					// Item is in the new collection
					var oldIndex = arrayIndexOf(oldCollection, newCollection[i]);
					if(oldIndex !== -1)
					{
						// Item is already rendered, reuse its view
						boundView = this.boundViews[oldIndex];
						tempBoundViews.push(boundView);
						boundView.scope['*'] = this.cursor.refine([i]);
						if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
						boundView.setBindingIndex(i);
						newBoundViews.push(boundView);
						lastView = boundView;
					}
					else
					{
						// Item is new, create new binding view
						if(this.animate || recycledViews.length === 0)
						{
							boundView = this.createBoundView(newCollection[i]);
							boundView.scope['*'] = this.cursor.refine([i]);
							if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
							boundView.setBindingIndex(i);
							boundView.runAll();
							boundView.afterRunAll();
						}
						else
						{
							boundView = recycledViews.shift();
							boundView.scope['*'] = this.cursor.refine([i]);
							if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
							boundView.setBindingIndex(i);
						}
						tempBoundViews.push(boundView);
						newBoundViews.push(boundView);
						lastView = null;
					}
				}
			}

			if(lastView)
			{
				// Reordering elements from the last one:
				lastChild = lastView.element;
				i = tempBoundViews.length - 1;

				el = tempBoundViews[i].element;
				if(el !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1 && el !== lastChild.nextSibling)
				{
					insertBefore(lastChild.parentNode, lastChild.nextSibling, el);
					lastChild = el;
				}

				for(; i >= 0; i--)
				{
					el = tempBoundViews[i].element;
					var nextSibling = el.nextSibling;
					if(el !== lastChild && nextSibling !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1)
					{
						insertBefore(lastChild.parentNode, lastChild, el);
					}
					lastChild = el;
					tempBoundViews[i].refreshIndexedBinders(true);
				}
			}
			else
			{
				// Add elements after anchor text node:
				lastChild = this.anchor;
				if(this.anchor.parentNode)
				{
					parentNode = this.anchor.parentNode;
				}
				for(i = 0, l = tempBoundViews.length; i < l; i++)
				{
					el = tempBoundViews[i].element;

					if(el !== lastChild.nextSibling)
					{
						insertBefore(parentNode, lastChild.nextSibling, el);
					}
					tempBoundViews[i].refreshIndexedBinders(true);
					lastChild = el;
				}
			}
			this.boundViews = newBoundViews;

			// Remove old views:
			for(i = 0, l = recycledViews.length; i < l; i++)
			{
				var viewToRemove = recycledViews[i];
				if(viewToRemove.element && viewToRemove.element.parentNode)
				{
					removeNodeAsync(viewToRemove, removeChild);
				}
			}
		}
	},

	/**
	 * Refreshes view indices when the collection changes
	 *
	 * @private
	 * @param  {nubmer} from Render index at which reindexing starts
	 * @param  {number} to   Render index at which reindexing ends
	 */
	reindexBoundviews: function(from, to)
	{
		if(!from) from = 0;
		if(!to || to > this.boundViews.length) to = this.boundViews.length;

		// Reindex subsequent boundviews:
		for(var i = from; i < to; i++)
		{
			this.boundViews[i].setBindingIndex(i);
			this.boundViews[i].refreshBinders(true);
		}
	},

	/**
	 * Creates a new bound view for item in collection
	 *
	 * @private
	 * @param  {Object} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {View} 		created view
	 */
	createBoundView: function(item)
	{
		var boundView, element, i;

		if(!this.viewTemplate)
		{
			element = this.view.element.cloneNode(true);

			this.boundViewOptions.element = element;

			boundView = new this.view.constructor(this.boundViewOptions);

			boundView._collectionBinder = null;
			boundView._modelBindersMap = this.view._modelBindersMap.clone();

			this.boundViews.push(boundView);
			i = this.boundViews.length - 1;

			boundView.scope['*'] = this.cursor.refine([i]);
			if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];

			boundView.setBindingIndex(i);

			boundView.renderAll();

			this.viewTemplate = boundView.clone();
			this.elementTemplate = element.cloneNode(true);
		}
		else
		{
			element = this.elementTemplate.cloneNode(true);
			boundView = this.viewTemplate.clone();
			boundView.setParentView(this.view);

			this.boundViews.push(boundView);
			i = this.boundViews.length - 1;

			boundView.scope['*'] = this.cursor.refine([i]);
			if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];

			boundView.setBindingIndex(i);
			boundView.rebindElement(element);
		}

		element.setAttribute(settings.DATA_RENDERED_ATTR, true);

		boundView._itemAlias = this.view._itemAlias;
		boundView._modelBindersMap.setView(boundView);

		return boundView;
	},

	refreshBinders: function(force)
	{
		this.refreshBoundViews();
		if(this.boundViews !== null)
		{
			for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshBinders(force);
		}
	},

	refreshIndexedBinders: function()
	{
		if(this.boundViews !== null)
		{
			for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshIndexedBinders();
		}
	},

	getCollectionIndex: function(item)
	{
		if(this.collection instanceof Array)
		{
			return arrayIndexOf(this.collection, item);
		}
		else return -1;
	}
});

function removeNodeAsync(view, removeFn)
{
	view.suspendAll();
	removeFn(view.element.parentNode, view.element, function()
	{
		view.destroyAll();
	});
}

module.exports = CollectionBinder;
