(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/** @class */
	kff.TextBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.TextBinder.prototype */
	{
		init: function()
		{
			kff.TextBinder._super.init.call(this);
		},

		refresh: function(value)
		{
			this.$element.text(this.values.join(' '));
		}
	});


	kff.BindingView.registerBinder('text', kff.TextBinder);


})(this);