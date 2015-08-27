
function arrayConcat(a1, a2)
{
	var l1 = a1.length, l2 = a2.length, l3 = l1 + l2, i = 0;
	var a3 = new Array(l3);
	while(i < l1)
	{
		a3[i] = a1[i];
		i++;
	}
	while(i < l3)
	{
		a3[i] = a2[i - l1];
		i++;
	}
	return a3;
}

export default arrayConcat;
