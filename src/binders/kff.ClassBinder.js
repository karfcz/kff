(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/** @class */
	kff.ClassBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ClassBinder.prototype */
	{
		init: function()
		{
			this.className = this.params[0] || null;
			this.equalsTo = this.params[1] || null;
			kff.ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className) this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
		},

		matchValue: function()
		{
			if(this.equalsTo) return this.values[this.valueIndex] === this.parse(this.equalsTo);
			else return this.values[this.valueIndex];
		}
	});


	kff.BindingView.registerBinder('class', kff.ClassBinder);


})(this);