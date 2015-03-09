
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var TextBinder = createClass(
{
	extend: Binder
},
/** @lends TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text content of the element.
	 * Renders text content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
	},

	refresh: function(value)
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		this.$element[0].textContent = val;
	}
});

if(typeof document === 'object' && document !== null)
{
	if(!('textContent' in document.documentElement))
	{
		TextBinder.prototype.refresh = function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			this.$element[0].innerText = val;
		};
	}
}

View.registerBinder('text', TextBinder);

module.exports = TextBinder;
