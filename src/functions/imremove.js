
import imclone from './imclone';

function imremove(keypath, obj)
{
	var root;
	if(typeof keypath === 'string') keypath = keypath.split('.');

	if(keypath)
	{
		root = imclone(obj);
		var prev = root;

		for(var i = 0, l = keypath.length; i < l - 1; i++)
		{
			prev = prev[keypath[i]] = imclone(prev[keypath[i]]);
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
}

export default imremove;
