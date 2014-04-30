if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.BlurBinder', function()
{
	it('should bind blur binder', function(done)
	{
		var $div = $('<div data-kff-bind="myModel.name:blur(Petr)"/>');
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

		$div.trigger('blur');
		setTimeout(function()
		{
			expect(view.getModel('myModel').get('name')).to.equal('Petr');
			done();
		}, 0);
	});


});
