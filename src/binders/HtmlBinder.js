
import createClass from '../functions/createClass.js';
import Binder from '../Binder.js';
import View from '../View.js';

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
		this.element.innerHTML = val;
	}
});

View.registerBinder('html', HtmlBinder);

export default HtmlBinder;
