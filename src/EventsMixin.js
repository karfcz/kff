
var Events = require('./Events');

var EventsMixin =
{
	initEvents: function()
	{
		this.events = null;
	},
	createEvents: function()
	{
		this.events = new Events();
	},
	on: function(eventType, fn)
	{
		if(this.events == null) this.createEvents();
		return this.events.on(eventType, fn);
	},
	one: function(eventType, fn)
	{
		if(this.events == null) this.createEvents();
		return this.events.one(eventType, fn);
	},
	off: function(eventType, fn)
	{
		if(this.events == null) this.createEvents();
		return this.events.off(eventType, fn);
	},
	trigger: function(eventType, eventData)
	{
		if(this.events == null) this.createEvents();
		return this.events.trigger(eventType, eventData);
	}
};

module.exports = EventsMixin;
