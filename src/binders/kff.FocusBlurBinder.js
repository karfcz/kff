
kff.FocusBlurBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.FocusBlurBinder.prototype */
{
	/**
	 * Two-way data binder for focus/blur event.
	 * Sets model atrribute to true when element gets focus or to false when it looses focus.
	 * Also triggers focus/blur event on attribute change.
	 * Values are passed throught eventual parsers/formatters of course.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus blur'];
		kff.EventBinder.call(this, options);
	},

	triggerEvent: function(event)
	{
		this.updateModel(this.view.env.document.activeElement === this.$element[0]);
	},

	refresh: function()
	{
		if(this.value)
		{
			if(this.view.env.document.activeElement !== this.$element[0]) this.$element[0].focus();
		}
		else
		{
			if(this.view.env.document.activeElement === this.$element[0]) this.$element[0].blur();
		}
	}
});

kff.BindingView.registerBinder('focusblur', kff.FocusBlurBinder);