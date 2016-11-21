
export default function curry(fn, arity)
{
	var __slice = Array.prototype.slice;
	arity = arity || fn.length;

	return given([]);

	function given(argsSoFar)
	{
		return function helper()
		{
			var updatedArgsSoFar = argsSoFar.concat(__slice.call(arguments, 0));

			if (updatedArgsSoFar.length >= arity) {
				return fn.apply(this, updatedArgsSoFar);
			}
			else return given(updatedArgsSoFar);
		};
	}
}
