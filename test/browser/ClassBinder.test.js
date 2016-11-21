if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.ClassBinder', function()
{
	it('should set a class through class binder', function()
	{
		var myModel = new kff.Cursor({
			name: 'foo'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:class(myClass, bar)');
		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.initAll();
		expect(div.classList.contains('myClass')).to.equal(false);
		myModel.setIn('name', 'bar');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(true);
	});

	it('should set a class through class binder using truthy value', function()
	{
		var myModel = new kff.Cursor({
			name: 0
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:class(myClass)');
		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.initAll();
		expect(div.classList.contains('myClass')).to.equal(false);
		myModel.setIn('name', 1);
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(true);
	});

	it('should set a class through class binder using dynamic scope value lookup', function()
	{
		var myModel = new kff.Cursor({
			name: 'foo',
			value: 'bar'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:class(myClass, @myModel.value)');

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.initAll();
		expect(div.classList.contains('myClass')).to.equal(false);
		myModel.setIn('name', 'bar');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(true);
	});

	it('should set a class through classnot binder', function()
	{
		var myModel = new kff.Cursor({
			name: 'foo'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:classnot(myClass, bar)');

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.initAll();
		expect(div.classList.contains('myClass')).to.equal(true);
		myModel.setIn('name', 'bar');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(false);
	});

});