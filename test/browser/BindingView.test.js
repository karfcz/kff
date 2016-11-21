if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.View', function()
{
	var env = {
		window: window,
		document: document
	};

	it('should bind a simple collection', function(done)
	{
		var collection = [];
		collection.push({});
		collection.push({});
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each"/>');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1[0],
			scope: {
				collection: collection
			}
		});
		view.renderAll();
		view.runAll();

		setTimeout(function(){

			expect($div1.find('div').length).to.equal(2);
			done();

		}, 0);

	});

	it('should bind a collection with text binder on the same element', function(done)
	{
		var collection = [];
		var model1 = { name: 'foo' };
		var model2 = { name: 'bar' };
		collection.push(model1);
		collection.push(model2);
		var collectionCursor = new kff.Cursor(collection);
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each .name:text"/>');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1[0],
			scope: {
				collection: collectionCursor
			}
		});
		view.initAll();

		setTimeout(function(){

			expect($div1.find('div').length).to.equal(2);
			expect($div1.find('div').eq(0).text()).to.equal('foo');
			expect($div1.find('div').eq(1).text()).to.equal('bar');

			collectionCursor.set(v => v.slice(1));

			view.refreshAll();

			expect($div1.find('div').length).to.equal(1);
			expect($div1.find('div').eq(0).text()).to.equal('bar');

			done();
		}, 0);

	});

	it('should remove element from collection binding', function()
	{
		var collection = [{}, {}, {}];
		var collectionCursor = new kff.Cursor(collection);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each"/>');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1[0],
			scope: {
				collection: collectionCursor
			}
		});
		view.initAll();

		expect($div1.find('div').length).to.equal(3);
		var newCollection = collection.slice();

		collectionCursor.set(function(v)
		{
			var newCollection = v.slice();
			newCollection.splice(1, 1);
			return newCollection;
		});

		view.refreshAll();
		expect($div1.find('div').length).to.equal(2);
	});

	it('should bind a collection length property', function()
	{
		var collection = [];
		var model1 = { name: 'foo' };
		var model2 = { name: 'bar' };
		collection.push(model1);
		collection.push(model2);
		var collectionCursor =  new kff.Cursor(collection);
		var $div = $('<div data-kff-bind="collection.length:text"/>');
		var view = new kff.View(
		{
			env: env,
			element: $div[0],
			scope: {
				collection: collectionCursor
			}
		});
		view.renderAll();
		view.runAll();

		setTimeout(function(){
			expect($div.text()).to.equal('2');
			collectionCursor.set(v => v.concat().splice(0, 1));
			view.refreshAll();
			expect($div.text()).to.equal('1');
		}, 0);

	});

	it('should render collection with default item alias', function()
	{
		var collection = [
			{ a: 1 },
			{ a: 2 }
		];

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each"/>');
		var $div3 = $('<div data-kff-bind="_item.a:text"/>');
		$div1.append($div2);
		$div2.append($div3);
		var view = new kff.View(
		{
			env: env,
			element: $div1[0],
			scope: {
				collection: new kff.Cursor(collection),
			}
		});
		view.renderAll();
		view.runAll();

		expect($div1.text()).to.equal('12');
	});

	it('should render collection with custom item alias', function()
	{
		var collection = [
			{ a: 1 },
			{ a: 2 }
		];

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each:as(it)"/>');
		var $div3 = $('<div data-kff-bind="it.a:text"/>');
		$div1.append($div2);
		$div2.append($div3);
		var view = new kff.View(
		{
			env: env,
			element: $div1[0],
			scope: {
				collection: new kff.Cursor(collection),
			}
		});
		view.renderAll();
		view.runAll();

		expect($div1.text()).to.equal('12');
	});

});
