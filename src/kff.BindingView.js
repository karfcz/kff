
kff.BindingView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	/** @lends kff.BindingView */
	{
		bindingRegex: /(?:([.a-zA-Z0-9*-]+))((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g,

		operatorsRegex: /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g,

		commaSeparateRegex: /\s*,\s*/,

		modifierSeparateRegex: /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\.\s*]+})/g,

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
		options = options || {};
		this.modelBindersMap = null;
		this.collectionBinder = null;
		this.bindingIndex = null;
		this.itemAlias = null;
		this.boundViews = [];

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startRender: function(silent)
	{
		if(this.modelBindersMap === null) this.initBinding();
		if(!this.collectionBinder) kff.BindingView._super.startRender.call(this, silent);
	},

	startRun: function()
	{
		if(this.collectionBinder)
		{
			this.runSubviews();
			kff.setZeroTimeout(this.f('refreshOwnBinders'));
		}
		else
		{
			if(this.modelBindersMap !== null) this.modelBindersMap.initBinders();
			kff.BindingView._super.startRun.call(this);
			this.refreshOwnBinders();
		}
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startDestroy: function(silent)
	{
		this.destroyBinding();
		this.destroyBoundViews();
		kff.BindingView._super.startDestroy.call(this, true);
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, binderName, binderParams, formatters, parsers, getters, setters, eventNames, fill, i, watchModelPath;
		var modifierName, modifierParams;
		var dataBindAttr = this.$element.attr(kff.View.DATA_BIND_ATTR);
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
							this.parseSetters(modifierParams, setters);
							break;
						case 'get':
							this.parseSetters(modifierParams, getters);
							break;
						case 'fill':
							fill = true;
							break;
						case 'watch':
							watchModelPath = true;
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
					watchModelPath: watchModelPath
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
		this.modelBindersMap.destroyBinders();
		this.modelBindersMap = null;
		this.destroyCollectionCountBindings();
	},

	/**
	 * Renders "bound" views.
	 * This method generates DOM elements corresponding to each item in the bound collection and
	 * creates the bindingView for each element. If the collection changes, it reflects those changes
	 * automatically in real time.
	 */
	renderBoundViews: function()
	{
		this.$anchor = $(document.createTextNode(''));
		this.$element.before(this.$anchor);
		this.$element.remove();
		this.boundViewsMap = [];

		// Boundview options:
		this.boundViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();

		this.boundViewOptions = opt ? JSON.parse(opt) : {};
		this.boundViewOptions.parentView = this;
		this.boundViewOptions.viewFactory = this.viewFactory;
		this.boundViewOptions.isBoundView = true;

		this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));
		this.collectionBinder.collection.onEach('change', this.f('collectionItemChange'));
		this.refreshBoundViewsAll();
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
			this.collectionBinder.collection.offEach('change', this.f('collectionItemChange'));
		}

		// Destroy boundviews
		for(i = 0, l = this.boundViews.length; i < l; i++)
		{
			boundView = this.boundViews[i];
			boundView.startDestroy();
		}
		this.boundViews = [];

		if(this.elements)
		{
			for(var i = 0, l = this.elements.length; i < l; i++) this.elements[i].remove();
		}
		this.elements = [];
		if(this.$anchor)
		{
			this.$anchor.after(this.$element);
			this.$anchor.remove();
		}
		this.boundViews = [];
	},

	/**
	 * Updates bound views when collection changes.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViews: function(event)
	{
		switch(event ? event.type : null)
		{
			case 'append':
				this.refreshBoundViewsOnAppend(event);
				break;
			case 'insert':
				this.refreshBoundViewsOnInsert(event);
				break;
			case 'remove':
				this.refreshBoundViewsOnRemove(event);
				break;
			default:
				this.refreshBoundViewsAll();
		}
	},

	/**
	 * Updates bound views when collection changes by appending item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnAppend: function(event)
	{
		this.boundViewsMap.push(false);
		this.collectionItemChange({ model: event.item });
	},
	/**
	 * Updates bound views when collection changes by inserting item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnInsert: function(event)
	{
		this.boundViewsMap.splice(event.index, 0, false);
		this.collectionItemChange({ model: event.item });
	},

	/**
	 * Updates bound views when collection changes by removing item.
	 *
	 * @private
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnRemove: function(event)
	{
		// Find render index:
		for(var i = 0, l = this.boundViews.length; i < l; i++)
		{
			if(event.item === this.boundViews[i].models['*']) break;
		}

		var renderIndex = i;
		var realIndex = null;

		// Find real index in collection:
		for(var i = 0, l = this.boundViewsMap.length; i < l; i++)
		{
			if(this.boundViewsMap[i] === renderIndex)
			{
				realIndex = i;
				break;
			}
		}

		if(realIndex !== null)
		{
			if(this.boundViewsMap[i] !== false) this.removeBoundViewAt(renderIndex);
			this.boundViewsMap.splice(i, 1);
		}

		this.reindexBoundviews(i);
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		var filter, filterModel, filterFnName, render, renderIndex = 0, that = this, boundView;

		if(that.elements)
		{
			for(var i = 0, l = that.elements.length; i < l; i++) that.elements[i].remove();
		}

		that.elements = [];
		that.boundViewsMap = [];

		if(that.collectionFilter)
		{
			filter = true;
			filterModel = that.collectionFilter.model || null;
			filterFnName = that.collectionFilter.fn;
		}

		that.collectionBinder.collection.each(function(item, i)
		{
			var currentFilterModel;
			render = true;

			if(filter)
			{
				currentFilterModel = filterModel || item;
				render = !!currentFilterModel[filterFnName](item);
			}

			if(render)
			{
				boundView = that.createBoundView(item);
				that.elements.push(boundView.$element);
				that.boundViewsMap.push(renderIndex);
				renderIndex++;
			}
			else
			{
				that.boundViewsMap.push(false);
			}
		});

		if('Zepto' in window && $ === window.Zepto)
		{
			var elems = [];

			for(var i = 0, l = that.elements.length; i < l; i++)
			{
				elems.push(that.elements[i].get(0));
			}

			that.$anchor.after(elems);
		}
		else
		{
			that.$anchor.after(that.elements);
		}

		that.reindexBoundviews();

		kff.setZeroTimeout(function()
		{
			kff.setZeroTimeout(function()
			{
				for(var i = 0, l = that.boundViews.length; i < l; i++)
				{
					that.boundViews[i].startRun();
				}
			});
		});
	},

	/**
	 * Inits filtering of colelction items
	 *
	 * @private
	 */
	initCollectionFilter: function()
	{
		var filterName = this.$element.attr('data-kff-filter');

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
	 * Event handler for collection item change
	 *
	 * @private
	 * @param  {mixed} event Model's event object
	 */
	collectionItemChange: function(event)
	{
		var item = event.model,
			i = this.collectionBinder.collection.indexOf(item),
			j,
			renderIndex,
			filter,
			filterModel;


		if(this.collectionFilter)
		{
			filterModel = item;
			if(this.collectionFilter.model) filterModel = this.collectionFilter.model;

			renderIndex = 0;
			filter = !!filterModel[this.collectionFilter.fn].call(filterModel, item);

			if(filter && this.boundViewsMap[i] === false)
			{
				for(j = 0; j < i; j++)
				{
					if(this.boundViewsMap[j] !== false) renderIndex++;
				}
				this.addBoundViewAt(i, renderIndex);
			}
			else if(!filter && this.boundViewsMap[i] !== false)
			{
				renderIndex = this.boundViewsMap[i];
				this.boundViewsMap[i] = false;
				this.removeBoundViewAt(renderIndex);
			}
		}
		else
		{
			if(this.boundViewsMap[i] === false) this.addBoundViewAt(i, i);
		}
	},

	/**
	 * Applies filter to the whole collection. Used when the filter changes.
	 *
	 * @private
	 */
	refilterCollection: function()
	{
		this.collectionBinder.collection.each(this.f(function(item, i)
		{
			this.collectionItemChange({ model: item });
		}));
	},

	/**
	 * Removes a view at given index (rendered index)
	 *
	 * @private
	 * @param  {number} renderIndex Rendered index of item
	 */
	removeBoundViewAt: function(renderIndex)
	{
		if(this.boundViews[renderIndex])
		{
			this.boundViews[renderIndex].startDestroy();
			this.boundViews.splice(renderIndex, 1);
			this.elements[renderIndex].remove();
			this.elements.splice(renderIndex, 1);

			// Reindex subsequent boundviews:
			this.reindexBoundviews(renderIndex);
		}
	},

	/**
	 * Adds a view at given index
	 *
	 * @private
	 * @param {number} collectionIndex Index of item in the collection
	 * @param {number} renderIndex     Index of item in the view (view can be filtered)
	 */
	addBoundViewAt: function(collectionIndex, renderIndex)
	{
		var item = this.collectionBinder.collection.findByIndex(collectionIndex);
		var boundView = this.createBoundView(item, renderIndex);
		var $element = boundView.$element;

		if(renderIndex === 0)
		{
			this.$anchor.after($element);
		}
		else
		{
			this.elements[renderIndex - 1].after($element);
		}
		this.elements.splice(renderIndex, 0, $element);

		this.boundViewsMap[collectionIndex] = renderIndex;

		// Reindex subsequent boundviews:
		this.reindexBoundviews(renderIndex);
		boundView.startRun();
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
		// Reindex boundViewsMap
		for(var i = 0, l = this.boundViewsMap.length, j = 0; i < l; i++)
		{
			if(this.boundViewsMap[i] !== false)
			{
				this.boundViewsMap[i] = j;
				j++;
			}
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
		var boundView, $element, boundViewOptions;

		if(!this.viewTemplate)
		{
			$element = this.$element.clone();

			boundViewOptions = kff.mixins({}, this.boundViewOptions, {
				element: $element,
				models: { '*': item }
			});
			// this.boundViewOptions.element = $element;
			// this.boundViewOptions.models = { '*': item };
			//
			if(this.itemAlias) boundViewOptions.models[this.itemAlias] = item;

			boundView = new this.constructor(boundViewOptions);

			boundView.collectionBinder = null;

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

			boundView.startRender();

			this.viewTemplate = boundView.clone();
			this.$elementTemplate = $element.clone();
		}
		else
		{
			$element = this.$elementTemplate.clone();

			boundView = this.viewTemplate.clone();

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
			boundView.rebindElement($element.get(0));
		}

		$element.attr(kff.View.DATA_RENDERED_ATTR, true);

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
		kff.BindingView._super.refreshBinders.call(this, event);
	},

	renderSubviews: function()
	{
		if(this.collectionBinder)
		{
		}
		else kff.BindingView._super.renderSubviews.call(this);
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
		clonedView.options.isBoundView = this.options.isBoundView;

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
