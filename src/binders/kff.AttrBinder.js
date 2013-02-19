(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	/** @class */
	kff.AttrBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.AttrBinder.prototype */
	{
		init: function()
		{
			this.attribute = this.params[0] || null;
			this.prefix = this.params[1] || null;
			// this.prefix = this.$element.attr('data-kff-prefix') || '';
			kff.AttrBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue());
		}
	});

	kff.BindingView.registerBinder('attr', kff.AttrBinder);


})(this);