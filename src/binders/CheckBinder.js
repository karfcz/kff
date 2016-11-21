
import createClass from '../functions/createClass.js';
import Binder from '../Binder.js';
import View from '../View.js';
import Cursor from '../Cursor.js';

var CheckBinder = createClass(
{
	extend: Binder
},
/** @lends CheckBinder.prototype */
{
	/**
	 * Two-way data binder for checkbox.
	 * Checks input when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		Binder.call(this, options);
		if(this.options.fill) this.fillVal = this.element.checked;
		this.equalsTo = undefined;
		this.valueCursor = undefined;
	},

	init: function()
	{
		this.equalsTo = true;
		if(this.options.params[0])
		{
			this.equalsTo = this.convertBindingValue(this.options.params[0]);
			if(this.equalsTo instanceof Cursor)
			{
				this.valueCursor = this.equalsTo;
				this.equalsTo = this.valueCursor.get();
			}
			if(this.equalsTo == null) this.equalsTo = null;
		}
		CheckBinder._super.init.call(this);
	},

	inputChange: function(event)
	{
		this.updateEqualsToValue();
		this.updateModel(this.element.checked ? this.equalsTo : false, event);
	},

	refresh: function()
	{
		this.element.checked = this.matchValue();
	},

	matchValue: function()
	{
		var value = this.value;
		if(value == null) value = null;
		this.updateEqualsToValue();
		return value === this.equalsTo;
	},

	updateEqualsToValue: function()
	{
		if(this.options.params.length > 0)
		{
			if(this.valueCursor)
			{
				this.equalsTo = this.valueCursor.get();
				if(this.equalsTo == null) this.equalsTo = null;
			}
		}
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.element.checked;
		this.updateModel(this.fillVal);
	}
});

View.registerBinder('check', CheckBinder);

export default CheckBinder;
