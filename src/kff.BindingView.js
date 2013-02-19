(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	kff.BindingView = kff.createClass(
	{
		extend: kff.View,
		staticProperties:
		{
			binders: {},
			registerBinder: function(alias, binder)
			{
				kff.BindingView.binders[alias] = binder;
			}
		}
	},
	/** @lends kff.BindingView.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			this.modelBinders = {};
			this.collectionBinder = null;

			this.values = {};
			this.formatters = [];
			this.parsers = [];

			kff.View.call(this, options);
		},

		render: function(silent)
		{
			this.initBinding();
			if(this.collectionBinder) this.renderBoundViews();
			kff.BindingView._super.render.call(this, silent);
			this.modelChange();
		},

		modelChange: function()
		{
			for(var b in this.modelBinders)
			{
				for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].modelChange(true);
			}
		},

		destroy: function(silent)
		{
			this.destroyBinding();
			kff.BindingView._super.destroy.call(this, true);
			this.destroyBoundViews();
			if(!silent) this.trigger('destroy');
		},

		initBinding: function()
		{
			var model, attr, result, subresults, name, binderName, binderParams, formatters, parsers;
			var modifierName, modifierParams;
			var dataBind = this.$element.attr(kff.View.DATA_BIND_ATTR);

			var regex = /([.a-zA-Z0-9]+):?([a-zA-Z0-9]+)?(\([^\(\))]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?:?([a-zA-Z0-9]+\([a-zA-Z0-9,\s]*\))?/g;

			this.modelBinders = [];

			while((result = regex.exec(dataBind)) !== null)
			{
				name = result[1];
				name = name.replace(/^\./, '*.').split('.');

				binderName = result[2];
				binderParams = result[3];

				if(binderParams)
				{
					binderParams = binderParams.slice(1,-1).split(/\s*,\s*/);
				}
				else binderParams = [];

				formatters = [];
				parsers = [];

				for(var i = 4, l = result.length; i < l && result[i]; i++)
				{
					subresults = result[i].match(/([a-zA-Z0-9]+)\(([^\(\)]*)\)/);

					if(subresults)
					{
						modifierName = subresults[1];
						modifierParams = [];

						if(subresults[2])
						{
							modifierParams = subresults[2].split(/\s*,\s*/);
						}

						switch(modifierName){
							case 'f':
								this.parseModifiers(modifierParams, formatters);
								break;
							case 'p':
								this.parseModifiers(modifierParams, parsers);
								break;
						}
					}
				}

				model = this.getModel([].concat(name));

				if(model instanceof kff.Collection)
				{
					if(!this.options.isBoundView)
					{
						this.collectionBinder = {
							collection: model
						};
						this.renderSubViews = function(){};
					}
				}
				else
				{
					if(!binderName || !(binderName in kff.BindingView.binders)) break;

					attr = name.pop();
					model = this.getModel(name);

					// Special binding for collection count property
					if(model instanceof kff.Collection && attr === 'count')
					{
						model = this.bindCollectionCount(model);
					}

					if(model instanceof kff.Model)
					{
						if(!(binderName in this.modelBinders))
						{
							this.modelBinders[binderName] = [];
							this.values[binderName] = [];
						}
						var valueIndex = this.modelBinders[binderName].length;
						var modelBinder = new kff.BindingView.binders[binderName]({
							view: this,
							$element: this.$element,
							bindingIndex: this.options.bindingIndex,
							valueIndex: valueIndex,
							values: this.values[binderName],
							params: binderParams,
							attr: attr,
							model: model,
							formatters: formatters,
							parsers: parsers
						});

						this.modelBinders[binderName].push(modelBinder);
						this.values[binderName].push(null);

						modelBinder.init();
					}
				}
			}
		},

		bindCollectionCount: function(collection)
		{
			var model = new kff.Model();
			var handler = function(){
				model.set('count', collection.count);
			}
			handler();

			if(!this.boundCollectionCounts) this.boundCollectionCounts = [];
			this.boundCollectionCounts.push({
				collection: collection,
				handler: handler
			})
			collection.on('change', handler);
			return model;
		},

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

		parseModifiers: function(modifierParams, modifiers)
		{
			for(var j = 0; j < modifierParams.length; j++)
			{
				if(kff.View.helpers[modifierParams[j]]) modifiers.push(kff.View.helpers[modifierParams[j]]);
			}
		},

		destroyBinding: function()
		{
			for(var b in this.modelBinders)
			{
				for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].destroy();
			}
			this.modelBinders = {};
			this.values = {};
			this.destroyCollectionCountBindings();
		},

		renderBoundViews: function()
		{
			var anchor = document.createTextNode('');
			if($.browser && $.browser.msie && $.browser.version < 9) anchor = $('<span/>');
			this.$anchor = $(anchor);
			this.$element.before(this.$anchor);
			this.$element.detach();

			// Subview options:
			this.subViewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
			var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);

			this.subViewOptions = opt ? JSON.parse(opt) : {};
			this.subViewOptions.parentView = this;

			this.collectionBinder.collection.on('change', this.f('refreshBoundViews'));

			this.refreshBoundViews();
		},

		destroyBoundViews: function()
		{
			if(this.$elements) this.$elements.remove();
			this.$elements = null;
			if(this.$anchor)
			{
				this.$anchor.after(this.$element);
				this.$anchor.remove();
			}
		},

		refreshBoundViews: function(event)
		{
			if(event && 'addedValue' in event)
			{
				if(!this.$elements) this.$elements = $([]);
				var $last = this.$elements.length === 0 ? this.$anchor : this.$elements.eq(this.$elements.length - 1);
				var $element = this.createSubView(event.addedValue, this.collectionBinder.collection.count - 1);
				this.$elements = this.$elements.add($element);
				$last.after($element);
			}
			if(event && 'removedValue' in event)
			{
				if(!this.$elements) this.$elements = $([]);
				for(var i = 0, l = this.subViews.length; i < l; i++)
				{
					if(event.removedValue === this.subViews[i].models['*']) break;
				}

				this.subViews[i].destroy();
				this.$elements.eq(i).remove();
			}
			else
			{
				this.destroySubviews();
				if(this.$elements) this.$elements.remove();
				this.$elements = $([]);

				this.collectionBinder.collection.each(this.f(function(item, i)
				{
					this.$elements = this.$elements.add(this.createSubView(item, i));
				}));

				this.$anchor.after(this.$elements);
			}
		},

		createSubView: function(item, i)
		{
			var $element = this.$element.clone();

			this.subViewOptions.element = $element;
			this.subViewOptions.models = { '*': item };
			this.subViewOptions.bindingIndex = i;
			this.subViewOptions.isBoundView = true;
			var subView = this.viewFactory.createView(this.subViewName, this.subViewOptions);
			if(subView instanceof kff.View)
			{
				subView.viewFactory = this.viewFactory;
				this.subViews.push(subView);
				subView.init();
				$element.attr(kff.View.DATA_RENDERED_ATTR, true);
				subView.refresh();
			}
			return $element;
		},

		getModel: function(modelPath)
		{
			var modelIndex;
			if(typeof modelPath === 'string') modelPath = modelPath.split('.');

			modelIndex = parseInt(modelPath[0]);

			if(this.collectionBinder && !isNaN(modelIndex)) return this.collectionBinder.collection.findByIndex(modelIndex);

			return kff.BindingView._super.getModel.call(this, modelPath);
		},

		concat: function(values)
		{
			if(values.length === 1) return values[0];
			else return values.join(' ');
		}
	});

})(this);