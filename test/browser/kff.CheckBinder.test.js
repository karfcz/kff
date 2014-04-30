if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.CheckBinder', function()
{
	it('should bind check binder', function()
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

		expect($input.is(':checked')).to.equal(true);
		view.getModel('myModel').set('checked', false);
		expect($input.is(':checked')).to.equal(false);
		$input.prop('checked', true).triggerHandler('click');
		expect(view.getModel('myModel').get('checked')).to.equal(true);
	});

});
