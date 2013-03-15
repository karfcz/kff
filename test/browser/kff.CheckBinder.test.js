if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.CheckBinder', function()
{
	it('should bind check binder', function(done)
	{
		var $input = $('<input type="checkbox" data-kff-bind="myModel.checked:check"/>');
		var view = new kff.BindingView(
		{
			element: $input,
			models: {
				myModel: new kff.Model({
					checked: true
				})
			}
		});
		view.init();

		setTimeout(function()
		{
			$input.is(':checked').should.equal(true);
			view.getModel('myModel').set('checked', false);
			$input.is(':checked').should.equal(false);
			$input.prop('checked', true).trigger('change');
			setTimeout(function()
			{
				view.getModel('myModel').get('checked').should.equal(true);
				done();
			}, 0);
		}, 0);

	});

});
