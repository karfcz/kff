
kff.ModelView = kff.createClass({
	extend: kff.View
},
{
	constructor: function(options)
	{
		kff.View.call(this, options);
		this.scope['*'] = new kff.Cursor({});
	}
});
