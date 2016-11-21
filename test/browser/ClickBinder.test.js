if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.ClickBinder', function()
{
	it('should bind click binder', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel'
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

		var $div = $('<div data-kff-bind="myModel.name:click(Petr)"/>');
		var view = new kff.View(
		{
			element: $div[0],
			scope: {
				myModel: myModel
			},
			dispatcher: dispatcher
		});
		view.renderAll();
		view.runAll();

		expect(myModel.getIn('name')).to.equal('Karel');

		emitEvent($div[0], 'click');

		expect(myModel.getIn('name')).to.equal('Petr');
	});

	it('should bind click binder using dynamic scope value lookup', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel',
			value: null
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

		var $div = $('<div data-kff-bind="myModel.name:click(@myModel.value)"/>');
		var view = new kff.View(
		{
			element: $div[0],
			scope: {
				myModel: myModel
			},
			dispatcher: dispatcher
		});
		view.renderAll();
		view.runAll();

		expect(myModel.getIn('name')).to.equal('Karel');

		myModel.setIn('value', 'Petr');

		emitEvent($div[0], 'click');

		expect(myModel.getIn('name')).to.equal('Petr');
	});
});