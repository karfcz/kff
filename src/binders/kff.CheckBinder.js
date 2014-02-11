
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
	},

	inputChange: function(event)
	{
		this.updateModel(this.$element.prop('checked'));
	},

	refresh: function()
	{
		this.$element.prop('checked', !!this.value);
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.is(':checked');
		this.updateModel(this.fillVal);
	}
});

kff.BindingView.registerBinder('check', kff.CheckBinder);
