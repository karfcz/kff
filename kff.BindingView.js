kff.View.helpers = {
	uppercase: function(v) {
		return (v || '').toUpperCase();
	},

	bold: function(v) {
		return '<strong>' + v + '</strong>';
	},

	toInt: function(v)
	{
		v = parseInt(v);
		if(isNaN(v)) v = 0;
		return v;
	},

	toBoolean: function(v)
	{
		var parsed = parseInt(v);
		if(!isNaN(parsed)) return !!parsed;
		return v === 'true';
	},

	negate: function(v)
	{
		return !v;
	}
};

/**
 * kff.BindingView
 */

kff.BindingView = kff.createClass(
{
	extend: kff.View
},
{
	constructor: function(options)
	{
		options = options || {};
		this.boundModelStructs = [];
		this.currentValues = [];
		this.formatters = [];
		this.parsers = [];
		kff.View.call(this, options);
	},

	render: function(silent)
	{
		this.initBinding();
		if(this.boundCollectionStruct) this.renderBoundViews();
		else
		{
			kff.BindingView._super.render.call(this, silent);
			this.modelChange();
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
		var name = this.$element.attr('data-kff-bind');
		var names = name.split(/\s+/);
		var modelStruct, attrName, collection;
		this.boundModelStructs = [];
		for(var i = 0, l = names.length; i < l; i++)
		{
			name = names[i];
			name = name.replace(/^\./, '*.').split('.');

			modelStruct = {
				attr: null,
				model: this.getModel([].concat(name))
			};

			if(modelStruct.model instanceof kff.Collection)
			{
				this.initCollection(modelStruct);
			}
			else
			{
				modelStruct.attr =  name.pop();
				modelStruct.model = this.getModel(name);
				if(modelStruct.model instanceof kff.Model)
				{
					this.initModel(modelStruct);
					this.boundModelStructs[i] = modelStruct;
				}
			}
			if(!this.models['*']) this.models['*'] = modelStruct.model;
		}

		this.initFormatters();
		this.initParsers();
	},

	destroyBinding: function()
	{
		for(var i = 0, l = this.boundModelStructs.length; i < l; i++)
		{
			if(this.boundModelStructs[i]) this.boundModelStructs[i].model.off('change:' + this.boundModelStructs[i].attr,  this.f('modelChange'));
		}
		this.boundModelStructs = [];
		this.currentValues = [];
		this.formatters = [];
		this.parsers = [];
	},

	initFormatters: function()
	{
		var formatStr = this.$element.attr('data-kff-format');
		if(formatStr)
		{
			var formatArr = formatStr.split(/\s+/);
			this.formatters = [];
			for(var i = 0, l = formatArr.length; i < l; i++)
			{
				if(formatArr[i] in kff.View.helpers) this.formatters.push(kff.View.helpers[formatArr[i]]);
			}
		}
	},

	initParsers: function()
	{
		var parseStr = this.$element.attr('data-kff-parse');
		if(parseStr)
		{
			var parseArr = parseStr.split(/\s+/);
			this.parsers = [];
			for(var i = 0, l = parseArr.length; i < l; i++)
			{
				if(parseArr[i] in kff.View.helpers) this.parsers.push(kff.View.helpers[parseArr[i]]);
			}
		}
	},

	initModel: function(modelStruct)
	{
		modelStruct.model.on('change' + (modelStruct.attr === null ? '' : ':' + modelStruct.attr), this.f('modelChange'));
	},

	initCollection: function(modelStruct)
	{
		this.boundCollectionStruct = {
			attr: modelStruct.attr,
			collection: modelStruct.model
		};
		this.renderSubViews = function(){};
	},

	renderBoundViews: function()
	{
		var anchor = document.createTextNode('');
		if($.browser && $.browser.msie && $.browser.version < 9) anchor = $('<span/>');
		this.$anchor = $(anchor);
		this.$element.before(this.$anchor);
		this.$element.detach();

		this.boundCollectionStruct.collection.on('change', this.f('refreshBoundViews'));

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
		if(this.$elements) this.$elements.remove();
		this.$elements = $([]);

		var i = 0, $element;

		this.boundCollectionStruct.collection.each(this.f(function(item)
		{
			$element = this.$element.clone();
			$element.attr('data-kff-bind', i + '.' + this.boundCollectionStruct.attr);
			i++;
			this.$elements = this.$elements.add($element);
		}));

		// Initialize subviews
		var viewName = this.$element.attr(kff.View.DATA_VIEW_ATTR);
		var opt = this.$element.attr(kff.View.DATA_OPTIONS_ATTR);
		var	options = opt ? JSON.parse(opt) : {};
		options.parentView = this;
		var viewNames = [];
		var subview;

		this.$elements.each(this.f(function(i, el)
		{
			options.element = $(el);
			options.bindingIndex = i;
			subView = this.viewFactory.createView(viewName, options);
			if(subView instanceof kff.View)
			{
				subView.viewFactory = this.viewFactory;
				this.subViews.push(subView);
				subView.init();
				$(el).attr(kff.View.DATA_RENDERED_ATTR, true);
			}
		}));

		this.$anchor.after(this.$elements);

		for(i = 0, l = this.subViews.length; i < l; i++) this.subViews[i].refresh();
	},

	getModel: function(modelPath)
	{
		var modelIndex;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		modelIndex = parseInt(modelPath[0]);

		if(this.boundCollectionStruct && !isNaN(modelIndex)) return this.boundCollectionStruct.collection.findByIndex(modelIndex);

		return kff.BindingView._super.getModel.call(this, modelPath);
	},

	modelChange: function()
	{
		var modelValues = this.computeValues(), formattedValues = [], i, l;
		if(!this.compareValues(modelValues, this.currentValues))
		{
			for(i = 0, l = modelValues.length; i < l; i++) formattedValues[i] = this.format(modelValues[i]);
			this.refresh(this.concat(formattedValues), modelValues);
			this.currentValues = modelValues;
		}
	},

	updateModel: function(value)
	{
		var i, l, item;
		if(value instanceof Array)
		{
			for(i = 0, l = value.length; i < l; i++) this.currentValues[i] = this.parse(value[i]);
		}
		else
		{
			for(i = 0, l = this.currentValues.length; i < l; i++) this.currentValues[i] = this.parse(value);
		}
		for(i = 0, l = this.currentValues.length; i < l; i++)
		{
			item = this.boundModelStructs[i];
			if(item) item.model.set(item.attr, this.currentValues[i]);
		}
	},

	compareValues: function(values1, values2)
	{
		for(var i = 0, l = values1.length; i < l; i++)
		{
			if(values1[i] !== values2[i]) return false;
		}
		return true;
	},

	computeValues: function()
	{
		var values = [], item;
		for(var i = 0, l = this.boundModelStructs.length; i < l; i++)
		{
			item = this.boundModelStructs[i];
			if(item.attr === '*') values[i] = null; // TODO: merge all changed values of model (or all???)
			else values[i] = item.model.get(item.attr);
		}
		return values;
	},

	concat: function(values)
	{
		if(values.length === 1) return values[0];
		else return values.join(' ');
	},

	format: function(value)
	{
		for(var i = 0, l = this.formatters.length; i < l; i++)
		{
			value = this.formatters[i].call(null, value);
		}
		return value;
	},

	parse: function(value)
	{
		for(var i = 0, l = this.parsers.length; i < l; i++)
		{
			value = this.parsers[i].call(null, value);
		}
		return value;
	}
});

/**
 * kff.ValueView
 */

kff.ValueView = kff.createClass(
{
	extend: kff.BindingView
},
{
	constructor: function(options)
	{
		options = options || {};
		options.events = [
			['keypress drop change', 'inputChange']
		];
		kff.BindingView.call(this, options);
	},

	inputChange: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.val());
		}), 0);
	},

	refresh: function(value)
	{
		this.$element.val(value);
	}

});

/**
 * kff.CheckView
 */

kff.CheckView = kff.createClass(
{
	extend: kff.BindingView
},
{
	constructor: function(options)
	{
		options = options || {};
		options.events = [
			['click change', 'inputChange']
		];
		kff.BindingView.call(this, options);
	},

	inputChange: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':checked'));
		}), 0);
	},

	refresh: function(value)
	{
		this.$element.prop('checked', !!value);
	}
});

/**
 * kff.RadioView
 */

kff.RadioView = kff.createClass(
{
	extend: kff.BindingView
},
{
	constructor: function(options)
	{
		options = options || {};
		options.events = [
			['click change', 'inputChange']
		];
		kff.BindingView.call(this, options);
	},

	inputChange: function(event)
	{
		setTimeout(this.f(function()
		{
			if(this.$element.is(':checked')) this.updateModel(this.$element.val());
		}), 0);
	},

	refresh: function(value)
	{
		this.$element.prop('checked', this.parse(this.$element.val()) === value);
	}
});


/**
 * kff.TextView
 */

kff.TextView = kff.createClass(
{
	extend: kff.BindingView
},
{
	refresh: function(value)
	{
		this.$element.text(value);
	}
});

/**
 * kff.HtmlView
 */

kff.HtmlView = kff.createClass(
{
	extend: kff.BindingView
},
{
	refresh: function(value)
	{
		this.$element.html(value);
	}
});


/**
 * kff.ClassView
 */

kff.ClassView = kff.createClass(
{
	extend: kff.BindingView
},
{
	initBinding: function()
	{
		this.className = this.$element.attr('data-kff-class');
		kff.ClassView._super.initBinding.call(this);
	},

	refresh: function(value)
	{
		if(this.className) this.$element[value ? 'addClass' : 'removeClass'](this.className);
	}
});

/**
 * kff.AttrView
 */

kff.AttrView = kff.createClass(
{
	extend: kff.BindingView
},
{
	initBinding: function()
	{
		this.attribute = this.$element.attr('data-kff-attr');
		this.prefix = this.$element.attr('data-kff-prefix') || '';
		kff.AttrView._super.initBinding.call(this);
	},

	refresh: function(value)
	{
		if(this.attribute) this.$element.attr(this.attribute, this.prefix + value);
	}
});

/**
 * kff.OptionView
 */
kff.OptionView = kff.createClass(
{
	extend: kff.BindingView
},
{
	initBinding: function()
	{
		this.textAttr = this.$element.attr('data-kff-text') || null;
		this.valueAttr = this.$element.attr('data-kff-value') || null;
		kff.OptionView._super.initBinding.call(this);
	},

	refresh: function()
	{
		var firstModel = this.boundModelStructs[0].model;
		this.$element.attr('value', this.valueAttr ? firstModel.get(this.valueAttr) : this.options.bindingIndex);
		this.$element.text(firstModel.get(this.textAttr));
	}
});

/**
 * kff.TemplateView
 */

// kff.TemplateView = kff.createClass(
// {
// 	extend: kff.BindingView
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
