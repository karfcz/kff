
import imclone from './imclone.js';
import deepFreeze from './deepFreeze.js';

export default function imset(keypath, value, obj)
{
	var fn = value;
	var root;
	if(typeof fn !== 'function') fn = function(){ return value; };

	if(keypath)
	{
		if(typeof keypath === 'string') keypath = keypath.split('.');

		root = imclone(obj);
		var prev = root;

		if(keypath.length === 0) return fn(root);

		for(var i = 0, l = keypath.length; i < l - 1; i++)
		{
			prev = prev[keypath[i]] = imclone(prev[keypath[i]]);
		}

		prev[keypath[i]] = fn(prev[keypath[i]]);
	}
	else
	{
		root = fn(obj);
	}

	// if(process.env.NODE_ENV !== 'production')
	// {
	// 	deepFreeze(root);
	// }

	return root;
}
