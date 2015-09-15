
var createClass = require('../functions/createClass');
var convertValueType = require('../functions/convertValueType');
var Binder = require('../Binder');
var View = require('../View');
var Cursor = require('../Cursor');

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

		this.userValue = undefined;
		this.valueCursor = undefined;
	},

	init: function()
	{
		this.userValue = null;
		this.valueCursor = undefined;

		if(this.options.params[0])
		{
			this.userValue = this.convertBindingValue(this.options.params[0]);
			if(this.userValue instanceof Cursor)
			{
				this.valueCursor = this.userValue;
				this.userValue = this.valueCursor.get();
			}
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
		if(this.valueCursor) this.userValue = this.valueCursor.get();
		this.updateModel(this.userValue, event);
	},

	compareValues: function(value1, value2)
	{
		return false;
	}

});

View.registerBinder('event', EventBinder);

module.exports = EventBinder;

