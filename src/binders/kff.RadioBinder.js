
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
	},

	inputChange: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			if(this.$element.is(':checked'))
			{
				this.updateModel(this.$element.val());
			}
		}));
	},

	refresh: function()
	{
		this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.is(':checked');
		kff.setZeroTimeout(this.f(function()
		{
			if(this.fillVal)
			{
				this.updateModel(this.$element.val());
			}
		}));
	}

});

kff.BindingView.registerBinder('radio', kff.RadioBinder);
