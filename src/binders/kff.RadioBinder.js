
kff.RadioBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.RadioBinder.prototype */
{
	/**
	 * Two-way data binder for radio button.
	 * Checks radio when model atrribute evaluates to true, unchecks otherwise.
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
		if(this.$element[0].checked)
		{
			this.updateModel(this.$element[0].value);
		}
	},

	refresh: function()
	{
		this.$element[0].checked = this.parse(this.$element[0].value) === this.currentValue;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element[0].checked;
		if(this.fillVal)
		{
			this.updateModel(this.$element[0].value);
		}
	}

});

kff.BindingView.registerBinder('radio', kff.RadioBinder);
