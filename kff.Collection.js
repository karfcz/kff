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

	/**
	 *  kff.Collection
	 *
	 */
	kff.Collection = kff.createClass(
	{ 
		extend: kff.LinkedList,
		mixins: kff.EventsMixin
	},
	{ 
		constructor: function(options)
		{
			options = options || {};
			this.valFactory = options.valFactory || null;
			this.valType = options.valType || kff.Model;
			this.serializeAttrs = options.serializeAttrs || null;
			this.events = new kff.Events();
			kff.LinkedList.call(this);
			return this;
		},
		
		toJson: function()
		{
			var node = this.head, obj = [];
			while(node = node.next)
			{
				if(node.val && node.val.toJson) obj.push(node.val.toJson(this.serializeAttrs));
				else obj.push(node.val);
			}
			return obj;
		},
		
		fromJson: function(obj)
		{
			var val, valFactory = this.valFactory;
			for(var i = 0; i < obj.length; i++)
			{
				if(valFactory) val = valFactory(val);
				else val = new this.valType();
				val.fromJson(obj[i]);
				this.append(val);
			}
			this.trigger('change');
		},
		
		findByAttr: function(attr, value)
		{
			var ret;
			this.each(function(val)
			{
				if(val && val.get(attr) === value) ret = val;
			});
			return ret;
		},
		
		empty: function()
		{
			this.tail = this.head = { next: null };
			this.count = 0;
			this.trigger('change');
		},

		sort: function(compareFunction)
		{
			var arr = [], az, bz;
			this.each(function(item)
			{
				arr.push(item);
			});
			arr.sort(compareFunction);
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		},
		
		clone: function()
		{
			var clon = new kff.Collection(this.options);
			this.each(function(item){
				clon.append(item);
			});
			return clon;
		},
		
		shuffle: function()
		{
			var arr = [], az, bz, len, i, p, t;
			this.each(function(item)
			{
				arr.push(item);
			});

			len = arr.length, i = len;
			while(i--)
			{
				p = parseInt(Math.random()*len);
				t = arr[i];
				arr[i] = arr[p];
				arr[p] = t;
			}
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		}	
		
	});

})(this);
