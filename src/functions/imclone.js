
function imclone(obj)
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
}

export default imclone;
