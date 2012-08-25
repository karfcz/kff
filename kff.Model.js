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
	else kff = (scope.kff = scope.kff || {});

	/**
	 *  kff.Model
	 *
	 */
	kff.Model = kff.createClass(
	{
		mixins: kff.EventsMixin
	},
	{
		constructor: function()
		{
			this.events = new kff.Events();
			this.attrs = {};
		},

		get: function(attr)
		{
			return this.attrs[attr];
		},

		set: function(attr, value, options)
		{
			var changed = {};

			if(typeof attr === 'string')
			{
				if(this.get(attr) === value) return;
				changed[attr] = value;
				if(typeof this.validate == 'function')
				{
					if(!this.validate(changed)) return;
				}
				this.attrs[attr] = value;
			} 
			else if(attr === Object(attr))
			{
				options = value;
				changed = attr;
				if(typeof this.validate == 'function')
				{
					if(!this.validate(changed)) return;
				}
				for(var key in changed) this.attrs[key] = changed[key];
			}
			this.trigger('change', { changedAttributes: changed });
		}

	});

})(this);
