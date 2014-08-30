
kff.TextBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text content of the element.
	 * Renders text content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	refresh: function(value)
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		this.$element[0].textContent = val;
	}
});

if(typeof document === 'object' && document !== null)
{
	if(!('textContent' in document.documentElement))
	{
		kff.TextBinder.prototype.refresh = function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			this.$element[0].innerText = val;
		};
	}
}

kff.BindingView.registerBinder('text', kff.TextBinder);
