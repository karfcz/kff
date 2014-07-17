
kff.BindingView = kff.createClass(
{
	extend: kff.View,
	statics:
	/** @lends kff.BindingView */
	{
		bindingRegex: /(?:([.a-zA-Z0-9*-]+))((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g,

		operatorsRegex: /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g,

		commaSeparateRegex: /\s*,\s*/,

		modifierSeparateRegex: /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\.\s@*]+})/g,

		leadingPeriodRegex: /^\./,

		trailingPeriodRegex: /\.$/,

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
			kff.BindingView.binders[alias] = binder;
		},

		/**
		 * Registers helper function to be used as parser/formatter
		 *
		 * @param {string} alias Name of helper function
		 * @param {function} helper Helper function
		 */
		registerHelper: function(alias, helper)
		{
			kff.BindingView.helpers[alias] = helper;
		}
	}
},
/** @lends kff.BindingView.prototype */
{
	/**
	 * Specialized View class for two-way data binding.
	 *
	 * @constructs
	 * @augments kff.View
	 */
	constructor: function(options)
	{
		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;
		this.boundViews = null;
		this.anchor = null;

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	renderAll: function(silent)
	{
		if(this.modelBindersMap === null) this.initBinding();
		if(!this.collectionBinder) kff.BindingView._super.renderAll.call(this, silent);
	},

	runAll: function()
	{
		if(this.collectionBinder)
		{
			this.runSubviews();
			this.refreshOwnBinders();
		}
		else
		{
			if(this.modelBindersMap !== null) this.modelBindersMap.initBinders();
			kff.BindingView._super.runAll.call(this);
			this.refreshOwnBinders();
		}
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	destroyAll: function(silent)
	{
		this.destroyBinding();
		this.destroyBoundViews();

		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;
		this.boundViews = null;

		kff.BindingView._super.destroyAll.call(this, true);
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, binderName, binderParams, formatters, parsers, getters, setters, eventNames, fill, i, watchModelPath, nobind;
		var modifierName, modifierParams;
		var dataBindAttr = this.$element[0].getAttribute(kff.View.DATA_BIND_ATTR);
		var modelName;

		var bindingRegex = kff.BindingView.bindingRegex;
		var operatorsRegex = kff.BindingView.operatorsRegex;
		var modifierSeparateRegex = kff.BindingView.modifierSeparateRegex;
		var commaSeparateRegex = kff.BindingView.commaSeparateRegex;
		var leadingPeriodRegex = kff.BindingView.leadingPeriodRegex;
		var trailingPeriodRegex = kff.BindingView.trailingPeriodRegex;

		bindingRegex.lastIndex = 0;
		operatorsRegex.lastIndex = 0;

		this.modelBindersMap = new kff.BinderMap();

		while((result = bindingRegex.exec(dataBindAttr)) !== null)
		{
			modelPathArray = result[1].replace(leadingPeriodRegex, '*.').replace(trailingPeriodRegex, '.*').split('.');

			formatters = [];
			parsers = [];
			setters = [];
			getters = [];
			eventNames = [];
			fill = false;
			nobind = false;
			watchModelPath = false;

			i = 0;
			while((result2 = operatorsRegex.exec(result[2])) !== null)
			{
				if(i === 0)
				{
					// Parse binder name and params
					binderName = result2[1];
					binderParams = result2[2];

					if(binderParams)
					{
						binderParams = binderParams.split(commaSeparateRegex);
					}
					else binderParams = [];
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
							this.parseHelpers(modifierParams, formatters);
							break;
						case 'p':
							this.parseHelpers(modifierParams, parsers);
							break;
						case 'on':
							this.parseSetters(modifierParams, eventNames);
							break;
						case 'as':
							this.parseSetters(modifierParams, itemAliases);
							break;
						case 'set':
							this.parseGetters(modifierParams, setters);
							break;
						case 'get':
							this.parseGetters(modifierParams, getters);
							break;
						case 'fill':
							fill = true;
							break;
						case 'watch':
							watchModelPath = true;
							break;
						case 'nobind':
							nobind = true;
							break;
					}
				}
				i++;
			}

			model = this.getModel(modelPathArray);

			if(model instanceof kff.Collection)
			{
				if(!this.options.isBoundView)
				{
					this.collectionBinder = {
						collection: model,
						collectionPathArray: modelPathArray
					};
					if(binderName === 'as' && binderParams.length > 0)
					{
						this.itemAlias = binderParams[0];
					}
					this.boundViews = [];
				}
			}
			else
			{
				if(!binderName || !(binderName in kff.BindingView.binders)) break;

				if(modelPathArray.length > 1) attr = modelPathArray.pop();
				else attr = null;

				if(attr === '*') attr = null;

				modelName = modelPathArray.length > 0 ? modelPathArray[0] : null;
				model = this.getModel(modelPathArray);

				// Special binding for collection count property
				if(model instanceof kff.Collection)
				{
					if(attr === 'count') model = this.bindCollectionCount(model);
				}
				var indexed = false;

				for(var j = formatters.length - 1; j >= 0; j--)
				{
					if(formatters[j].fn.indexed === true) indexed = true;
				}

				var modelBinder = new kff.BindingView.binders[binderName]({
					view: this,
					$element: this.$element,
					params: binderParams,
					attr: attr,
					model: model,
					modelName: modelName,
					modelPathArray: modelPathArray,
					formatters: formatters,
					parsers: parsers,
					setters: setters,
					getters: getters,
					eventNames: eventNames,
					fill: fill,
					nobind: nobind,
					watchModelPath: watchModelPath,
					indexed: indexed
				});

				this.modelBindersMap.add(modelBinder);
			}
		}
	},

	/**
	 * Special binding for Collection count property which is not bindable in a standard way.
	 * Creates a proxy model object that observes the collection for a change event and mirrors the
	 * count property of collection in the count attribute of the proxy model.
	 *
	 * @param {kff.Collection} collection The collection to be observed
	 */
	bindCollectionCount: function(collection)
	{
		var model = new kff.Model();
		var handler = function(){
			model.set('count', collection.count());
		};

		handler();

		if(!this.boundCollectionCounts) this.boundCollectionCounts = [];
		this.boundCollectionCounts.push({
			collection: collection,
			handler: handler
		});
		collection.on('change', handler);
		return model;
	},

	/**
	 * Destroys all collectin count bindings previously created by the bindCollectionCount method
	 */
	destroyCollectionCountBindings: function()
	{
		if(this.boundCollectionCounts)
		{
			for(var i = 0, l = this.boundCollectionCounts.length; i < l; i++)
			{
				this.boundCollectionCounts[i].collection.off('change', this.boundCollectionCounts[i].handler);
			}
		}
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
			if(kff.BindingView.helpers[modifierParam]) modifiers.push({ fn: kff.BindingView.helpers[modifierParam], args: modifierArgs });
		}
	},

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
		if(this.modelBindersMap !== null)
		{
			this.modelBindersMap.destroyBinders();
			this.modelBindersMap = null;
		}
		this.destroyCollectionCountBindings();
		this.collectionFilter = null;
		this.collectionSorter = null;
		this.collectionCounter = null;
	},

	/**
	 * Renders "bound" views.
	 * This method generates DOM elements corresponding to each item in the bound collection and
	 * creates the bindingView for each element. If the collection changes, it reflects those changes
	 * automatically in real time.
	 */
	renderBoundViews: function()
	{
		this.anchor = document.createTextNode('');
		var el = this.$element[0];

		if(el.parentNode)
		{
			el.parentNode.insertBefore(this.anchor, el.nextSibling);
			el.parentNode.removeChild(el);
		}

		this.boundViews = [];

		// Boundview options:
		this.boundViewName = this.$element[0].getAttribute(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element[0].getAttribute(kff.View.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();
		this.initCollectionSorter();
		this.initCollectionCounter();

		this.boundViewOptions = opt ? JSON.parse(opt) : {};
		this.boundViewOptions.parentView = this;
		this.boundViewOptions.viewFactory = this.viewFactory;
		this.boundViewOptions.isBoundView = true;

		if(this.collectionBinder.collection instanceof kff.Collection)
		{
			this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));
			if(this.collectionFilter || this.collectionSorter) this.collectionBinder.collection.onEach('change', this.f('collectionItemChange'));
		}

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

		if(this.collectionBinder)
		{
			this.collectionBinder.collection.off('change', this.f('refreshBoundViews'));
			if(this.collectionFilter || this.collectionSorter) this.collectionBinder.collection.offEach('change', this.f('collectionItemChange'));
		}

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
				this.anchor.parentNode.insertBefore(this.$element[0], this.anchor.nextSibling);
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

	/**
	 * Updates bound views when collection changes.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		if(this.collectionSorter) this.refreshBoundViewsAll();
		else
		{
			switch(event ? event.type : null)
			{
				case 'append':
					this.refreshBoundViewsOnAppend(event);
					break;
				// case 'insert':
				// 	this.refreshBoundViewsOnInsert(event);
				// 	break;
				case 'remove':
					this.refreshBoundViewsOnRemove(event);
					break;
				default:
					this.refreshBoundViewsAll();
			}
		}
		if(this.collectionCounter) this.collectionCounter.model.set(this.collectionCounter.attr, this.boundViews ? this.boundViews.length : 0);
	},

	/**
	 * Event handler for collection item change
	 *
	 * @private
	 * @param  {mixed} event Model's event object
	 */
	collectionItemChange: function(event)
	{
		if(this.collectionSorter) this.refreshBoundViews();
		else
		{
			var render = this.filterCollectionItem(event.model);
			var index = this.filteredCollection.indexOf(event.model);
			if((index !== -1) !== render) this.refreshBoundViews();
		}
	},

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
	 * Updates bound views when collection changes by appending item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnAppend: function(event)
	{
		var item = event.item;

		if(this.filterCollectionItem(item))
		{
			if(this.collectionFilter)
			{
				if(!this.filteredCollection) this.filteredCollection = new kff.Collection();
				this.filteredCollection.append(item);
			}
			else this.filteredCollection = this.collectionBinder.collection;

			var boundView = this.createBoundView(item);
			boundView.runAll();
			boundView.setBindingIndex(this.filteredCollection.count() - 1);
			boundView.refreshBinders(true);

			if(this.boundViews.length === 1)
			{
				if(this.anchor.parentNode)
				{
					this.anchor.parentNode.insertBefore(boundView.$element[0], this.anchor.nextSibling);
				}
			}
			else
			{
				var $lastElement = this.boundViews[this.boundViews.length - 2].$element;
				if($lastElement && $lastElement[0].parentNode)
				{
					$lastElement[0].parentNode.insertBefore(boundView.$element[0], $lastElement[0].nextSibling);
				}
			}
		}
	},
	/**
	 * Updates bound views when collection changes by inserting item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	// refreshBoundViewsOnInsert: function(event)
	// {
	// 	this.boundViewsMap.splice(event.index, 0, false);
	// 	this.collectionItemChange({ model: event.item });
	// },

	/**
	 * Updates bound views when collection changes by removing item.
	 *
	 * @private
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnRemove: function(event)
	{
		var i, l;
		if(event.items !== undefined)
		{
			for(i = 0, l = event.items.length; i < l; i++)
			{
				this.refreshBoundViewsOnRemove(event.items[i]);
			}
		}
		else
		{
			if(this.collectionFilter)
			{
				var renderIndex = this.filteredCollection.indexOf(event.item);
				if(renderIndex !== -1) this.removeBoundViewAt(renderIndex);
				this.filteredCollection.splice(renderIndex, 1);
			}
			else
			{
				this.removeBoundViewAt(event.index);
			}
		}
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
				this.filteredCollection = new kff.Collection();
				collectionFilter = this.collectionFilter;
				filterModel = this.collectionFilter.model || null;
				filterFnName = this.collectionFilter.fn;

				a = this.collectionBinder.collection.array;
				for(i = 0, l = a.length; i < l; i++)
				{
					item = a[i];
					var currentFilterModel = filterModel || item;
					var render = !!currentFilterModel[filterFnName](item);

					if(render) this.filteredCollection.append(item);
				}
			}
			else this.filteredCollection = this.collectionBinder.collection.clone();

			if(this.collectionSorter)
			{
				var sorterFn = this.collectionSorter.model.f(this.collectionSorter.fn);
				this.filteredCollection.sort(sorterFn);
			}

		}
		else this.filteredCollection = this.collectionBinder.collection;

		if(this.boundViews.length === 0)
		{
			// Fast initial rendering:
			l = this.filteredCollection.count();
			if(l > 0)
			{
				a = this.filteredCollection.array;
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
			var positions = new Array(this.filteredCollection.count());
			var toRemoveViews = [];
			var pos;
			for(i = 0, l = this.boundViews.length; i < l; i++)
			{
				boundView = this.boundViews[i];
				newIndex = this.filteredCollection.indexOf(boundView.models['*']);
				pos = boundView
				if(newIndex !== -1)
				{
					positions[newIndex] = pos;
					lastView = boundView;
				}
				else {
					toRemoveViews.push(pos);
				}
			}

			for(i = 0, l = positions.length; i < l; i++)
			{
				item = this.filteredCollection.get(i);
				if(!positions[i])
				{
					pos = toRemoveViews.shift();
					if(pos)
					{
						boundView = pos;
						boundView.destroyAll();
						boundView.models['*'] = item;
						if(this.itemAlias) boundView.models[this.itemAlias] = item;
						boundView.setBindingIndex(i);
						boundView.renderAll();
						boundView.runAll();
						// boundView.refreshBinders(true);
					}
					else
					{
						boundView = this.createBoundView(item);
						boundView.setBindingIndex(i);
						boundView.runAll();
						// boundView.refreshBinders(true);
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
				if(el !== lastChild && lastChild.parentNode)
				{
					lastChild.parentNode.insertBefore(el, lastChild.nextSibling);
					lastChild = el;
				}

				for(; i >= 0; i--)
				{
					el = positions[i].$element[0];

					if(el !== lastChild && el.nextSibling !== lastChild && lastChild.parentNode)
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
					parentNode.insertBefore(el, lastChild.nextSibling);
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
		var filterName = this.$element[0].getAttribute('data-kff-filter');

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
				this.collectionFilter.model =  this.getModel([].concat(filterName));
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
		var sorterName = this.$element[0].getAttribute('data-kff-sort');

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
				this.collectionSorter.model =  this.getModel([].concat(sorterName));
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
		var counterName = this.$element[0].getAttribute('data-kff-count');

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
				this.collectionCounter.model =  this.getModel(counterName);
			}
			else this.collectionCounter = null;
		}
		else this.collectionCounter = null;
	},

	/**
	 * Applies filter to the whole collection. Used when the filter changes.
	 *
	 * @private
	 */
	refilterCollection: function()
	{
		this.refreshBoundViews();
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
	 * @param  {kff.Model} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {kff.View} 		created view
	 */
	createBoundView: function(item, i)
	{
		var boundView, $element;

		if(!this.viewTemplate)
		{
			$element = $(this.$element[0].cloneNode(true));

			this.boundViewOptions.element = $element[0];
			this.boundViewOptions.parentView = this;
			this.boundViewOptions.viewFactory = this.viewFactory;
			this.boundViewOptions.isBoundView = true;
			this.boundViewOptions.models = { '*': item };

			if(this.itemAlias) this.boundViewOptions.models[this.itemAlias] = item;

			boundView = new this.constructor(this.boundViewOptions);

			boundView.collectionBinder = null;
			boundView.modelBindersMap = this.modelBindersMap.clone();
			if(i === undefined)
			{
				this.boundViews.push(boundView);
				i = this.boundViews.length - 1;
			}
			else
			{
				this.boundViews.splice(i, 0, boundView);
			}
			boundView.setBindingIndex(i);

			boundView.renderAll();

			this.viewTemplate = boundView.clone();
			this.$elementTemplate = $($element[0].cloneNode(true));
		}
		else
		{
			$element = $(this.$elementTemplate[0].cloneNode(true));
			boundView = this.viewTemplate.clone();
			boundView.setParentView(this.parentView);

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
			if(this.itemAlias) boundView.models[this.itemAlias] = item;

			boundView.setBindingIndex(i);
			boundView.rebindElement($element[0]);
		}

		$element[0].setAttribute(kff.View.DATA_RENDERED_ATTR, true);

		boundView.modelBindersMap.setView(boundView);

		return boundView;
	},


	/**
	 * Refreshes own data-binders
	 *
	 * @private
	 */
	refreshOwnBinders: function(event)
	{
		if(this.modelBindersMap) this.modelBindersMap.refreshBinders();
		if(event !== true && this.collectionBinder && this.collectionFilter) this.refilterCollection();
	},

	/**
	 * Refreshes binders
	 *
	 * @private
	 */
	refreshBinders: function(event)
	{
		this.refreshOwnBinders(event);
		if(this.collectionBinder)
		{
			for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshBinders(event);
		}
		else
		{
			kff.BindingView._super.refreshBinders.call(this, event);
		}
	},

	refreshIndexedBinders: function()
	{
		if(this.collectionBinder)
		{
			for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshIndexedBinders();
		}
		else
		{
			this.modelBindersMap.refreshIndexedBinders();
			kff.BindingView._super.refreshIndexedBinders.call(this);
		}
	},

	renderSubviews: function()
	{
		if(!this.collectionBinder) kff.BindingView._super.renderSubviews.call(this);
	},

	runSubviews: function()
	{
		if(this.collectionBinder)
		{
			this.renderBoundViews();
		}
		else kff.BindingView._super.runSubviews.call(this);
	},

	/**
	 * Destroys the subviews. It will be called automatically. Should not be called directly.
	 */
	destroySubviews: function()
	{
		if(this.collectionBinder)
		{
			this.destroyBoundViews();
		}
		else kff.BindingView._super.destroySubviews.call(this);
	},

	/**
	 * Returns index of item in bound collection (closest collection in the view scope)
	 *
	 * @return {number} Item index
	 */
	getBindingIndex: function(modelName)
	{
		modelName = modelName || '*';
		if(this.bindingIndex !== null && this.models.hasOwnProperty(modelName)) return this.bindingIndex;
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

	clone: function()
	{
		var clonedView = kff.View.prototype.clone.call(this);

		if(this.collectionBinder)
		{
			clonedView.collectionBinder =
			{
				collection: null,
				collectionPathArray: this.collectionBinder.collectionPathArray
			};
		}

		if(this.modelBindersMap)
		{
			clonedView.modelBindersMap = this.modelBindersMap.clone();
			clonedView.modelBindersMap.setView(clonedView);
			clonedView.boundViews = [];
		}
		clonedView.itemAlias = this.itemAlias;

		return clonedView;
	},

	rebindElement: function(element)
	{
		kff.BindingView._super.rebindElement.call(this, element);

		if(this.modelBindersMap !== null)
		{
			this.modelBindersMap.setView(this);
		}

		if(this.collectionBinder)
		{
			this.collectionBinder.collection = this.getModel(this.collectionBinder.collectionPathArray);
		}
	}
});
