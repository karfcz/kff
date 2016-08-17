
function callModelAsFunction(view, model, modelArgs)
{
	return model.apply(null, modelArgs || []);
}

module.exports = callModelAsFunction;
