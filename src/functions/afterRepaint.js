
var requestAnimationFrame = (typeof window === 'object' ? window.requestAnimationFrame : false) || function(fn){ setTimeout(fn, 1000/60); };

export default function afterRepaint(fn)
{
	requestAnimationFrame(function()
	{
		setTimeout(fn, 0);
	});
}
