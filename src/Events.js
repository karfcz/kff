
import createClass from './functions/createClass';
import arrayIndexOf from './functions/arrayIndexOf';

var Events = createClass(
/** @lends Events.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function()
	{
		this.subscribers = {};
		this.oneSubscribers = {};
		this.allSubscribers = [];
		this.oneAllSubscribers = [];
	},

	/**
	 * Binds event handler.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	on: function(eventType, fn)
	{
		if(arguments.length === 1)
		{
			return this.onAll(eventType);
		}
		else if(typeof eventType === 'string')
		{
			if(!this.subscribers[eventType]) this.subscribers[eventType] = [];
			if(arrayIndexOf(this.subscribers[eventType], fn) === -1)	this.subscribers[eventType].push(fn);
		}
		else if(eventType instanceof Array)
		{
			for(var i = 0, l = eventType.length; i < l; i++)
			{
				if(eventType[i])
				{
					if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = [];
					if(arrayIndexOf(this.subscribers[eventType[i]], fn) === -1) this.subscribers[eventType[i]].push(fn);
				}
			}
		}
	},

	/**
	 * Binds event handler.
	 *
	 * @param {function} fn Event handler
	 */
	onAll: function(fn)
	{
		if(arrayIndexOf(this.allSubscribers, fn) === -1) this.allSubscribers.push(fn);
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
		if(arguments.length === 1)
		{
			return this.offAll(eventType);
		}
		if(typeof eventType === 'string')
		{
			if(this.subscribers[eventType] instanceof Array)
			{
				i = arrayIndexOf(this.subscribers[eventType], fn);
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
	 * Unbinds event handler.
	 *
	 * @param {function} fn Event handler
	 */
	offAll: function(fn)
	{
		var i = arrayIndexOf(this.allSubscribers, fn);
		if(i !== -1) this.allSubscribers.splice(i, 1);
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

export default Events;
