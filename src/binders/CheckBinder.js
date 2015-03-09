
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var CheckBinder = createClass(
{
	extend: Binder
},
/** @lends CheckBinder.prototype */
{
	/**
	 * Two-way data binder for checkbox.
	 * Checks input when model atrribute evaluates to true, unchecks otherwise.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		Binder.call(this, options);
		if(this.options.fill) this.fillVal = this.$element[0].checked;
	},

	inputChange: function(event)
	{
		this.updateModel(this.$element[0].checked, event);
	},

	refresh: function()
	{
		this.$element[0].checked = !!this.value;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element[0].checked;
		this.updateModel(this.fillVal);
	}
});

View.registerBinder('check', CheckBinder);

module.exports = CheckBinder;
