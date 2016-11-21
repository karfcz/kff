
import deepFreeze from './deepFreeze.js';
import imclone from './imclone.js';

export default function immerge(source, target)
{
	var clone;
	if(typeof target === 'object' && target !== null && typeof source === 'object' && source !== null)
	{
		clone = imclone(source);
		var keys = Object.keys(target);
		var key;
		for(var j = 0, k = keys.length; j < k; j++)
		{
			key = keys[j];
			if(source.hasOwnProperty(key))
			{
				clone[key] = immerge(source[key], target[key]);
				// if(process.env.NODE_ENV !== 'production')
				// {
				// 	deepFreeze(clone[key]);
				// }
			}
			else
			{
				clone[key] = target[key];
			}
		}
		// if(process.env.NODE_ENV !== 'production')
		// {
		// 	Object.freeze(clone);
		// }
		return clone;
	}
	else if(Array.isArray(source) && Array.isArray(target))
	{
		clone = source.slice();
		for(var i = 0, l = Math.max(source.length, target.length); i < l; i++)
		{
			if(i in target) clone[i] = immerge(clone[i], target[i]);
		}
		// if(process.env.NODE_ENV !== 'production')
		// {
		// 	deepFreeze(clone);
		// }
		return clone;
	}
	else
	{
		return target;
	}
}
