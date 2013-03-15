if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.BindingView', function()
{
	it('should bind input binder', function(done)
	{
		var $input = $('<input data-kff-bind="myModel.name:val"/>');
		var view = new kff.BindingView(
		{
			element: $input,
			models: {
				myModel: new kff.Model({
					name: 'Karel'
				})
			}
		});
		view.init();
		setTimeout(function()
		{
			$input.val().should.equal('Karel');
			view.getModel('myModel').set('name', 'Petr');
			$input.val().should.equal('Petr');
			$input.val('Honza').trigger('change');
			setTimeout(function()
			{
				view.getModel('myModel').get('name').should.equal('Honza');
				done();
			}, 0);
		}, 0);
	});


});
