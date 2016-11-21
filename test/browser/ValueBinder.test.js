if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.BindingView', function()
{
	it('should bind input binder', function(done)
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

		var $input = $('<input data-kff-bind="myModel.name:val"/>');
		var view = new kff.View(
		{
			element: $input[0],
			scope: {
				myModel: myModel
			},
			dispatcher: dispatcher
		});
		view.renderAll();
		view.runAll();

		setTimeout(function()
		{
			expect($input.val()).to.equal('Karel');

			myModel.setIn('name', 'Petr');

			view.refreshAll();

			expect($input.val()).to.equal('Petr');

			$input.val('Honza');

			$input[0].dispatchEvent(new Event('change'));

			setTimeout(function()
			{
				expect(myModel.getIn('name')).to.equal('Honza');
				done();
			}, 0);
		}, 0);
	});


});
