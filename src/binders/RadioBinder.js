var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var RadioBinder = createClass(
{
	extend: Binder
},
/** @lends RadioBinder.prototype */
{
	/**
	 * Two-way data binder for radio button.
	 * Checks radio when model atrribute evaluates to true, unchecks otherwise.
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
		if(this.options.fill) this.fillVal = this.element.checked;
	},

	inputChange: function(event)
	{
		if(this.element.checked)
		{
			this.updateModel(this.element.value, event);
		}
	},

	refresh: function()
	{
		this.element.checked = this.parse(this.element.value) === this.currentValue;
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.element.checked;
		if(this.fillVal)
		{
			this.updateModel(this.element.value);
		}
	}

});

View.registerBinder('radio', RadioBinder);

module.exports = RadioBinder;

