kff.View.helpers = {
	uppercase: function(v) {
		return (v || '').toUpperCase();
	},

	bold: function(v) {
		return '<strong> ' + v + '</strong>';
	},

	toInt: function(v)
	{
		v = parseInt(v);
		if(isNaN(v)) v = 0;
		return v;
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
		if(!silent) this.trigger('destroy');
	},

	initBinding: function()
	{
		var name = this.$element.attr('data-kff-bind');
		var names = name.split(/\s+/);
		var modelStruct, attrName;
		this.boundModelStructs = [];
		// console.log('name ', name )
		for(var i = 0, l = names.length; i < l; i++)
		{
			name = names[i];
			name = name.replace(/^\./, '*.');
			name = name.replace(/\.$/, '.*');
			//if(this.options.bindingIndex) name = name.replace(/^\*/, this.options.bindingIndex);

			// console.log('name', name);
			//if(this.options.bindingIndex) name = name.replace(/^\./, this.options.bindingIndex + '.');
			// console.log('replacedName: ', name)
			name = name.split('.');
			if(name.length > 1)
			{
				attrName =  name.pop();
				if(attrName === '*') attrName = null;
				modelStruct = {
					attr: attrName,
					model: this.getModel(name)
				};
				// console.log('modelStruct ', modelStruct )
				if(modelStruct.model instanceof kff.Model) modelStruct.model.on('change' + (modelStruct.attr === null ? '' : ':' + modelStruct.attr), this.f('modelChange'));
				else if(modelStruct.model instanceof kff.Collection) this.initCollection(modelStruct);
				this.boundModelStructs[i] = modelStruct;
				this.models['*'] = modelStruct.model;
			}
		}

		var formatStr = this.$element.attr('data-kff-format');
		if(formatStr)
		{
			var formatArr = formatStr.split(/\s+/);
			this.formatters = [];
			for(i = 0, l = formatArr.length; i < l; i++)
			{
				if(formatArr[i] in kff.View.helpers) this.formatters.push(kff.View.helpers[formatArr[i]]);
			}
		}

		var parseStr = this.$element.attr('data-kff-parse');
		if(parseStr)
		{
			var parseArr = parseStr.split(/\s+/);
			this.parsers = [];
			for(i = 0, l = parseArr.length; i < l; i++)
			{
				if(parseArr[i] in kff.View.helpers) this.parsers.push(kff.View.helpers[parseArr[i]]);
			}
		}
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

	initCollection: function(modelStruct)
	{
		// console.log('initCollection')
		this.boundCollectionStruct = {
			attr: modelStruct.attr,
			collection: modelStruct.model
		};
	},

	renderSubViews: function(){},

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

	refreshBoundViews: function()
	{
		// console.log('refreshBoundViews')
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

		// console.log('$elements ', this.$elements)

		this.$anchor.after(this.$elements);
	},

	getModel: function(modelPath)
	{
		var modelIndex;
		if(typeof modelPath === 'string') modelPath = modelPath.split('.');

		// console.log('modelPath: ', modelPath)

		modelIndex = parseInt(modelPath[0]);

		// console.log('modelIndex: ', modelIndex)

		if(this.boundCollectionStruct && !isNaN(modelIndex)) return this.boundCollectionStruct.collection.findByIndex(modelIndex);


		return kff.BindingView._super.getModel.call(this, modelPath);
	},

	modelChange: function()
	{
		var modelValues = this.computeValues();
		if(!this.compareValues(modelValues, this.currentValues))
		{
			this.refresh(this.format(this.concat(modelValues)));
			this.currentValues = modelValues;
		}
	},

	updateModel: function(value)
	{
		this.currentValues[0] = this.parse(value);
		if(this.boundModelStructs[0]) this.boundModelStructs[0].model.set(this.boundModelStructs[0].attr, this.currentValues[0]);
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
		var values = [];
		for(var i = 0, l = this.boundModelStructs.length; i < l; i++)
		{
			values[i] = this.boundModelStructs[i].model.get(this.boundModelStructs[i].attr);
		}
		return values;
	},

	concat: function(values)
	{
		if(values.length === 1) return values[0];
		else return values.join('');
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
 * kff.AttributeView
 */

kff.AttributeView = kff.createClass(
{
	extend: kff.BindingView
},
{
	initBinding: function()
	{
		this.attribute = this.$element.attr('data-kff-attribute');
		this.prefix = this.$element.attr('data-kff-prefix') || '';
		kff.AttributeView._super.initBinding.call(this);
	},

	refresh: function(value)
	{
		if(this.attribute) this.$element.attr(this.attribute, this.prefix + value);
	}
});
