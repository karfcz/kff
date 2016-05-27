
function imclone(obj)
{
	if(Array.isArray(obj)) return obj.slice();
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

module.exports = imclone;
