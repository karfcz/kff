if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.CheckBinder', function()
{
	it('should bind check binder', function()
	{
		var state = new kff.Cursor(true);

		var dispatcher = new kff.Dispatcher({
			set: function(event)
			{
				event.cursor.set(event.value);
				return {
					type: 'refresh'
				};
			}
		});

		var input = document.createElement('input');
		input.setAttribute('type', 'checkbox');
		input.setAttribute('data-kff-bind', 'state:check');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			},
			dispatcher: dispatcher
		});
		view.initAll();

		expect(input.checked).to.equal(true);
		state.set(false);
		view.refreshAll();

		expect(input.checked).to.equal(false);

		input.dispatchEvent(new MouseEvent('click'));
		// emitEvent(input, 'click');

		expect(state.get()).to.equal(true);
	});


	it('should bind check binder to non-boolean state', function()
	{
		var checkedValue = 'checkedValue';
		var state = new kff.Cursor(checkedValue);

		var dispatcher = new kff.Dispatcher({
			set: function(event)
			{
				event.cursor.set(event.value);
				return {
					type: 'refresh'
				};
			}
		});

		var input = document.createElement('input');
		input.setAttribute('type', 'checkbox');
		input.setAttribute('data-kff-bind', 'state:check(checkedValue)');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			},
			dispatcher: dispatcher
		});
		view.initAll();

		expect(input.checked).to.equal(true);
		state.set('uncheckedValue');
		view.refreshAll();

		expect(input.checked).to.equal(false);

		input.dispatchEvent(new MouseEvent('click'));
		// emitEvent(input, 'click');

		expect(state.get()).to.equal(checkedValue);
	});

});
