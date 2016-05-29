if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.TextBinder', function()
{

	it('should bind text binder', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var myModel = {
			name: 'Karel'
		};
		var myModelCursor = new kff.Cursor(myModel);
		var view = new kff.View(
		{
			element: $div[0],
			scope: {
				myModel: myModelCursor
			}
		});
		view.renderAll();
		view.runAll();
		expect($div.text()).to.equal('Karel');
		myModelCursor.setIn('name', 'Petr');
		view.refreshAll();
		expect($div.text()).to.equal('Petr');
	});

	it('should bind text binder with a function instead of model', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var myModel = {
			name: function(){ return 'foo' }
		};
		var myModelCursor = new kff.Cursor(myModel);
		var view = new kff.View(
		{
			element: $div[0],
			scope: {
				myModel: myModelCursor
			}
		});
		view.renderAll();
		view.runAll();
		expect($div.text()).to.equal('foo');
	});

});
