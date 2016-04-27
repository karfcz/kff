var createClass = require('./functions/createClass');
var log = require('./functions/log');
var EventStream = require('./EventStream');

function filterByEventType(type)
{
	return function(o){ return o.type === type; };
}

var Dispatcher = createClass(
{
	constructor: function(actions, processors)
	{
		this.eventStream = new EventStream();
		this.actionStreams = {};
		this.processors = [processsArrayEvent, processsEventStreamEvent, processsPromiseEvent, processsActionEvent];
		if(processors && Array.isArray(processors))
		{
			if(process.env.NODE_ENV !== 'production')
			{
				if(!Array.isArray(processors))
				{
					log('Second argument of Dispatcher must be an Array', processors);
				}
			}
			this.processors = this.processors.concat(processors);
		}
		this.registerActions(actions);
		this.callbacks = [];
	},

	createCallback: function(fn)
	{
		var dispatcher = this;
		if(typeof fn !== 'function') {
			throw new Error('Dispatcher action "' + fn + '" is not a function');
		}
		if(fn.length <= 1)
		{
			return function(event)
			{
				var nextEvent = fn.call(null, event);
				dispatcher.trigger(nextEvent);
			};
		}
		else
		{
			return function(event)
			{
				var done = function(err, nextEvent)
				{
					if(err) return;
					if(nextEvent) dispatcher.trigger(nextEvent);
				};
				fn.call(null, event, done);
			};
		}
	},

	registerActions: function(actions)
	{
		if(typeof actions === 'object')
		{
			for(var action in actions)
			{
				if(typeof actions[action] === 'function') {
					this.actionStreams[action] = this.eventStream.filter(filterByEventType(action)).on(this.createCallback(actions[action]));
				}
				else if(process.env.NODE_ENV !== 'production')
				{
					if(action !== '__esModule')
					{
						log('Dispatcher action "' + action + '" is not a function (registerActions)');
						log('Actions object:');
						log(actions);
					}
				}
			}
		}
	},

	trigger: function(event)
	{
		for(var j = 0; j < this.processors.length; j++)
		{
			if(typeof this.processors[j] === 'function') this.processors[j](this, event);
		}
	},

	on: function(type, fn)
	{
		if(!(type in this.actionStreams)) this.actionStreams[type] = this.eventStream.filter(filterByEventType(type));

		var callback = this.createCallback(fn);
		this.callbacks.push({
			type: type,
			fn: fn,
			callback: callback
		});

		this.actionStreams[type].on(callback);
	},

	off: function(type, fn)
	{
		for(var i = this.callbacks.length - 1; i >= 0; i--)
		{
			if(this.callbacks[i].type === type && this.callbacks[i].fn === fn)
			{
				if(type in this.actionStreams) this.actionStreams[type].off(this.callbacks[i].callback);
				this.callbacks.splice(i, 1);
			}
		}
	},

	hasAction: function(action)
	{
		return action in this.actionStreams;
	}
});

module.exports = Dispatcher;


function processsArrayEvent(dispatcher, event)
{
	if(event instanceof Array)
	{
		for(var j = 0; j < event.length; j++)
		{
			dispatcher.trigger(event[j]);
		}
	}
}

function processsEventStreamEvent(dispatcher, event)
{
	if(event instanceof EventStream)
	{
		event.on(dispatcher.f('trigger'));
	}
}

function processsActionEvent(dispatcher, event)
{
	if(event != null && typeof event === 'object' && 'type' in event)
	{
		if(dispatcher.hasAction(event.type)) dispatcher.eventStream.trigger(event);
		else dispatcher.eventStream.trigger({ type: 'dispatcher:noaction', value: event });
	}
}

function processsPromiseEvent(dispatcher, event)
{
	if(event != null && typeof event === 'object' && typeof event.then === 'function')
	{
		event.then(dispatcher.f('trigger'));
	}
}
