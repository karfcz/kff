/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(scope)
{
	var kff;

	if(exports !== undefined) kff = exports;
	else kff = (scope.kff = scope.kff || {});
	
	kff.LinkedList = kff.createClass(
	{
		constructor: function()	
		{
			this.tail = this.head = { next: null };
			this.count = 0;
		},
		
		each: function(fn)
		{
			var node = this.head.next;
			while(node)
			{
				fn.call(null, node.val);
				node = node.next;
			}
		},
		
		append: function(val)
		{
			var node = { val: val, next: null };
			this.tail.next = node;
			this.tail = node;
			this.count++;
		},
		
		removeVal: function(val)
		{
			var node = this.head.next, prev = this.head, ret = false;
			while(node)
			{
				if(node.val === val)
				{
					if(node.next) prev.next = node.next;
					else
					{
						prev.next = null;
						this.tail = prev;
					}
					this.count--;
					ret = true;
				}
				else prev = node;
				node = node.next;
			}
			return ret;
		}
	});

})(this);
