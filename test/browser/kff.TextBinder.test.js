if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.TextBinder', function()
{

	it('should bind text binder', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var view = new kff.View(
		{
			element: $div,
			models: {
				myModel: {
					name: 'Karel'
				}
			}
		});
		view.init();
		expect($div.text()).to.equal('Karel');
		view.getModel('myModel').name = 'Petr';
		view.refreshAll();
		expect($div.text()).to.equal('Petr');
	});

	it('should bind text binder without specified attribute', function()
	{
		var $div = $('<div data-kff-bind="myModel:text:get(getName)"></div>');
		var myModel = {
			name: 'Karel'
		};
		myModel.getName = function()
		{
			return this.name;
		};

		var view = new kff.View(
		{
			element: $div,
			models: {
				myModel: myModel
			}
		});
		view.init();
		expect($div.text()).to.equal('Karel');
		view.getModel('myModel').name = 'Petr';
		view.refreshAll();
		expect($div.text()).to.equal('Petr');
	});

});
