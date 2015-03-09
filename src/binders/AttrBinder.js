
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var AttrBinder = createClass(
{
	extend: Binder
},
/** @lends AttrBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for an element attribute.
	 * Sets the attribute of the element to defined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
	},

	init: function()
	{
		this.attribute = this.options.params[0] || null;
		this.prefix = this.options.params[1] || '';
		this.suffix = this.options.params[2] || '';
		AttrBinder._super.init.call(this);
	},

	refresh: function()
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		if(this.attribute)
		{
			this.$element[0].setAttribute(this.attribute, this.prefix + val + this.suffix);
		}
	}
});

View.registerBinder('attr', AttrBinder);

module.exports = AttrBinder;
