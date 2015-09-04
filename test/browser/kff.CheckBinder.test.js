if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.CheckBinder', function()
{
	it('should bind check binder', function()
	{
		var myModel = new kff.Cursor({
			checked: true
		});

		var dispatcher = new kff.Dispatcher({
			set: function(event)
			{
				event.cursor.set(event.value);
				return {
					type: 'refresh'
				};
			}
		});

		var $input = $('<input type="checkbox" data-kff-bind="myModel.checked:check"/>');
		var view = new kff.View(
		{
			element: $input,
			scope: {
				myModel: myModel
			},
			dispatcher: dispatcher
		});
		view.renderAll();
		view.runAll();

		expect($input.is(':checked')).to.equal(true);
		myModel.setIn('checked', false);
		view.refreshAll();

		expect($input.is(':checked')).to.equal(false);
		$input.prop('checked', true).triggerHandler('click');

		expect(myModel.getIn('checked')).to.equal(true);
	});

});
