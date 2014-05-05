
kff.ModelView = kff.createClass({
	extend: kff.BindingView
},
{
	constructor: function(options)
	{
		kff.BindingView.call(this, options);
		this.models['*'] = new kff.Model();
	}
});
