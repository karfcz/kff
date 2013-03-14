if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.TextBinder', function()
{

	it('should bind text binder', function()
	{
		var $div = $('<div data-kff-bind="myModel.name:text"></div>');
		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				myModel: new kff.Model({
					name: 'Karel'
				})
			}
		});
		view.init();
		$div.text().should.equal('Karel');
		view.getModel('myModel').set('name', 'Petr');
		$div.text().should.equal('Petr');
	});

});
