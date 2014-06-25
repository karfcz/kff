
kff.InsertBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.InsertBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for inserting/removing element from DOM.
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
		this.equalsTo = this.options.params[0] || true;
		this.operator = this.options.params[1] || null;

		this.isInserted = true;
		kff.InsertBinder._super.init.call(this);
	},

	refresh: function()
	{
		var parentNode;
		if(!this.anchor) this.anchor = document.createTextNode('');
		if(this.matchValue())
		{
			if(!this.isInserted)
			{
				parentNode = this.anchor.parentNode;

				if(parentNode)
				{
					parentNode.replaceChild(this.$element[0], this.anchor);
				}
				this.isInserted = true;
			}
		}
		else
		{
			if(this.isInserted)
			{
				parentNode = this.$element[0].parentNode;

				if(parentNode)
				{
					parentNode.replaceChild(this.anchor, this.$element[0]);
				}
				this.isInserted = false;
			}
		}
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

kff.BindingView.registerBinder('insert', kff.InsertBinder);
