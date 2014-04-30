if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.DoubleClickBinder', function()
{
	it('should bind double click binder', function(done)
	{
		var $div = $('<div data-kff-bind="myModel.name:dblclick(Petr)"/>');
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
		expect(view.getModel('myModel').get('name')).to.equal('Karel');
		$div.trigger('dblclick');
		setTimeout(function()
		{
			expect(view.getModel('myModel').get('name')).to.equal('Petr');
			done();
		}, 0);
	});


});
