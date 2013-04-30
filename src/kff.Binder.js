
kff.Binder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		this.options = options;
		this.options.events = this.options.events || [];
		this.view = options.view;
		this.$element = options.$element;
		this.attr = options.attr;
		this.model = options.model;
		this.modelName = options.modelName;
		this.parsers = options.parsers;
		this.formatters = options.formatters;
		this.setter = (options.setters instanceof Array && options.setters.length > 0) ? options.setters[0] : null;
		this.getter = (options.getters instanceof Array && options.getters.length > 0) ? options.getters[0] : null;
		this.values = options.values;
		this.valueIndex = options.valueIndex;
		this.params = options.params;
		this.currentValue = null;
		this.bindingIndex = null;
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
		this.currentValue = null;
		this.values[this.valueIndex] = null;
		// this.refresh(); // Vrácení do původního stavu dělá problém s bindingy v kolekcích
	},

	delegateEvents: kff.View.prototype.delegateEvents,

	undelegateEvents: kff.View.prototype.undelegateEvents,

	modelChange: function(event)
	{
		var modelValue;
		if(this.getter && typeof this.model[this.getter] === 'function') modelValue = this.model[this.getter](this.attr);
		else if(event !== true) modelValue = event.changed[this.attr];
		else if(typeof this.attr === 'string') modelValue = this.model.get(this.attr);
		else return;

		if(event === true || !this.compareValues(modelValue, this.currentValue))
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
		if(this.setter && typeof this.model[this.setter] === 'function') this.model[this.setter](this.currentValue);
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.formatters[i].call(this, value[j]);
				value = value2;
			}
			else value = this.formatters[i].call(this, value);
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.parsers[i].call(this, value[j]);
				value = value2;
			}
			value = this.parsers[i].call(this, value);
		}
		return value;
	},

	getBindingIndex: function()
	{
		return this.view.getBindingIndex(this.modelName);
	}

});
