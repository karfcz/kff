
kff.Events = kff.createClass(
/** @lends kff.Events.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function()
	{
		this.subscribers = {};
		this.oneSubscribers = {};
	},

	/**
	 * Binds event handler.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	on: function(eventType, fn)
	{
		if(typeof eventType === 'string')
		{
			if(!this.subscribers[eventType]) this.subscribers[eventType] = [];
			if(kff.arrayIndexOf(this.subscribers[eventType], fn) === -1)	this.subscribers[eventType].push(fn);
		}
		else if(eventType instanceof Array)
		{
			for(var i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i])
				{
					if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = [];
					if(kff.arrayIndexOf(this.subscribers[eventType[i]], fn) === -1) this.subscribers[eventType[i]].push(fn);
				}
			}
		}
	},

	/**
	 * Binds event handler that will be executed only once.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	one: function(eventType, fn)
	{
		if(!(eventType in this.oneSubscribers)) this.oneSubscribers[eventType] = [];
		this.oneSubscribers[eventType].push(fn);
		this.on(eventType, fn);
	},

	/**
	 * Unbinds event handler.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	off: function(eventType, fn)
	{
		var i, l;
		if(typeof eventType === 'string')
		{
			if(this.subscribers[eventType] instanceof Array)
			{
				i = kff.arrayIndexOf(this.subscribers[eventType], fn);
				if(i !== -1) this.subscribers[eventType].splice(i, 1);
			}
		}
		else if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.off(eventType[i], fn);
			}
		}
	},

	/**
	 * Triggers an event.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {mixed} eventData Arbitrary data that will be passed to the event handlers as an argument
	 */
	trigger: function(eventType, eventData)
	{
		var i, l;
		if(typeof eventType === 'string')
		{
			if(this.subscribers[eventType] instanceof Array)
			{
				for(i = 0, l = this.subscribers[eventType].length; i < l; i++)
				{
					if(typeof this.subscribers[eventType][i] === 'function') this.subscribers[eventType][i].call(null, eventData);
				}

				// Remove "one" subscribers:
				if(eventType in this.oneSubscribers)
				{
					for(i = 0, l = this.oneSubscribers[eventType].length; i < l; i++)
					{
						this.off(eventType, this.oneSubscribers[eventType][i]);
					}
					this.oneSubscribers[eventType] = [];
				}
			}
		}
		else if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.trigger(eventType[i], eventData);
			}
		}
	}
});

kff.EventsMixin =
{
	initEvents: function()
	{
		this.events = null;
	},
	createEvents: function()
	{
		this.events = new kff.Events();
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
