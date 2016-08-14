
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var StyleBinder = createClass(
{
	extend: Binder
},
/** @lends StyleBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for any CSS style property.
	 * Sets the CSS property of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
	},

	init: function()
	{
		this.styleProperty = this.options.params[0] ? this.convertBindingValue(this.options.params[0]) : null;
		this.styleUnit = this.options.params[1] ? this.convertBindingValue(this.options.params[1]) : '';
		StyleBinder._super.init.call(this);
	},

	refresh: function()
	{
		var value = this.value;

		if(this.styleProperty)
		{
			if(value === undefined) delete this.element.style[this.styleProperty];
			else
			{
				if(this.styleUnit) value += this.styleUnit;
				try {
					this.element.style[this.styleProperty] = value;
				}
				catch(e) {}
			}
		}
	}
});

View.registerBinder('style', StyleBinder);

module.exports = StyleBinder;
