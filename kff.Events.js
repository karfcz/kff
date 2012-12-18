/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	
	kff.Events = kff.createClass(
	{
		constructor: function()
		{
			this.subscribers = {};
			this.oneSubscribers = {};
		},

		on: function(eventType, fn)
		{
			this.off(eventType, fn);
			if(eventType instanceof Array)
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
			else
			{
				if(!this.subscribers[eventType]) this.subscribers[eventType] = new kff.LinkedList();
				this.subscribers[eventType].append(fn);
			}
		},

		one: function(eventType, fn)
		{
			if(!(eventType in this.oneSubscribers)) this.oneSubscribers[eventType] = [];
			this.oneSubscribers[eventType].push(fn);
			this.on(eventType, fn);
		},

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
				if(this.subscribers[eventType] instanceof kff.LinkedList) this.subscribers[eventType].removeVal(fn);
			}
		},

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
				if(this.subscribers[eventType] instanceof kff.LinkedList)
				{
					this.subscribers[eventType].each(function(val)
					{
						val.call(null, eventData);
					});
					
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
	
	kff.EventsMixin = {
		on: function(eventType, fn){ return this.events.on(eventType, fn); },
		one: function(eventType, fn){ return this.events.one(eventType, fn); },
		off: function(eventType, fn){ return this.events.off(eventType, fn); },
		trigger: function(eventType, eventData){ return this.events.trigger(eventType, eventData); }
	};
	
})(this);
