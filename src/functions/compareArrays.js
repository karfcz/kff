
/**
 * Compare if two arrays are of the same length and contain the same values compared by the strict equal operator
 *
 * @param  {Array} value1 Array 1
 * @param  {Array} value2 Array 2
 * @return {boolean}      Result of comparsion
 */
export default function compareArrays(value1, value2)
{
	if(Array.isArray(value1) && Array.isArray(value2))
	{
		var l = value1.length;
		if(l !== value2.length) return false;
		for(var i = 0; i < l; i++)
		{
			if(value1[i] !== value2[i]) return false;
		}
		return true;
	}
	else return false;
}
