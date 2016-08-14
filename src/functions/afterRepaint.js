
var requestAnimationFrame = (typeof window === 'object' ? window.requestAnimationFrame : false) || function(fn){ setTimeout(fn, 1000/60); };

function afterRepaint(fn)
{
	requestAnimationFrame(function()
	{
		setTimeout(fn, 0);
	});
}

module.exports = afterRepaint;
