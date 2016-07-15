
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');
var Cursor = require('../Cursor');

var DisabledBinder = createClass(
{
	extend: Binder
},
/** @lends DisabledBinder.prototype */
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
		DisabledBinder._super.init.call(this);
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

	refresh: function()
	{
		this.element.disabled = this.matchValue();
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = !!this.element.disabled;
		this.updateModel(this.fillVal);
	}

});

View.registerBinder('disabled', DisabledBinder);

module.exports = DisabledBinder;
