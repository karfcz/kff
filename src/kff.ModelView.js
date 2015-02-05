
kff.ModelView = kff.createClass({
	extend: kff.View
},
{
	constructor: function(options)
	{
		kff.View.call(this, options);
		this.models['*'] = new kff.Cursor({});
	}
});
