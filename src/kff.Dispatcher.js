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
		return function(event)
		{
			fn.call(null, event, dispatcher);
		};
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