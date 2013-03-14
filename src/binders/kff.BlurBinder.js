
kff.BlurBinder = kff.createClass(
{
	extend: kff.EventBinder
},
/** @lends kff.BlurBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for blur event.
	 * Sets model atrribute to defined value when element looses focus.
	 *
	 * @constructs
	 * @augments kff.EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['blur'];
		kff.EventBinder.call(this, options);
	}

});

kff.BindingView.registerBinder('blur', kff.BlurBinder);