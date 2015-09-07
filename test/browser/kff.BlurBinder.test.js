if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.BlurBinder', function()
{
	it('should bind blur binder', function()
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

		var $div = $('<div data-kff-bind="myModel.name:blur(Petr)"/>');
		var view = new kff.View(
		{
			element: $div,
			scope: {
				myModel: myModel
			},
			dispatcher: dispatcher
		});
		view.renderAll();
		view.runAll();

		expect(myModel.getIn('name')).to.equal('Karel');

		$div.trigger('blur');

		expect(myModel.getIn('name')).to.equal('Petr');
	});
});
