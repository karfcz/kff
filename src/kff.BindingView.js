
kff.BindingView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	/** @lends kff.BindingView */
	{
		bindingRegex: /(?:([.a-zA-Z0-9*-]+))((?::[a-zA-Z0-9]+(?:\((?:[^()]*)\))?)*)/g,

		operatorsRegex: /:([a-zA-Z0-9]+)(?:\(([^()]*)\))?/g,

		commaSeparateRegex: /\s*,\s*/,

		modifierSeparateRegex: /([^{},\s]+)|({[a-zA-Z0-9,\[\]_\-\s*]+})/g,

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

		kff.View.call(this, options);
	},

	/**
	 * Renders the view and inits bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startRender: function(silent)
	{
		if(this.modelBindersMap !== null) this.modelBindersMap.initBinders();
		else this.initBinding();
		if(this.collectionBinder) this.renderBoundViews();
		kff.BindingView._super.startRender.call(this, silent);
		kff.setZeroTimeout(this.f('refreshOwnBinders'));
	},

	/**
	 * Destroys the view including bindings.
	 *
	 * @param {Boolean} silent If true, does not trigger events
	 */
	startDestroy: function(silent)
	{
		this.destroyBinding();
		kff.BindingView._super.startDestroy.call(this, true);
		this.destroyBoundViews();
	},

	/**
	 * Initializes all bindings.
	 *
	 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
	 */
	initBinding: function()
	{
		var model, attr, result, result2, modelPathArray, binderName, binderParams, formatters, parsers, getters, setters, eventNames, fill, i, watch;
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
			watch = false;

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
							watch = true;
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
						collection: model
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
					watch: watch
				});

				this.modelBindersMap.add(modelBinder);
				modelBinder.init();

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
				modifierArgs = modifierParams[j + 1].match(/([^,\s{}]+)/);
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
		this.subViewsMap = [];

		// Subview options:
		this.subViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

		this.initCollectionFilter();

		this.subViewOptions = opt ? JSON.parse(opt) : {};
		this.subViewOptions.parentView = this;
		this.subViewOptions.viewFactory = this.viewFactory;
		this.subViewOptions.isBoundView = true;

		this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));
		this.refreshBoundViewsAll();
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
	 * Destroys previously bound views.
	 *
	 * @private
	 */
	destroyBoundViews: function()
	{
		if(this.collectionBinder) this.collectionBinder.collection.off('change', this.f('refreshBoundViews'));
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
		this.subViewsMap.push(false);
		event.item.on('change', this.f('collectionItemChange'));
		this.collectionItemChange({ model: event.item });
	},
	/**
	 * Updates bound views when collection changes by inserting item.
	 *
	 * @param {Object} event An event triggered by collection change
	 */
	refreshBoundViewsOnInsert: function(event)
	{
		this.subViewsMap.splice(event.index, 0, false);
		event.item.on('change', this.f('collectionItemChange'));
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
		event.item.off('change', this.f('collectionItemChange'));

		// Find render index:
		for(var i = 0, l = this.subViews.length; i < l; i++)
		{
			if(event.item === this.subViews[i].models['*']) break;
		}

		var renderIndex = i;
		var realIndex = null;

		// Find real index in collection:
		for(var i = 0, l = this.subViewsMap.length; i < l; i++)
		{
			if(this.subViewsMap[i] === renderIndex)
			{
				realIndex = i;
				break;
			}
		}

		if(realIndex !== null)
		{
			if(this.subViewsMap[i] !== false) this.removeSubViewAt(renderIndex);
			this.subViewsMap.splice(i, 1);
		}

		this.reindexSubviews(i);
	},

	/**
	 * Updates bound views when collection changes on other events.
	 *
	 * @private
	 */
	refreshBoundViewsAll: function()
	{
		var filter, filterModel, filterFnName, render, renderIndex = 0, collectionItemChange = this.f('collectionItemChange'), that = this;

		kff.setZeroTimeout(function()
		{
			that.collectionBinder.collection.each(function(item, i)
			{
				item.off('change', collectionItemChange);
			});

			that.destroySubviews();

			if(that.elements)
			{
				for(var i = 0, l = that.elements.length; i < l; i++) that.elements[i].remove();
			}

			that.elements = [];
			that.subViewsMap = [];

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
				item.on('change', collectionItemChange);

				if(filter)
				{
					currentFilterModel = filterModel || item;
					render = !!currentFilterModel[filterFnName](item);
				}

				if(render)
				{
					that.elements.push(that.createSubView(item));
					that.subViewsMap.push(renderIndex);
					renderIndex++;
				}
				else
				{
					that.subViewsMap.push(false);
				}
			});
		});

		kff.setZeroTimeout(function()
		{
			if('Zepto' in window && $ === window.Zepto)
			{
				var elems = [];

				for(var i = 0, l = that.elements.length; i < l; i++)
				{
					elems.push(that.elements[i].get(0));
				}

				that.$anchor.after(elems);
				that.reindexSubviews();
			}
			else
			{
				that.$anchor.after(that.elements);
				that.reindexSubviews();
			}
		});
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

			if(filter && this.subViewsMap[i] === false)
			{
				for(j = 0; j < i; j++)
				{
					if(this.subViewsMap[j] !== false) renderIndex++;
				}
				this.addSubViewAt(i, renderIndex);
			}
			else if(!filter && this.subViewsMap[i] !== false)
			{
				this.subViewsMap[i] = false;
				this.removeSubViewAt(this.subViewsMap[i]);
			}
		}
		else
		{
			if(this.subViewsMap[i] === false) this.addSubViewAt(i, i);
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
	removeSubViewAt: function(renderIndex)
	{
		this.subViews[renderIndex].startDestroy();
		this.subViews.splice(renderIndex, 1);
		this.elements[renderIndex].remove();
		this.elements.splice(renderIndex, 1);

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Adds a view at given index
	 *
	 * @private
	 * @param {number} collectionIndex Index of item in the collection
	 * @param {number} renderIndex     Index of item in the view (view can be filtered)
	 */
	addSubViewAt: function(collectionIndex, renderIndex)
	{
		var item = this.collectionBinder.collection.findByIndex(collectionIndex);
		var $element = this.createSubView(item, renderIndex);

		if(renderIndex === 0)
		{
			this.$anchor.after($element);
		}
		else
		{
			this.elements[renderIndex - 1].after($element);
		}
		this.elements.splice(renderIndex, 0, $element);

		this.subViewsMap[collectionIndex] = renderIndex;

		// Reindex subsequent subviews:
		this.reindexSubviews(renderIndex);
	},

	/**
	 * Refreshes view indices when the collection changes
	 *
	 * @private
	 * @param  {nubmer} from Render index at which reindexing starts
	 * @param  {number} to   Render index at which reindexing ends
	 */
	reindexSubviews: function(from, to)
	{
		if(!from) from = 0;
		if(!to || to > this.subViews.length) to = this.subViews.length;

		// Reindex subsequent subviews:
		for(var i = from; i < to; i++)
		{
			this.subViews[i].setBindingIndex(i);
			this.subViews[i].refreshBinders(true);
		}
		// Reindex subViewsMap
		for(var i = 0, l = this.subViewsMap.length, j = 0; i < l; i++)
		{
			if(this.subViewsMap[i] !== false)
			{
				this.subViewsMap[i] = j;
				j++;
			}
		}
	},

	/**
	 * Creates a new subview for item in collection
	 * @param  {kff.Model} item Item for data-binding
	 * @param  {number} i 		Binding index
	 * @return {jQuery} 		JQuery-wrapped DOM element of the view
	 */
	createSubView: function(item, i)
	{
		var subView, $element = this.$element.clone();

		this.subViewOptions.element = $element;
		this.subViewOptions.models = { '*': item };
		if(this.itemAlias) this.subViewOptions.models[this.itemAlias] = item;

		subView = new this.constructor(this.subViewOptions);

		if(subView instanceof kff.View)
		{
			if(i === undefined)
			{
				this.subViews.push(subView);
				i = this.subViews.length - 1;
			}
			else
			{
				this.subViews.splice(i, 0, subView);
			}
			subView.setBindingIndex(i);

			if(this.modelBindersMapTemplate)
			{
				subView.modelBindersMap = this.modelBindersMapTemplate.clone();
				subView.modelBindersMap.setView(subView);
			}

			subView.init();

			$element.attr(kff.View.DATA_RENDERED_ATTR, true);

			if(!this.modelBindersMapTemplate)
			{
				this.modelBindersMapTemplate = subView.modelBindersMap.clone();
				this.modelBindersMapTemplate.destroyBinders();
			}
		}
		return $element;
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
		if(!this.collectionBinder) kff.BindingView._super.renderSubviews.call(this);
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
	}
});
