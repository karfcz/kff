
var createClass = require('./functions/createClass');
var arrayIndexOf = require('./functions/arrayIndexOf');

var EventStream = createClass({
	statics: {
		END: {}
	}
},
/** @lends EventStream.prototype */
{
	/**
	 * @constructs
	 */
	constructor: function()
	{
		this.subscribers = [];
		this.oneSubscribers = [];
		this.endSubscribers = [];
	},

	/**
	 * Binds event handler.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	on: function(fn)
	{
		if(arrayIndexOf(this.subscribers, fn) === -1) this.subscribers.push(fn);
		return this;
	},

	onEnd: function(fn)
	{
		if(arrayIndexOf(this.endSubscribers, fn) === -1) this.endSubscribers.push(fn);
		return this;
	},

	/**
	 * Binds event handler that will be executed only once.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	one: function(eventType, fn)
	{
		this.oneSubscribers.push(fn);
		return this.on(fn);
	},

	/**
	 * Unbinds event handler.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {function} fn Event handler
	 */
	off: function(fn)
	{
		var i = arrayIndexOf(this.subscribers, fn);
		if(i !== -1) this.subscribers.splice(i, 1);

		i = arrayIndexOf(this.oneSubscribers, fn);
		if(i !== -1) this.oneSubscribers.splice(i, 1);

		i = arrayIndexOf(this.endSubscribers, fn);
		if(i !== -1) this.endSubscribers.splice(i, 1);

		return this;
	},

	offAll: function()
	{
		this.subscribers = [];
		this.oneSubscribers = [];
		this.endSubscribers = [];
		return this;
	},

	/**
	 * Triggers an event.
	 *
	 * @param {string|Array} eventType Event name(s)
	 * @param {mixed} eventData Arbitrary data that will be passed to the event handlers as an argument
	 */
	trigger: function(eventData)
	{
		var i, l;

		if(eventData === EventStream.END)
		{
			for(i = 0, l = this.endSubscribers.length; i < l; i++)
			{
				if(typeof this.endSubscribers[i] === 'function') this.endSubscribers[i].call(null);
			}
			return this.offAll();
		}

		for(i = 0, l = this.subscribers.length; i < l; i++)
		{
			if(typeof this.subscribers[i] === 'function') this.subscribers[i].call(null, eventData);
		}

		// Remove "one" subscribers:
		for(i = 0, l = this.oneSubscribers.length; i < l; i++)
		{
			this.off(this.oneSubscribers[i]);
		}


		return this;
	},

	triggerLater: function(eventData, delay)
	{
		var that = this;
		if(delay === undefined) delay = 0;
		setTimeout(function()
		{
			that.trigger(eventData);
		}, delay);
		return this;
	},


	map: function(fn)
	{
		var mes = new EventStream();

		this.on(function(event){
			mes.trigger(fn.call(null, event));
		});

		return mes;
	},

	reduce: function(fn, initialValue)
	{
		var es = new EventStream();
		var value;

		if(typeof fn !== 'function')
		{
			throw new TypeError( fn + ' is not a function' );
		}

		if(arguments.length >= 2)
		{
			value = arguments[1];
		}

		this.on(function(event){
			value = fn.call(null, value, event);
		});

		this.onEnd(function(){
			es.trigger(value).end();
		});

		return es;
	},

	flatMap: function(fn)
	{
		var mes = new EventStream();

		var observe = function(event)
		{
			var res = fn.call(null, event);

			if(res instanceof EventStream)
			{
				res.on(function(event2)
				{
					mes.trigger(event2);
				});
			}
			else
			{
				mes.trigger(res);
			}
		};

		this.on(observe);

		return mes;
	},

	filter: function(fn)
	{
		var fes = new EventStream();

		this.on(function(event){
			if(fn.call(null, event)) fes.trigger(event);
		});

		return fes;
	},

	merge: function(es)
	{
		var mes = new EventStream();

		this.on(mes.f('trigger'));
		es.on(mes.f('trigger'));

		return mes;
	},

	end: function()
	{
		this.trigger(EventStream.END);
	},

	endLater: function(delay)
	{
		var that = this;
		if(delay === undefined) delay = 0;
		setTimeout(function()
		{
			that.trigger(EventStream.END);
		}, delay);
		return this;
	}
});

module.exports = EventStream;

