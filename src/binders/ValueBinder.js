
var createClass = require('../functions/createClass');
var arrayIndexOf = require('../functions/arrayIndexOf');
var compareArrays = require('../functions/compareArrays');
var setImmediate = require('../functions/setImmediate');
var Binder = require('../Binder');
var View = require('../View');

var ValueBinder = createClass(
{
	extend: Binder
},
/** @lends ValueBinder.prototype */
{
	/**
	 * Two-way data binder for input, select, textarea elements.
	 * Triggers model change on keydown, drop and change events on default.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'keypress keydown drop change';
		options.events = [
			[eventNames, 'inputChange']
		];
		this.multiple = false;
		Binder.call(this, options);
		if(this.options.fill) this.fillVal = this.getValue();
	},

	init: function()
	{
		this.multiple = this.$element[0].nodeName === 'SELECT' && this.$element[0].multiple;
		if(this.multiple)
		{
			this.getValue = this.getArrayValue;
			this.setValue = this.setArrayValue;
			this.compareValues = compareArrays;
		}
		if(this.options.eventFilters && this.options.eventFilters[0])
		{
			this.inputChange = this.createFilterTriggerEvent(this.inputChange, this.options.eventFilters[0]);
		}
		Binder.prototype.init.call(this);
	},

	inputChange: function(event)
	{
		setImmediate(this.f(function()
		{
			this.updateModel(this.getValue(), event);
		}));
	},

	refresh: function()
	{
		var val = this.getFormattedValue();
		if(val === null || val === undefined) val = '';

		if(this.$element[0].nodeName === 'SELECT')
		{
			setImmediate(this.f(function()
			{
				this.setValue(val);
			}));
		}
		else
		{
			this.setValue(val);
		}
	},

	fill: function()
	{
		if(!this.fillVal)
		{
			this.fillVal = this.getValue();
		}
		this.updateModel(this.fillVal);
	},

	getValue: function()
	{
		return this.$element[0].value;
	},

	setValue: function(val)
	{
		this.$element[0].value = val;
	},

	getArrayValue: function()
	{
		var result = [];
		var options = this.$element[0] && this.$element[0].options;
		var option;

		for(var i = 0, l = options.length; i < l; i++)
		{
			option = options[i];
			if(option.selected)
			{
				result.push(option.value || option.text);
			}
		}
		return result;
	},

	setArrayValue: function(val)
	{
		if(!(val instanceof Array)) val = [val];
		var options = this.$element[0] && this.$element[0].options;
		var option;

		for(var i = 0, l = options.length; i < l; i++)
		{
			option = options[i];
			option.selected = arrayIndexOf(val, this.parse(option.value)) !== -1;
		}
	}
});

View.registerBinder('val', ValueBinder);

module.exports = ValueBinder;
