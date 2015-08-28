
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var HtmlBinder = createClass(
{
	extend: Binder
},
/** @lends HtmlBinder.prototype */
{
	/**
	 * One-way data binder for html content of the element.
	 * Renders html content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
	},

	refresh: function()
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		this.$element[0].innerHTML = val;
	}
});

View.registerBinder('html', HtmlBinder);

module.exports = HtmlBinder;
