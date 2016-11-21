
import createClass from '../functions/createClass.js';
import Binder from '../Binder.js';
import View from '../View.js';
import Cursor from '../Cursor.js';

var DisabledNotBinder = createClass(
{
	extend: Binder
},
/** @lends DisabledNotBinder.prototype */
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
		Binder.call(this, options);
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
		DisabledNotBinder._super.init.call(this);
	},

	matchValue: function()
	{
		var value = this.value;
		if(value == null) value = null;
		this.updateEqualsToValue();
		return value !== this.equalsTo;
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

	refresh: function()
	{
		this.element.disabled = this.matchValue();
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.element.disabled ? false : this.equalsTo;
		this.updateModel(this.fillVal);
	}
});

View.registerBinder('disablednot', DisabledNotBinder);

export default DisabledNotBinder;