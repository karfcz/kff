
kff.CheckBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.CheckBinder.prototype */
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
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
		if(this.options.fill) this.fillVal = this.$element[0].checked;
	},

	inputChange: function(event)
	{
		this.updateModel(this.$element[0].checked);
	},

	refresh: function()
	{
		this.$element[0].checked = !!this.value;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element[0].checked;
		this.updateModel(this.fillVal);
	}
});

kff.BindingView.registerBinder('check', kff.CheckBinder);
