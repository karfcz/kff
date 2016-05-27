if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.DoubleClickBinder', function()
{
	it('should bind double click binder', function()
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

		var $div = $('<div data-kff-bind="myModel.name:dblclick(Petr)"/>');
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
		// $div.trigger('dblclick');
		$div[0].dispatchEvent(new MouseEvent('dblclick'));

		expect(myModel.getIn('name')).to.equal('Petr');
	});

});
