function filterByEventName(name)
{
	return function(o){ return o.name === name; };
}

kff.Dispatcher = kff.createClass(
{
	constructor: function(actions)
	{
		this.eventStream = new kff.EventStream();
		this.actionStreams = {};
		// this.actions = {};
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
				if(nextEvent instanceof kff.EventStream)
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
				this.actionStreams[action] = this.eventStream.filter(filterByEventName(action)).on(this.createCallback(actions[action]));
			}
		}
	},

	trigger: function(event)
	{
		this.eventStream.trigger(event);
	},

	on: function(name, fn)
	{
		if(!(name in this.actionStreams)) this.actionStreams[name] = this.eventStream.filter(filterByEventName(name));
		this.actionStreams[name].on(this.createCallback(fn));
	},

	off: function(name, fn)
	{
		// if(name in this.actionStreams) this.actionStreams[action].on(this.createCallback(fn));
	},


	hasAction: function(action)
	{
		return action in this.actionStreams;
	}
});