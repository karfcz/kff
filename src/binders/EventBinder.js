
var createClass = require('../functions/createClass');
var convertValueType = require('../functions/convertValueType');
var Binder = require('../Binder');
var View = require('../View');

var EventBinder = createClass(
{
	extend: Binder
},
/** @lends EventBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for generic DOM event.
	 * Sets model atrribute to defined value when event occurs.
	 * Event defaults to click.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
		options.events = [
			[eventNames, 'triggerEvent']
		];

		Binder.call(this, options);
	},

	init: function()
	{
		this.userValue = null;

		if(this.options.params[0])
		{
			if(this.options.parsers.length === 0) this.userValue = convertValueType(this.options.params[0]);
			else this.userValue = this.parse(this.options.params[0]);
		}

		if(this.options.eventFilters && this.options.eventFilters[0])
		{
			this.triggerEvent = this.createFilterTriggerEvent(this.triggerEvent, this.options.eventFilters[0]);
		}
		EventBinder._super.init.call(this);
	},

	triggerEvent: function(event)
	{
		if(!this.options.nopreventdef) event.preventDefault();
		this.updateModel(this.userValue, event);
	},

	compareValues: function(value1, value2)
	{
		return false;
	}

});

View.registerBinder('event', EventBinder);

module.exports = EventBinder;

