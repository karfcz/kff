if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.TextBinder', function()
{

	it('should bind text binder', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var myModel = {
			name: 'Karel'
		};
		var view = new kff.View(
		{
			element: $div,
			scope: {
				myModel: new kff.Cursor(myModel)
			}
		});
		view.init();
		expect($div.text()).to.equal('Karel');
		myModel.name = 'Petr';
		view.refreshAll();
		expect($div.text()).to.equal('Petr');
	});

	it('should bind text binder with a function instead of model', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var myModel = {
			name: function(){ return 'foo' }
		};

		var view = new kff.View(
		{
			element: $div,
			scope: {
				myModel: new kff.Cursor(myModel)
			}
		});
		view.init();
		expect($div.text()).to.equal('foo');
	});

});
