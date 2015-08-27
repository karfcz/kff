
import settings from './settings';

import createClass from './functions/createClass';
import log from './functions/log';

import EventStream from './EventStream';

function filterByEventType(type)
{
	return function(o){ return o.type === type; };
}

var Dispatcher = createClass(
{
	constructor: function(actions)
	{
		this.eventStream = new EventStream();
		this.actionStreams = {};
		this.registerActions(actions);
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
				if(nextEvent instanceof Array)
				{
					for(var j = 0; j < nextEvent.length; j++)
					{
						if(nextEvent[j] instanceof EventStream)
						{
							nextEvent[j].on(dispatcher.f('trigger'));
						}
						else if(nextEvent[j]) dispatcher.trigger(nextEvent[j]);
					}
				}
				else if(nextEvent instanceof EventStream)
				{
					nextEvent.on(dispatcher.f('trigger'));
				}
				else if(nextEvent) dispatcher.trigger(nextEvent);
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
		var callbacks;
		if(typeof actions === 'object')
		{
			for(var action in actions)
			{
				if(typeof actions[action] === 'function') {
					this.actionStreams[action] = this.eventStream.filter(filterByEventType(action)).on(this.createCallback(actions[action]));
				}
				else if(settings.debug) log('Dispatcher action "' + action + '" is not a function');
			}
		}
	},

	trigger: function(event)
	{
		this.eventStream.trigger(event);
	},

	on: function(type, fn)
	{
		if(!(type in this.actionStreams)) this.actionStreams[type] = this.eventStream.filter(filterByEventType(type));
		this.actionStreams[type].on(this.createCallback(fn));
	},

	off: function(type, fn)
	{
		// if(type in this.actionStreams) this.actionStreams[action].on(this.createCallback(fn));
	},


	hasAction: function(action)
	{
		return action in this.actionStreams;
	}
});

export default Dispatcher;
