
kff.Binder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		this.options = options;
		this.eventNames = options.eventNames;
		this.events = options.events || [];
		this.view = options.view;
		this.$element = options.$element;
		this.attr = options.attr;
		this.model = options.model;
		this.modelName = options.modelName;
		this.modelPathArray = options.modelPathArray;
		this.parsers = options.parsers;
		this.formatters = options.formatters;
		this.setter = (options.setters instanceof Array && options.setters.length > 0) ? options.setters[0] : null;
		this.getter = (options.getters instanceof Array && options.getters.length > 0) ? options.getters[0] : null;
		this.params = options.params;
		this.currentValue = null;
		this.bindingIndex = null;
		this.dynamicBindings = [];
		this.value = null;
	},

	init: function()
	{
		if(this.options.watch)
		{
			this.rebind();
		}
		else if(this.model instanceof kff.Model)
		{
			this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.delegateEvents.call(this, this.events);
		}
		if(this.options.fill && this.model instanceof kff.Model) this.fill();
	},

	destroy: function()
	{
		if(this.model instanceof kff.Model) this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
		if(this.options.watch) this.unbindDynamic();
		if(this.$element && this.events.length > 0) this.undelegateEvents.call(this, this.events);
		this.currentValue = null;
		this.value = null;
	},

	delegateEvents: kff.View.prototype.delegateEvents,

	undelegateEvents: kff.View.prototype.undelegateEvents,

	modelChange: function(event)
	{
		var modelValue;
		if(this.model instanceof kff.Model)
		{
			if(this.getter && typeof this.model[this.getter] === 'function') modelValue = this.model[this.getter](this.attr);
			else if(event !== true) modelValue = event.changed[this.attr];
			else if(typeof this.attr === 'string') modelValue = this.model.get(this.attr);
			else modelValue = null;

			if(event === true || !this.compareValues(modelValue, this.currentValue))
			{
				this.value = this.format(modelValue);
				this.currentValue = modelValue;
				this.refresh();
			}
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
		return this.value;
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
		if(this.setter && typeof this.model[this.setter] === 'function')
		{
			if(this.attr === null) this.model[this.setter](this.currentValue);
			else this.model[this.setter](this.attr, this.currentValue);
		}
		else this.model.set(this.attr, this.currentValue);
	},

	refresh: function(value){},

	format: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.formatters.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.formatters[i].fn.apply(this, [value[j]].concat(this.formatters[i].args));
				value = value2;
			}
			else value = this.formatters[i].fn.apply(this, [value].concat(this.formatters[i].args));
		}
		return value;
	},

	parse: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.parsers.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.parsers[i].fn.apply(this, [value[j]].concat(this.parsers[i].args));
				value = value2;
			}
			else value = this.parsers[i].fn.apply(this, [value].concat(this.parsers[i].args));
		}
		return value;
	},

	getBindingIndex: function(modelName)
	{
		modelName = modelName || '*';
		return this.view.getBindingIndex(modelName);
	},

	clone: function()
	{
		var obj = new this.constructor({
			eventNames: this.eventNames,
			view: null,
			$element: this.$element,
			attr: this.attr,
			model: null,
			modelName: this.modelName,
			modelPathArray: this.modelPathArray,
			parsers: this.parsers,
			formatters: this.formatters,
			params: this.params,
			fill: this.options.fill
		});
		obj.setter = this.setter;
		obj.getter = this.getter;
		return obj;
	},

	fill: function(){},

	rebindTimed: function(event)
	{
		kff.setZeroTimeout(this.f('rebind'));
	},

	rebind: function(event)
	{
		this.unbindDynamic();
		if(this.model instanceof kff.Model)
		{
			this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.undelegateEvents.call(this, this.events);
		}

		this.bindDynamic();
		if(this.model instanceof kff.Model)
		{
			this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
			if(this.$element && this.events.length > 0) this.delegateEvents.call(this, this.events);
			this.modelChange(true);
		}
	},

	bindDynamic: function()
	{
		var modelName = this.modelPathArray[0],
			model = this.view.getModel(modelName),
			attr;

		for(var i = 1, l = this.modelPathArray.length; i < l; i++)
		{
			attr = this.modelPathArray[i];
			if(model instanceof kff.Model)
			{
				model.on('change:' + attr, this.f('rebindTimed'));
				this.dynamicBindings.push({ model: model, attr: attr });
				model = model.get(attr);
			}
			else if(model !== null && typeof model === 'object' && (attr in model)) model = model.attr;
			else model = null;
		}
		if(model instanceof kff.Model) this.model = model;
		else this.model = null;
	},

	unbindDynamic: function()
	{
		for(var i = 0, l = this.dynamicBindings.length; i < l; i++)
		{
			this.dynamicBindings[i].model.off('change:' + this.dynamicBindings[i].attr, this.f('rebindTimed'));
		}
		this.dynamicBindings = [];
	}

});
