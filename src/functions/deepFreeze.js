
function deepFreeze(o)
{
	if(typeof o === 'object' && o !== null)
	{
		if(!Object.isFrozen(o)) Object.freeze(o);

		Object.getOwnPropertyNames(o).forEach(function (prop)
		{
			if(o.hasOwnProperty(prop) && o[prop] !== null && typeof o[prop] === "object" && !Object.isFrozen(o[prop]))
			{
				deepFreeze(o[prop]);
			}
		});

	}

	return o;
};

module.exports = deepFreeze;

