
kff.BindingView.registerHelper('index', function(v, modelName)
{
	if(this.getBindingIndex(modelName) !== null) return this.getBindingIndex(modelName);
	return v;
});

kff.BindingView.registerHelper('indexFromOne', function(v, modelName)
{
	if(this.getBindingIndex(modelName) !== null) return this.getBindingIndex(modelName) + 1;
	return v;
});


kff.BindingView.registerHelper('boolean', function(v)
{
	var parsed = parseInt(v, 10);
	if(!isNaN(parsed)) return !!parsed;
	return v === 'true';
});

kff.BindingView.registerHelper('not', function(v)
{
	return !v;
});

kff.BindingView.registerHelper('null', function(v)
{
	return v === null || v === 'null' ? null : v;
});

kff.BindingView.registerHelper('int', function(v)
{
	v = parseInt(v, 10);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('float', function(v)
{
	v = parseFloat(v);
	if(isNaN(v)) v = 0;
	return v;
});

kff.BindingView.registerHelper('string', function(v)
{
	return v.toString();
});
