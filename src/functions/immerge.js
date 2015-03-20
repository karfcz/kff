
var imclone = require('./imclone');

function immerge(source, target)
{
	if(typeof target === 'object' && target !== null && typeof source === 'object' && source !== null)
	{
		var clone = imclone(source);
		for(var key in target)
		{
			if(key in clone) clone[key] = immerge(clone[key], target[key]);
			else clone[key] = target[key];
		}
		return clone;
	}
	else if(source instanceof Array && target instanceof Array)
	{
		var clone = source.slice();
		for(var i = 0, l = Math.max(source.length, target.length); i < l; i++)
		{
			clone[i] = immerge(clone[i], target[i]);
		}
		return clone;
	}
	else
	{
		return target;
	}
};

module.exports = immerge;
