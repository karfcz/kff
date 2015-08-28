
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

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
	},

	refresh: function()
	{
		this.$element[0].disabled = !!this.value;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = !!this.$element[0].disabled;
		this.updateModel(this.fillVal);
	}
});

View.registerBinder('disabled', DisabledBinder);

module.exports = DisabledBinder;
