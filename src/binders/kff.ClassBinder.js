
kff.ClassBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ClassBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for CSS class.
	 * Sets the class of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.className = this.params[0] || null;
		this.equalsTo = this.params[1] || true;
		this.operator = this.params[2] || null;
		kff.ClassBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.className) this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
	},

	matchValue: function()
	{
		if(this.equalsTo)
		{
			if(this.operator === 'ne')	return this.value !== this.parse(this.equalsTo);
			else return this.value === this.parse(this.equalsTo);
		}
		else return this.value;
	}
});

kff.BindingView.registerBinder('class', kff.ClassBinder);
