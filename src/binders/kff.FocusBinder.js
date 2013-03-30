
kff.FocusBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.FocusBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for focus event.
	 * Sets model atrribute to defined value when element gets focus.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus'];
		kff.EventBinder.call(this, options);
	}

});

kff.BindingView.registerBinder('focus', kff.FocusBinder);