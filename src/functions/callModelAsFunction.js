
var convertValueType = require('./convertValueType');

function callModelAsFunction(view, model, modelArgs)
{
	var args = [];
	if(modelArgs instanceof Array)
	{
		for(i = 0, l = modelArgs.length; i < l; i++)
		{
			if(modelArgs[i] instanceof Array) args[i] = view.getCursor(modelArgs[i]);
			else args[i] = convertValueType(modelArgs[i]);
		}
	}
	return model.apply(null, args);
}

module.exports = callModelAsFunction;
