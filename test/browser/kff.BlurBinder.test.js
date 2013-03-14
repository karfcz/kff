if(typeof require === 'function') var kff = require('../build/kff-all.js');

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
		view.getModel('myModel').get('name').should.equal('Karel');
		$div.trigger('blur');
		setTimeout(function()
		{
			view.getModel('myModel').get('name').should.equal('Petr');
			done();
		}, 0);
	});


});
