
var createClass = require('../functions/createClass');
var EventBinder = require('./EventBinder');
var View = require('../View');

var FocusBinder = createClass(
{
	extend: EventBinder
},
/** @lends FocusBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for focus event.
	 * Sets model atrribute to defined value when element gets focus.
	 *
	 * @constructs
	 * @augments EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus'];
		EventBinder.call(this, options);
	}

});

View.registerBinder('focus', FocusBinder);

module.exports = FocusBinder;
