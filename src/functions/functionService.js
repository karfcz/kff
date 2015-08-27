
function functionService(fn)
{
	var fn2 = function()
	{
		return fn.apply(this, arguments);
	};
	fn2.service = { type: 'function'};
	return fn2;
}

export default functionService;
