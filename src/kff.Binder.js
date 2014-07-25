
kff.Binder = kff.createClass(
/** @lends kff.Binder.prototype */
{
	/**
	 * @constructs
	*/
	constructor: function(options)
	{
		this.options = options;
		this.options.events = options.events || null;

		this.view = options.view;
		this.$element = options.$element;
		this.model = options.model;
		this.setter = options.setter;
		this.getter = options.getter;
		this.currentValue = null;
		this.bindingIndex = null;
		this.dynamicBindings = null;
		this.value = null;
		this.modelPathWatcher = null;
	},

	init: function()
	{
		if(!this.options.nobind)
		{
			if(this.options.watchModelPath)
			{
				var rootModel = this.view.models[this.options.modelPathArray[0]];
				var modelPathArray = this.options.modelPathArray.slice(1);
				modelPathArray.push(this.options.attr);
				this.modelPathWatcher = new kff.ModelPathWatcher(rootModel, modelPathArray);
				this.modelPathWatcher.init();
				this.bindModelPathWatcher();
				if(this.$element && this.options.events !== null) this.delegateEvents(this.options.events);
			}
			else if(this.model instanceof kff.Model)
			{
				this.bindModel();
				if(this.$element && this.options.events !== null) this.delegateEvents(this.options.events);
			}
		}
		if(this.options.fill && this.model instanceof kff.Model) this.fill();
	},

	destroy: function()
	{
		if(this.model instanceof kff.Model) this.unbindModel();
		if(this.options.watchModelPath) this.unbindModelPathWatcher();
		if(this.$element && this.options.events !== null) this.undelegateEvents(this.options.events);
		this.currentValue = null;
		this.value = null;
	},

	delegateEvents: kff.View.prototype.delegateEvents,

	undelegateEvents: kff.View.prototype.undelegateEvents,

	modelChange: function(event, force)
	{
		var modelValue;
		if(this.modelPathWatcher)
		{
			this.model = this.modelPathWatcher.model;
		}
		if(this.model instanceof kff.Model || (typeof this.model === 'object' && this.model !== null))
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
			else if(event) modelValue = event.changed[this.options.attr];
			else if(typeof this.options.attr === 'string')
			{
				if(typeof this.model.get === 'function') modelValue = this.model.get(this.options.attr);
				else modelValue = this.model[this.options.attr];
			}
			else modelValue = null;

			if(force || !this.compareValues(modelValue, this.currentValue))
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
				for(i = 0, l = this.setter.args.length; i < l; i++)
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

	bindModel: function()
	{
		if(this.model instanceof kff.Model) this.model.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	unbindModel: function()
	{
		if(this.model instanceof kff.Model) this.model.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	bindModelPathWatcher: function()
	{
		this.modelPathWatcher.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	unbindModelPathWatcher: function()
	{
		this.modelPathWatcher.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	rebindModel: function()
	{
		if(!this.options.nobind)
		{
			this.unbindModel();
		}
		this.model = this.view.getModel(this.options.modelPathArray);
		if(!this.options.nobind)
		{
			this.bindModel();
		}
	},

	isIndexed: function()
	{
		return this.options.indexed;
	}
});
