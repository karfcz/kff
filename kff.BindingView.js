(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	/**
	 * kff.BindingView
	 */

	kff.BindingView = kff.createClass(
	{
		extend: kff.View,
		staticProperties:
		{
			binders: {}
		}
	},
	{
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
				for(var i = 0, mb = this.modelBinders[b], l = mb.length; i < l; i++) mb[i].modelChange();
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
					subresults = result[i].match(/([a-zA-Z0-9]+)\(([^,\(\)]*)\)/);

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

				model = this.getModel([].concat(name));

				if(model instanceof kff.Collection)
				{
					if(!this.options.isBoundView)
					{
						this.collectionBinder = {
						//	attr: null,
							collection: model
						};
						this.renderSubViews = function(){};
					}
				}
				else
				{
					if(!binderName) break;

					attr = name.pop();
					model = this.getModel(name);

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

		refreshBoundViews: function()
		{
			this.destroySubviews();
			if(this.$elements) this.$elements.remove();
			this.$elements = $([]);

			this.collectionBinder.collection.each(this.f(function(item, i)
			{
				this.$elements = this.$elements.add(this.createSubView(item, i));
			}));

			this.$anchor.after(this.$elements);
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



	kff.Binder = kff.createClass(
	{
		constructor: function(options)
		{
			this.options = options;
			this.options.events = this.options.events || [];
			this.view = options.view;
			this.$element = options.$element;
			this.attr = options.attr;
			this.model = options.model;
			this.parsers = options.parsers;
			this.formatters = options.formatters;
			this.values = options.values;
			this.valueIndex = options.valueIndex;
			this.params = options.params;
			this.currentValue = null;
		},

		init: function()
		{
			this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			this.delegateEvents.call(this, this.options.events);
		},

		destroy: function()
		{
			this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			this.undelegateEvents.call(this, this.options.events);
		},

		delegateEvents: kff.View.prototype.delegateEvents,

		undelegateEvents: kff.View.prototype.undelegateEvents,

		modelChange: function()
		{
			var modelValue = this.model.get(this.attr);

			if(!this.compareValues(modelValue, this.currentValue))
			{
				this.values[this.valueIndex] = this.format(modelValue);
				this.currentValue = modelValue;
				this.refresh();
			}
		},

		compareValues: function(value1, value2)
		{
			if((value1 instanceof Array) && (value2 instanceof Array))
			{
				var l = value1.length;
				if(l !== value2.length) return false;
				for(var i = 0; i < l; i++)
				{
					if(value1[i] !== value2[i]) return false;
				}
				return true;
			}
			else return value1 === value2;
		},

		getFormattedValue: function()
		{
			if(this.values.length > 1) return this.values.join(' ');
			else return this.values[this.valueIndex];
		},

		updateModel: function(value)
		{
			var i, l;
			if(value instanceof Array)
			{
				for(i = 0, l = value.length; i < l; i++) value[i] = this.parse(value[i]);
			}
			else
			{
				value = this.parse(value);
			}
			if(this.compareValues(value, this.currentValue)) return;
			this.currentValue = value;
			this.model.set(this.attr, this.currentValue);
		},

		refresh: function(value){},

		format: function(value)
		{
			for(var i = 0, l = this.formatters.length; i < l; i++)
			{
				value = this.formatters[i].call(this, value);
			}
			return value;
		},

		parse: function(value)
		{
			for(var i = 0, l = this.parsers.length; i < l; i++)
			{
				value = this.parsers[i].call(this, value);
			}
			return value;
		}

	});



	/**
	 * kff.ValueBinder
	 */

	kff.ValueBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['keydown drop change', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.$element.val());
			}), 0);
		},

		refresh: function()
		{
			this.$element.val(this.getFormattedValue());
		}
	});

	/**
	 * kff.CheckBinder
	 */

	kff.CheckBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click change', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.$element.is(':checked'));
			}), 0);
		},

		refresh: function()
		{
			this.$element.prop('checked', !!this.values[this.valueIndex]);
		}
	});

	/**
	 * kff.RadioBinder
	 */

	kff.RadioBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				if(this.$element.is(':checked'))
				{
					this.updateModel(this.$element.val());
				}
			}), 0);
		},

		refresh: function()
		{
			this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
		}
	});


	/**
	 * kff.TextBinder
	 */

	kff.TextBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			kff.TextBinder._super.init.call(this);
		},

		refresh: function(value)
		{
			this.$element.text(this.values.join(' '));
		}
	});


	/**
	 * kff.HtmlBinder
	 */

	kff.HtmlBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		refresh: function()
		{
			this.$element.html(this.values.join(' '));
		}
	});


	/**
	 * kff.ClassBinder
	 */

	kff.ClassBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			this.className = this.params[0] || null;
			kff.ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className) this.$element[this.values[this.valueIndex] ? 'addClass' : 'removeClass'](this.className);
		}
	});

	/**
	 * kff.AttrBinder
	 */

	kff.AttrBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	{
		init: function()
		{
			this.attribute = this.params[0] || null;
			this.prefix = this.params[1] || null;
			// this.prefix = this.$element.attr('data-kff-prefix') || '';
			kff.AttrBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue());
		}
	});


	/**
	 * kff.TemplateView
	 */

	// kff.TemplateView = kff.createClass(
	// {
	// 	extend: kff.Binder
	// },
	// {
	// 	refresh: function(value)
	// 	{
	// 		thit.destroySubViews();
	// 		if(this.options.template && this.models['*'])
	// 		{
	// 			this.$element.html(this.options.template(this.models['*'].toJson()));
	// 		}
	// 	}
	// });

	kff.View.helpers =
	{
		'index': function(v)
		{
			if(this.options && this.options.bindingIndex) return this.options.bindingIndex;
			return v;
		},

		'not': function(v)
		{
			return !v;
		},

		'int': function(v)
		{
			v = parseInt(v, 10);
			if(isNaN(v)) v = 0;
			return v;
		},

		'float': function(v)
		{
			v = parseFloat(v);
			if(isNaN(v)) v = 0;
			return v;
		},

		'boolean': function(v)
		{
			var parsed = parseInt(v);
			if(!isNaN(parsed)) return !!parsed;
			return v === 'true';
		},

		'uppercase': function(v)
		{
			return (v || '').toUpperCase();
		},

		'lowercase': function(v)
		{
			return (v || '').toLowerCase();
		},

		'strong': function(v)
		{
			return '<strong>' + v + '</strong>';
		}
	};


	kff.BindingView.binders.text = kff.TextBinder;
	kff.BindingView.binders['class'] = kff.ClassBinder;
	kff.BindingView.binders.val = kff.ValueBinder;
	kff.BindingView.binders.check = kff.CheckBinder;
	kff.BindingView.binders.radio = kff.RadioBinder;
	kff.BindingView.binders.html = kff.HtmlBinder;
	kff.BindingView.binders.attr = kff.AttrBinder;


})(this);