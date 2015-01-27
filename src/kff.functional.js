

kff.curry = function(fn, arity)
{
	var __slice = Array.prototype.slice;
	arity = arity || fn.length;

	return given([]);

	function given(argsSoFar)
	{
		return function helper()
		{
			var updatedArgsSoFar = argsSoFar.concat(__slice.call(arguments, 0));

			if (updatedArgsSoFar.length >= arity) {
				return fn.apply(this, updatedArgsSoFar)
			}
			else return given(updatedArgsSoFar)
		}
	}
};

kff.compose = function()
{
	var fns = arguments;
	return function(result)
	{
		for(var i = fns.length - 1; i > -1; i--)
		{
			result = fns[i].call(this, result);
		}
		return result;
	};
};

kff.map = kff.curry(function(fn, obj)
{
	return obj.map(fn);
});


kff.imclone = function(obj)
{
	if(obj instanceof Array) return obj.slice();
	if(typeof obj === 'object')
	{
		var ret = {};
		for(var key in obj)
		{
			ret[key] = obj[key];
		}
		return ret;
	}
	return obj;
};

kff.imset = function(keypath, value, obj)
{
	var fn = value;
	var root;
	if(typeof fn !== 'function') fn = function(){ return value; };

	if(keypath)
	{
		if(typeof keypath === 'string') keypath = keypath.split('.');

		root = kff.imclone(obj);
		var prev = root;

		if(keypath.length === 0) return fn(root);

		for(var i = 0, l = keypath.length; i < l - 1; i++)
		{
			prev = prev[keypath[i]] = kff.imclone(prev[keypath[i]]);
		}

		prev[keypath[i]] = fn(prev[keypath[i]]);
	}
	else
	{
		root = fn(obj);
	}

	return root;
};

kff.imremove = function(keypath, obj)
{
	if(typeof keypath === 'string') keypath = keypath.split('.');

	if(keypath)
	{
		var root = kff.imclone(obj);
		var prev = root;

		for(var i = 0, l = keypath.length; i < l - 1; i++)
		{
			prev = prev[keypath[i]] = kff.imclone(prev[keypath[i]]);
		}
		if(prev instanceof Array)
		{
			prev = prev.splice(keypath[i], 1);
		}
		else if(typeof prev === 'object' && prev !== null)
		{
			delete prev[keypath[i]];
		}
	}

	return root;
};


kff.functionService = function(fn)
{
	var fn2 = function()
	{
		return fn.apply(this, arguments);
	};
	fn2.service = { type: 'function'};
	return fn2;
};

kff.factoryService = function(fn)
{
	var fn2 = function()
	{
		return fn.apply(this, arguments);
	};
	fn2.service = { type: 'factory'};
	if(arguments.length > 1) fn2.service.args = Array.prototype.slice.call(arguments, 1);
	return fn2;
};

