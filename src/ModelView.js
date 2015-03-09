
var createClass = require('./functions/createClass');

var View = require('./View');
var Cursor = require('./Cursor');

var ModelView = createClass({
	extend: View
},
{
	constructor: function(options)
	{
		View.call(this, options);
		this.scope['*'] = new Cursor({});
	}
});

module.exports = ModelView;
