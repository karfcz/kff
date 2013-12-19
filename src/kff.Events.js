
kff.Events = kff.createClass(
/** @lends kff.Events.prototype */
{
	/**
		@constructs
	*/
	constructor: function()
	{
		this.subscribers = {};
		this.oneSubscribers = {};
	},

	/**
		Binds event handler.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	on: function(eventType, fn)
	{
		this.off(eventType, fn);
		if(typeof eventType === 'string')
		{
			if(!this.subscribers[eventType]) this.subscribers[eventType] = [];
			this.subscribers[eventType].push(fn);
		}
		else if(eventType instanceof Array)
		{
			for(var i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i])
				{
					if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = [];
					this.subscribers[eventType[i]].push(fn);
				}
			}
		}
	},

	/**
		Binds event handler that will be executed only once.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	one: function(eventType, fn)
	{
		if(!(eventType in this.oneSubscribers)) this.oneSubscribers[eventType] = [];
		this.oneSubscribers[eventType].push(fn);
		this.on(eventType, fn);
	},

	/**
		Unbinds event handler.

		@param {string|Array} eventType Event name(s)
		@param {function} fn Event handler
	*/
	off: function(eventType, fn)
	{
		var i, l;
		if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.off(eventType[i], fn);
			}
		}
		else
		{
			if(this.subscribers[eventType] instanceof Array)
			{
				if('indexOf' in Array.prototype)
				{
					i = this.subscribers[eventType].indexOf(fn);
					if(i !== -1) this.subscribers[eventType].splice(i, 1);
				}
				else
				{
					for(i = 0, l = this.subscribers[eventType].length; i < l; i++)
					{
						if(this.subscribers[eventType][i] === fn)
						{
							this.subscribers[eventType].splice(i, 1);
							break;
						}
					}
				}
			}
		}
	},

	/**
		Triggers an event.

		@param {string|Array} eventType Event name(s)
		@param {mixed} eventData Arbitrary data that will be passed to the event handlers as an argument
	*/
	trigger: function(eventType, eventData)
	{
		var i, l;
		if(eventType instanceof Array)
		{
			for(i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i]) this.trigger(eventType[i], eventData);
			}
		}
		else
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
	}
});

kff.EventsMixin =
{
	initEvents: function()
	{
		this.events = new kff.Events();
	},
	on: function(eventType, fn){ return this.events.on(eventType, fn); },
	one: function(eventType, fn){ return this.events.one(eventType, fn); },
	off: function(eventType, fn){ return this.events.off(eventType, fn); },
	trigger: function(eventType, eventData){ return this.events.trigger(eventType, eventData); }
};
