
kff.DisabledBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.DisabledBinder.prototype */
{
	/**
	 * Two-way data binder for checkbox.
	 * Checks input when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
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

kff.BindingView.registerBinder('disabled', kff.DisabledBinder);
