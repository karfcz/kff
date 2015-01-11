kff.Dispatcher = kff.createClass({
	mixins: kff.EventsMixin
},
{
	constructor: function(actions)
	{
		this.actions = {};
		this.registerActions(actions);
	},

	createCallback: function(fn)
	{
		var dispatcher = this;
		if(typeof fn !== 'function') {
			throw new Error('Dispatcher action is not a function');
		}
		if(fn.length <= 1)
		{
			return function(event)
			{
				var nextEvent = fn.call(null, event);
				if(nextEvent) dispatcher.trigger(nextEvent.action, nextEvent);
			};
		}
		else
		{
			return function(event)
			{
				var done = function(err, nextEvent)
				{
					if(err) return;
					if(nextEvent) dispatcher.trigger(nextEvent.action, nextEvent);
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
				if(!(actions[action] instanceof Array)) callbacks = [actions[action]];
				else callbacks = actions[action];

				if(!(action in this.actions)) this.actions[action] = [];

				this.actions[action] = this.actions[action].concat(callbacks);

				for(var i = 0; i < callbacks.length; i++)
				{
					this.on(action, this.createCallback(callbacks[i]));
				}
			}
		}
	},

	hasAction: function(action)
	{
		return action in this.actions;
	}
});