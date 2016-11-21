
import createClass from '../functions/createClass.js';
import arrayIndexOf from '../functions/arrayIndexOf.js';
import compareArrays from '../functions/compareArrays.js';
import setImmediate from '../functions/setImmediate.js';
import Binder from '../Binder.js';
import View from '../View.js';

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
		this.multiple = this.element.nodeName === 'SELECT' && this.element.multiple;
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

		if(this.element.nodeName === 'SELECT')
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
		return this.element.value;
	},

	setValue: function(val)
	{
		if(val == '' || this.element.type !== 'file') this.element.value = val;
	},

	getArrayValue: function()
	{
		var result = [];
		var options = this.element && this.element.options;
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
		if(!Array.isArray(val)) val = [val];
		var options = this.element && this.element.options;
		var option;

		for(var i = 0, l = options.length; i < l; i++)
		{
			option = options[i];
			option.selected = arrayIndexOf(val, this.parse(option.value)) !== -1;
		}
	}
});

View.registerBinder('val', ValueBinder);

export default ValueBinder;