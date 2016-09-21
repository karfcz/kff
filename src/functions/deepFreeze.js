
function deepFreeze(o)
{
		try {
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
		}
		catch(e) {
			console.log('fr', o);
		}

	return o;
};

module.exports = deepFreeze;

