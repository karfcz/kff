
kff.Binder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
	 * @constructs
	*/
	constructor: function(options)
	{
		this.options = options;
		this.options.events = options.events || [];

		this.view = options.view;
		this.$element = options.$element;
		this.model = options.model;
		this.setter = (options.setters && options.setters.length > 0) ? options.setters[0] : null;
		this.getter = (options.getters && options.getters.length > 0) ? options.getters[0] : null;
		this.currentValue = null;
		this.bindingIndex = null;
		this.dynamicBindings = null;
		this.value = null;
	},

	init: function()
	{
		if(!this.options.nobind)
		{
			if(this.options.watchModelPath)
			{
				this.rebind();
			}
			else if(this.model instanceof kff.Model)
			{
				this.model.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
				if(this.$element && this.options.events.length > 0) this.delegateEvents(this.options.events);
			}
		}
		if(this.options.fill && this.model instanceof kff.Model) this.fill();
	},

	destroy: function()
	{
		if(this.model instanceof kff.Model) this.model.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
		if(this.options.watchModelPath) this.unbindDynamic();
		if(this.$element && this.options.events.length > 0) this.undelegateEvents(this.options.events);
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
			if(this.getter && typeof this.model[this.getter.fn] === 'function')
			{
				if(this.getter.args.length > 0)
				{
					var args = [];
					for(var i = 0, l = this.getter.args.length; i < l; i++)
					{
						if(this.getter.args[i] === '@attr') args[i] = this.options.attr;
						else args[i] = this.view.getModel(this.getter.args[i]);
					}
					modelValue = this.model[this.getter.fn].apply(this.model, args);
				}
				else
				{
					modelValue = this.model[this.getter.fn](this.options.attr);
				}
			}
			else if(event !== true) modelValue = event.changed[this.options.attr];
			else if(typeof this.options.attr === 'string') modelValue = this.model.get(this.options.attr);
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
		return value1 === value2;
	},

	compareArrayValues: function(value1, value2)
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
		else return false;
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

		if(this.setter && typeof this.model[this.setter.fn] === 'function')
		{
			if(this.setter.args.length > 0)
			{
				var args = [];
				for(var i = 0, l = this.setter.args.length; i < l; i++)
				{
					if(this.setter.args[i] === '@val') args[i] = this.currentValue;
					else if(this.setter.args[i] === '@attr') args[i] = this.options.attr;
					else args[i] = this.view.getModel(this.setter.args[i]);
				}
				this.model[this.setter.fn].apply(this.model, args);
			}
			else if(this.options.attr === null)
			{
				this.model[this.setter.fn](this.currentValue);
			}
			else
			{
				this.model[this.setter.fn](this.options.attr, this.currentValue);
			}
		}
		else this.model.set(this.options.attr, this.currentValue);
	},

	refresh: function(value){},

	format: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.options.formatters.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.formatters[i].fn.apply(this, [value[j]].concat(this.options.formatters[i].args));
				value = value2;
			}
			else value = this.options.formatters[i].fn.apply(this, [value].concat(this.options.formatters[i].args));
		}
		return value;
	},

	parse: function(value)
	{
		var i, l, j, k, value2;
		for(i = 0, l = this.options.parsers.length; i < l; i++)
		{
			if(value instanceof Array)
			{
				value2 = [];
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.parsers[i].fn.apply(this, [value[j]].concat(this.options.parsers[i].args));
				value = value2;
			}
			else value = this.options.parsers[i].fn.apply(this, [value].concat(this.options.parsers[i].args));
		}
		return value;
	},

	getBindingIndex: function(modelName)
	{
		modelName = modelName || this.options.modelName;
		return this.view.getBindingIndex(modelName);
	},

	clone: function()
	{
		return new this.constructor(this.options);
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
			this.model.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
			if(this.$element && this.options.events.length > 0) this.undelegateEvents.call(this, this.options.events);
		}

		this.bindDynamic();
		if(this.model instanceof kff.Model)
		{
			this.model.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
			if(this.$element && this.options.events.length > 0) this.delegateEvents.call(this, this.options.events);
			this.modelChange(true);
		}
	},

	bindDynamic: function()
	{
		var modelName = this.options.modelPathArray[0],
			model = this.view.getModel(modelName),
			attr;

		this.dynamicBindings = [];

		for(var i = 1, l = this.options.modelPathArray.length; i < l; i++)
		{
			attr = this.options.modelPathArray[i];
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
		if(this.dynamicBindings)
		{
			for(var i = 0, l = this.dynamicBindings.length; i < l; i++)
			{
				this.dynamicBindings[i].model.off('change:' + this.dynamicBindings[i].attr, this.f('rebindTimed'));
			}
			this.dynamicBindings = null;
		}
	}

});
