
function factoryService(fn)
{
	var fn2 = function()
	{
		return fn.apply(this, arguments);
	};
	fn2.service = { type: 'factory' };
	if(arguments.length > 1) fn2.service.args = Array.prototype.slice.call(arguments, 1);
	return fn2;
}

export default factoryService;
