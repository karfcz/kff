(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


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
			this.parsers = options.parsers;
			this.formatters = options.formatters;
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
		},

		delegateEvents: kff.View.prototype.delegateEvents,

		undelegateEvents: kff.View.prototype.undelegateEvents,

		modelChange: function(force)
		{
			var modelValue = this.model.get(this.attr);

			if(!this.compareValues(modelValue, this.currentValue) || force === true)
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
		},

		getBindingIndex: function()
		{
			return this.view.getBindingIndex();
		}

	});

})(this);