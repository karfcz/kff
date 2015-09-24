
var createClass = require('./functions/createClass');
var arrayConcat = require('./functions/arrayConcat');
var noop = require('./functions/noop');
var View = require('./View');

var convertValueType = require('./functions/convertValueType');
var callModelAsFunction = require('./functions/callModelAsFunction');

var Binder = createClass(
/** @lends Binder.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function(options)
	{
		this.options = options;
		this.options.events = options.events || null;

		this.view = options.view;
		this.element = options.element;
		this.cursor = null;
		this.keyPath = options.keyPath;
		this.dispatch = options.dispatch;
		this.currentValue = null;
		this.value = null;
		this.animate = options.animate;
	},

	/**
	 * Initializes the binder, binds DOM or model events if needed and optionally fetches data from DOM
	 */
	init: function()
	{
		if(!this.options.nobind)
		{
			if(this.element && this.options.events !== null) this.delegateEvents(this.options.events);
		}
		this.rebindCursor();
		if(this.options.fill) this.fill();
	},

	/**
	 * Destroys the binder, unbinds any events or model watchers
	 */
	destroy: function()
	{
		if(this.element && this.options.events !== null) this.undelegateEvents(this.options.events);
		this.currentValue = null;
		this.value = null;
	},

	/**
	 * Delegates events. Using the method from View
	 */
	delegateEvents: View.prototype.delegateEvents,

	/**
	 * Undelegates events. Using the method from View
	 */
	undelegateEvents: View.prototype.undelegateEvents,

	/**
	 * Refreshes the binder whenever the model changes.
	 * @param  {Object} event  Event from the model change
	 * @param  {boolean} force If true, force refreshing even if value does not change
	 */
	modelChange: function(event, force)
	{
		var modelValue, formattedValue;

		modelValue = this.cursor.get();

		if(typeof modelValue === 'function')
		{
			modelValue = callModelAsFunction(this.view, modelValue, this.options.modelArgs);
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

		var action = 'set';
		var params = [];
		if(this.dispatch && this.dispatch.length > 0)
		{
			action = this.dispatch[0];
			for(i = 1, l = this.dispatch.length; i < l; i++)
			{
				params.push(this.convertBindingValue(this.dispatch[i]));
			}
		}

		this.view.dispatchEvent({
			type: action,
			cursor: this.cursor,
			value: value,
			domEvent: event,
			params: params
		});
	},

	convertBindingValue: function(value)
	{
		if(typeof value === 'string' && value.charAt(0) === '@')
		{
			return this.view.getCursor(value.slice(1));
		}
		else
		{
			if(this.options.parsers.length === 0) return convertValueType(value);
			else return this.parse(value);
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.formatters[i].fn.apply(this, arrayConcat([value[j]], this.options.formatters[i].args));
				value = value2;
			}
			else value = this.options.formatters[i].fn.apply(this, arrayConcat([value], this.options.formatters[i].args));
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
				for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.parsers[i].fn.apply(this, arrayConcat([value[j]], this.options.parsers[i].args));
				value = value2;
			}
			else value = this.options.parsers[i].fn.apply(this, arrayConcat([value], this.options.parsers[i].args));
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
	 * @return {mixed} Clone of type Binding
	 */
	clone: function()
	{
		return new this.constructor(this.options);
	},

	/**
	 * Refreshes DOM projection of the binding
	 */
	refresh: noop,

	/**
	 * In case of two-way binding, fetches the current binding state/value from the DOM and passes it to
	 * the corresponding model. Most useful for fetching form data into the model.
	 */
	fill: noop,

	/**
	 * Rebinds model event listeners for the actual model retrieved by model keypath.
	 *
	 * @private
	 */
	rebindCursor: function()
	{
		this.cursor = this.view.getCursor(this.keyPath);
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
		};
	}

});

module.exports = Binder;