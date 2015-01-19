
kff.CollectionBinder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(options)
	{
		this.collection = options.collection || null;
		console.log('coll', this.collection, options)
		this.collectionPathArray = options.collectionPathArray;
		this.view = options.view;
		this.nobind = options.nobind;
		this.$elementTemplate = null;
		this.collectionCounter = null;
		this.boundViews = null;
		this.anchor = null;
		this.viewTemplate = null;
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
		var el = this.view.$element[0];

		if(el.parentNode)
		{
			el.parentNode.insertBefore(this.anchor, el.nextSibling);
			el.parentNode.removeChild(el);
		}

		this.boundViews = [];

		// Boundview options:
		this.boundViewName = this.view.$element[0].getAttribute(kff.DATA_VIEW_ATTR);
		var opt = this.view.$element[0].getAttribute(kff.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();
		this.initCollectionSorter();
		this.initCollectionCounter();

		this.boundViewOptions = opt ? JSON.parse(opt) : {};
		this.boundViewOptions.parentView = this.view;
		this.boundViewOptions.viewFactory = this.view.viewFactory;
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
				boundView.$element.remove();
			}
			this.boundViews = null;
		}

		if(this.anchor)
		{
			if(this.anchor.parentNode)
			{
				this.anchor.parentNode.insertBefore(this.view.$element[0], this.anchor.nextSibling);
				this.anchor.parentNode.removeChild(this.anchor);
			}
			this.anchor = null;
		}
		if(this.$elementTemplate)
		{
			this.$elementTemplate.remove();
			this.$elementTemplate = null;
		}
		this.viewTemplate = null;
		if(this.filteredCollection) this.filteredCollection = null;
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
		if(this.collectionCounter) this.collectionCounter.model.set(this.collectionCounter.attr, this.boundViews ? this.boundViews.length : 0);
	},

	/**
	 * Accepts or rejects an item of filtered collection binding
	 *
	 * @private
	 * @param  {object} item  Item to filter
	 * @return {boolean}      True if the item matches filter, false otherwise
	 */
	filterCollectionItem: function(item)
	{
		if(this.collectionFilter)
		{
			var collectionFilter = this.collectionFilter;
			var filterModel = this.collectionFilter.model || null;
			var filterFnName = this.collectionFilter.fn;
			var currentFilterModel = filterModel || item;
			return !!currentFilterModel[filterFnName](item);
		}
		return true;
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		var collectionFilter, filterModel, filterFnName, boundView, i, l, newIndex, el, a;
		var docFragment = null;
		var lastView, lastChild, parentNode, item;

		if(this.boundViews === null) this.boundViews = [];

		if(this.collectionFilter || this.collectionSorter)
		{
			if(this.collectionFilter)
			{
				this.filteredCollection = [];
				collectionFilter = this.collectionFilter;
				filterModel = this.collectionFilter.model || null;
				filterFnName = this.collectionFilter.fn;

				// if(this.collection instanceof Array)
				// {
					a = this.collection;
					for(i = 0, l = a.length; i < l; i++)
					{
						item = a[i];
						var currentFilterModel = filterModel || item;
						var render = !!currentFilterModel[filterFnName](item);

						if(render) this.filteredCollection.push(item);
					}
				// }
			}
			else
			{
				this.filteredCollection = this.collection.slice();
			}

			if(this.collectionSorter)
			{
				var sorterFn = this.collectionSorter.model.f(this.collectionSorter.fn);
				this.filteredCollection.sort(sorterFn);
			}
		}
		else
		{
			this.filteredCollection = this.collection;
		}

		if(this.boundViews.length === 0)
		{
			// Fast initial rendering:
			l = this.filteredCollection.length;
			if(l > 0)
			{
				a = this.filteredCollection;
				lastChild = this.anchor;
				if(this.anchor.parentNode)
				{
					parentNode = this.anchor.parentNode;
				}
				for(i = 0; i < l; i++)
				{
					boundView = this.createBoundView(a[i]);
					el = boundView.$element[0];
					parentNode.insertBefore(el, lastChild.nextSibling);
					boundView.setBindingIndex(i);
					lastChild = el;
				}

				for(i = 0; i < l; i++)
				{
					this.boundViews[i].runAll();
				}
			}
		}
		else
		{
			// Diff based rendering:
			var positions = new Array(this.filteredCollection.length);
			var toRemoveViews = [];
			var pos;
			var lastViewIndex = null;
			for(i = 0, l = this.boundViews.length; i < l; i++)
			{
				boundView = this.boundViews[i];
				item = boundView.models['*'];
				if(typeof(item) !== 'object') newIndex = -1;
				else newIndex = this.filteredCollection.indexOf(item);
				pos = boundView;
				if(newIndex !== -1)
				{
					positions[newIndex] = pos;
					lastView = boundView;
					lastViewIndex = i;
				}
				else {
					toRemoveViews.push(pos);
				}
			}

			for(i = 0, l = positions.length; i < l; i++)
			{
				item = this.filteredCollection[i];
				if(!positions[i])
				{
					pos = toRemoveViews.shift();
					if(pos)
					{
						boundView = pos;
						boundView.models['*'] = item;
						if(this.view.itemAlias) boundView.models[this.view.itemAlias] = item;
						boundView.setBindingIndex(i);
						boundView.refreshAll();
						if(i >= lastViewIndex) lastView = boundView;
					}
					else
					{
						boundView = this.createBoundView(item);
						boundView.setBindingIndex(i);
						boundView.runAll();
					}
					positions[i] = boundView;
				}
			}

			// Remove old views:
			for(i = 0, l = toRemoveViews.length; i < l; i++)
			{
				toRemoveViews[i].destroyAll();
				toRemoveViews[i].$element.remove();
			}

			var newBoundViews = new Array(positions.length);

			if(lastView)
			{
				// Reordering elements from the last one:
				lastChild = lastView.$element[0];
				i = positions.length - 1;

				el = positions[i].$element[0];
				if(el !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1)
				{
					lastChild.parentNode.insertBefore(el, lastChild.nextSibling);
					lastChild = el;
				}

				for(; i >= 0; i--)
				{
					el = positions[i].$element[0];

					if(el !== lastChild && el.nextSibling !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1)
					{
						lastChild.parentNode.insertBefore(el, lastChild);
					}

					lastChild = el;
					newBoundViews[i] = positions[i];
					newBoundViews[i].setBindingIndex(i);
					newBoundViews[i].refreshIndexedBinders(true);
				}
			}
			else
			{
				lastChild = this.anchor;
				if(this.anchor.parentNode)
				{
					parentNode = this.anchor.parentNode;
				}
				for(i = 0, l = positions.length; i < l; i++)
				{
					el = positions[i].$element[0];

					if(el !== lastChild.nextSibling)
					{
						parentNode.insertBefore(el, lastChild.nextSibling);
					}
					newBoundViews[i] = positions[i];
					newBoundViews[i].setBindingIndex(i);
					newBoundViews[i].refreshIndexedBinders(true);
					lastChild = el;
				}
			}
			this.boundViews = newBoundViews;
		}
	},

	/**
	 * Inits filtering of collection items
	 *
	 * @private
	 */
	initCollectionFilter: function()
	{
		var filterName = this.view.$element[0].getAttribute(kff.DATA_FILTER_ATTR);

		if(filterName)
		{
			this.collectionFilter =
			{
				model: null,
				fn: null
			};
			filterName = filterName.replace(/^\./, '').split('.');
			if(filterName.length === 1)
			{
				this.collectionFilter.fn = filterName[0];
			}
			else
			{
				this.collectionFilter.fn =  filterName.pop();
				this.collectionFilter.model =  this.view.getModel([].concat(filterName));
			}
		}
	},

	/**
	 * Inits sorting of collection
	 *
	 * @private
	 */
	initCollectionSorter: function()
	{
		var sorterName = this.view.$element[0].getAttribute(kff.DATA_SORT_ATTR);

		if(sorterName)
		{
			this.collectionSorter =
			{
				model: null,
				fn: null
			};
			sorterName = sorterName.replace(/^\./, '').split('.');
			if(sorterName.length === 1)
			{
				this.collectionSorter.fn = sorterName[0];
			}
			else
			{
				this.collectionSorter.fn =  sorterName.pop();
				this.collectionSorter.model =  this.view.getModel([].concat(sorterName));
			}
		}
		else this.collectionSorter = null;
	},

	/**
	 * Inits counting of collection
	 *
	 * @private
	 */
	initCollectionCounter: function()
	{
		var counterName = this.view.$element[0].getAttribute(kff.DATA_COUNT_ATTR);

		if(counterName)
		{
			this.collectionCounter =
			{
				model: null,
				attr: null
			};
			counterName = counterName.replace(/^\./, '').split('.');
			if(counterName.length >= 2)
			{
				this.collectionCounter.attr = counterName.pop();
				this.collectionCounter.model =  this.view.getModel(counterName);
			}
			else this.collectionCounter = null;
		}
		else this.collectionCounter = null;
	},

	/**
	 * Removes a view at given index (rendered index)
	 *
	 * @private
	 * @param  {number} renderIndex Rendered index of item
	 */
	removeBoundViewAt: function(renderIndex)
	{
		var boundView = this.boundViews[renderIndex];
		if(boundView)
		{
			this.boundViews.splice(renderIndex, 1);

			boundView.$element[0].parentNode.removeChild(boundView.$element[0]);
			boundView.destroyAll();

			this.reindexBoundviews(renderIndex);
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
	 * @param  {kff.Model} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {kff.View} 		created view
	 */
	createBoundView: function(item, i)
	{
		var boundView, $element;

		if(!this.viewTemplate)
		{
			$element = $(this.view.$element[0].cloneNode(true));

			this.boundViewOptions.element = $element[0];

			boundView = new this.view.constructor(this.boundViewOptions);

			boundView.collectionBinder = null;
			boundView.modelBindersMap = this.view.modelBindersMap.clone();
			if(i === undefined)
			{
				this.boundViews.push(boundView);
				i = this.boundViews.length - 1;
			}
			else
			{
				this.boundViews.splice(i, 0, boundView);
			}
			boundView.models['*'] = item;
			if(this.view.itemAlias) boundView.models[this.view.itemAlias] = item;

			boundView.setBindingIndex(i);

			boundView.renderAll();

			this.viewTemplate = boundView.clone();
			this.$elementTemplate = $($element[0].cloneNode(true));
		}
		else
		{
			$element = $(this.$elementTemplate[0].cloneNode(true));
			boundView = this.viewTemplate.clone();
			boundView.setParentView(this.view);

			if(i === undefined)
			{
				this.boundViews.push(boundView);
				i = this.boundViews.length - 1;
			}
			else
			{
				this.boundViews.splice(i, 0, boundView);
			}

			boundView.models['*'] = item;
			if(this.view.itemAlias) boundView.models[this.view.itemAlias] = item;

			boundView.setBindingIndex(i);
			boundView.rebindElement($element[0]);
		}

		$element[0].setAttribute(kff.DATA_RENDERED_ATTR, true);

		boundView.itemAlias = this.view.itemAlias;
		boundView.modelBindersMap.setView(boundView);

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
			return kff.arrayIndexOf(this.collection, item);
		}
		else return -1;
	}
});
