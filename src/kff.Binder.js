
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
		this.dispatch = options.dispatch;
		this.currentValue = null;
		this.bindingIndex = null;
		this.dynamicBindings = null;
		this.value = null;
		this.modelPathWatcher = null;
	},

	/**
	 * Initializes the binder, binds DOM or model events if needed and optionally fetches data from DOM
	 */
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
			}
			if(this.$element && this.options.events !== null) this.delegateEvents(this.options.events);
		}
		if(this.options.fill && this.model instanceof kff.Model) this.fill();
	},

	/**
	 * Destroys the binder, unbinds any events or model watchers
	 */
	destroy: function()
	{
		if(this.model instanceof kff.Model) this.unbindModel();
		if(this.options.watchModelPath) this.unbindModelPathWatcher();
		if(this.$element && this.options.events !== null) this.undelegateEvents(this.options.events);
		this.currentValue = null;
		this.value = null;
	},

	/**
	 * Delegates events. Using the method from kff.View
	 */
	delegateEvents: kff.View.prototype.delegateEvents,

	/**
	 * Undelegates events. Using the method from kff.View
	 */
	undelegateEvents: kff.View.prototype.undelegateEvents,

	/**
	 * Refreshes the binder whenever the model changes.
	 * @param  {Object} event  Event from the model change
	 * @param  {boolean} force If true, force refreshing even if value does not change
	 */
	modelChange: function(event, force)
	{
		var modelValue, formattedValue;
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
				else
				{
					modelValue = this.model[this.options.attr];
					if(typeof modelValue === 'function')
					{
						modelValue = this.callModelAsFunction(modelValue, this.options.modelArgs);
					}
				}
			}
			else modelValue = null;
		}
		else if(typeof this.model === 'string' || typeof this.model === 'number' || typeof this.model === 'boolean')
		{
			modelValue = this.model;
		}
		else if(typeof this.model === 'function')
		{
			modelValue = this.callModelAsFunction(this.model, this.options.modelArgs);
		}
		if(modelValue !== 'undefined')
		{
			formattedValue = this.format(modelValue);
			if(force || !this.compareValues(formattedValue, this.value))
			{
				this.value = formattedValue;
				this.currentValue = modelValue;
				this.refresh();
			}
		}
	},

	/**
	 * Simple compare two values using strict equal operator.
	 *
	 * @param  {mixed} value1 Value 1
	 * @param  {mixed} value2 Value 2
	 * @return {boolean}      Result of comparsion
	 */
	compareValues: function(value1, value2)
	{
		return value1 === value2;
	},

	/**
	 * Compare if two arrays are of the same length and contain the same values compared by the strict equal operator
	 *
	 * @param  {Array} value1 Array 1
	 * @param  {Array} value2 Array 2
	 * @return {boolean}      Result of comparsion
	 */
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

	/**
	 * Returns current formatted value of the model prepared to insertion to the DOM
	 *
	 * @return {mixed} Formatted value
	 */
	getFormattedValue: function()
	{
		return this.value;
	},

	/**
	 * Updates model with the value changed by some DOM event
	 *
	 * @param  {mixed} value    Raw unparsed value from the DOM
	 * @param  {DOMEvent} event Original DOM event
	 */
	updateModel: function(value, event)
	{
		var i, l;
		this.value = value;
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

		if(this.dispatch)
		{
			var action = 'set';
			var params = [];
			if(this.dispatch.length > 0)
			{
				action = this.dispatch[0];
				for(i = 1, l = this.dispatch.length; i < l; i++)
				{
					if(this.dispatch[i].charAt(0) === '@') params.push(this.view.getModel(this.dispatch[i].slice(1)));
					else
					{
						if(this.options.parsers.length === 0) params.push(this.convertValueType(this.dispatch[i]));
						else params.push(this.parse(this.dispatch[i]));
					}
				}

			}

			var rootModelPathArray = this.view.getBoundModelPathArray(this.options.modelPathArray);
			var rootModel = this.view.models[rootModelPathArray.shift()];
			if(this.options.attr) rootModelPathArray.push(this.options.attr);
			this.view.dispatchEvent(action, {
				model: rootModel,
				keyPath: rootModelPathArray,
				value: value,
				domEvent: event,
				params: params
			});
		}
		else if(typeof this.model === 'object' && this.model !== null)
		{
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
			else if(typeof this.model.set === 'function') this.model.set(this.options.attr, this.currentValue);
		}
	},

	/**
	 * Process a value from model through formatting pipeline
	 *
	 * @param  {mixed} value The original value from model
	 * @return {mixed}       Formatted value
	 */
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

	/**
	 * Process a value from DOM through parsing pipeline
	 *
	 * @param  {mixed} value The original value from DOM
	 * @return {mixed}       Parsed value
	 */
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

	/**
	 * Returns binding index of the view in a colelction binding
	 * @param  {string} modelName Model keypath
	 * @return {number}           BInding index
	 */
	getBindingIndex: function(modelName)
	{
		modelName = modelName || this.options.modelName;
		return this.view.getBindingIndex(modelName);
	},

	/**
	 * Create a clone of this object
	 * @return {mixed} Clone of type kff.Binding
	 */
	clone: function()
	{
		return new this.constructor(this.options);
	},

	/**
	 * Refreshes DOM projection of the binding
	 */
	refresh: kff.noop,

	/**
	 * In case of two-way binding, fetches the current binding state/value from the DOM and passes it to
	 * the corresponding model. Most useful for fetching form data into the model.
	 */
	fill: kff.noop,

	/**
	 * Binds event listeners to the model
	 */
	bindModel: function()
	{
		if(this.model instanceof kff.Model) this.model.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	/**
	 * Unbinds event listeners from the model
	 */
	unbindModel: function()
	{
		if(this.model instanceof kff.Model) this.model.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	/**
	 * Sets up the model path watcher on the model. The model path watcher binds listeners to every model in model
	 * keypath and rebinds them on a change of any intermediate model so that model is always up to date.
	 *
	 * @private
	 */
	bindModelPathWatcher: function()
	{
		this.modelPathWatcher.on('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	/**
	 * Unbinds any listeners previously bound by bindModelPathWatcher
	 *
	 * @private
	 */
	unbindModelPathWatcher: function()
	{
		this.modelPathWatcher.off('change' + (this.options.attr === null ? '' : ':' + this.options.attr), this.f('modelChange'));
	},

	/**
	 * Rebinds model event listeners for the actual model retrieved by model keypath.
	 *
	 * @private
	 */
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

	/**
	 * Returns true if any of formatters uses binding index property.
	 * Used by the binding view to decide which binders need to be refreshed when their binding index changes
	 *
	 * @private
	 * @return {Boolean} True if rendering of the value depends on the binding index
	 */
	isIndexed: function()
	{
		return this.options.indexed;
	},

	/**
	 * Creates a new function that works as event pipeline when event filter is used
	 *
	 * @private
	 * @param  {DOMEvent} originalTriggerEvent Original event
	 * @param  {function} eventFilter          Filter function
	 * @return {function}                      Composed function
	 */
	createFilterTriggerEvent: function(originalTriggerEvent, eventFilter)
	{
		return function(event)
		{
			return eventFilter.fn.apply(this, [originalTriggerEvent, event].concat(eventFilter.args));
		}
	},

	/**
	 * Converts string from binder atribute to primitive type using some basic implicit rules.
	 * 'null' => null
	 * 'true' => true
	 * 'false' => false
	 * numeric values => number
	 * otherwise => keep original string
	 *
	 * @private
	 * @param  {string} value Original value
	 * @return {mixed}        Converted value
	 */
	convertValueType: function(value)
	{
		if(value === 'null') return null;
		if(value === 'true') return true;
		if(value === 'false') return false;
		var n = value - 0;
		if(n == value) return n;
		return value;
	},

	callModelAsFunction: function(model, modelArgs)
	{
		var args = [];
		if(modelArgs instanceof Array)
		{
			for(i = 0, l = modelArgs.length; i < l; i++)
			{
				if(modelArgs[i] instanceof Array) args[i] = this.view.getModel(modelArgs[i]);
				else args[i] = this.convertValueType(modelArgs[i]);
			}
		}
		return model.apply(null, args);
	}
});
