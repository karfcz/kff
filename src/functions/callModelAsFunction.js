
var convertValueType = require('./convertValueType');

function callModelAsFunction(view, model, modelArgs)
{
	var args = [];
	if(Array.isArray(modelArgs))
	{
		for(var i = 0, l = modelArgs.length; i < l; i++)
		{
			if(Array.isArray(modelArgs[i])) args[i] = view.getCursor(modelArgs[i]);
			else args[i] = convertValueType(modelArgs[i]);
		}
	}
	return model.apply(null, args);
}

module.exports = callModelAsFunction;
