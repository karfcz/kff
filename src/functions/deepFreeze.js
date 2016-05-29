
function deepFreeze(o)
{
	try {
	if(!Object.isFrozen(o)) Object.freeze(o);

	} catch(e) {
		console.log(o);
		throw(e);
	}

	Object.getOwnPropertyNames(o).forEach(function (prop)
	{
		if(o.hasOwnProperty(prop) && o[prop] !== null && typeof o[prop] === "object" && !Object.isFrozen(o[prop]))
		{
			deepFreeze(o[prop]);
		}
	});

	return o;
};

module.exports = deepFreeze;

