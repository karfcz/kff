if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.IfBinder', function()
{
	it('should insert a DOM element through if binder', function()
	{
		var cursor = new kff.Cursor({
			name: false
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'cursor.name:if(bar)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				cursor: cursor
			}
		});
		view.initAll();
		expect(innerDiv.parentNode).to.equal(null);
		cursor.setIn('name', 'bar');
		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(div);
	});

	it('should insert a DOM element using dynamic scope value lookup', function()
	{
		var cursor = new kff.Cursor({
			name: 'foo',
			value: 'bar'
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'cursor.name:if(@cursor.value)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				cursor: cursor
			}
		});
		view.initAll();
		expect(innerDiv.parentNode).to.equal(null);
		cursor.setIn('name', 'bar');
		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(div);
	});

	it('should insert a DOM element through ifnot binder', function()
	{
		var cursor = new kff.Cursor({
			name: false
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'cursor.name:ifnot(bar)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				cursor: cursor
			}
		});
		view.initAll();

		expect(innerDiv.parentNode).to.equal(div);
		cursor.setIn('name', 'bar');

		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(null);
	});

	it('should insert a DOM element through if binder using truthy value', function()
	{
		var cursor = new kff.Cursor({
			name: 1
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'cursor.name:if');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				cursor: cursor
			}
		});
		view.initAll();

		expect(div.children.length).to.equal(1);
		cursor.setIn('name', 0);
		view.refreshAll();

		expect(div.children.length).to.equal(0);
	});

});