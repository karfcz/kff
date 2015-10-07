
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

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
	},

	refresh: function()
	{
		this.element.disabled = !this.value;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = !this.element.disabled;
		this.updateModel(this.fillVal);
	}
});

View.registerBinder('disablednot', DisabledNotBinder);

module.exports = DisabledNotBinder;
