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
	
	kff.ArrayList = kff.createClass(
	{
		constructor: function()	
		{
			this.array = [];
			this.count = this.array.length;
		},
		
		each: function(fn)
		{
			var a = this.array, l = a.length, i;
			for(i = 0; i < l; i++)
			{
				fn.call(null, a[i]);
			}
		},
		
		append: function(val)
		{
			this.array.push(val);
			this.count++;
		},
		
		removeVal: function(val)
		{
			var a = this.array, l = a.length, i, p = null, ret = false;
			for(i = 0; i < l; i++)
			{
				if(a[i] === val)
				{
					p = i;
					break;
				}
			}
			
			if(p !== null)
			{
				this.array = a.slice(0, p -1 ).concat(a.slice(p + 1));
				ret = true;
				this.count--;
			}
		}
	});

})(this);
