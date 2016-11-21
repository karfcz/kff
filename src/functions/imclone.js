
export default function imclone(obj)
{
	if(obj instanceof Array) return obj.slice();
	if(typeof obj === 'object' && obj !== null)
	{
		var keys = Object.keys(obj);
		var key;
		var ret = {};
		for(var j = 0, k = keys.length; j < k; j++)
		{
			key = keys[j];
			ret[key] = obj[key];
		}
		return ret;
	}
	return obj;
}
