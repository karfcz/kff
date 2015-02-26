if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.View', function()
{
	var env = {
		window: window,
		document: document
	};

	it('should bind a simple collection', function()
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
			element: $div1,
			scope: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){

			expect($div1.find('div').length).to.equal(2);

		}, 0);

	});

	it('should bind a collection with text binder on the same element', function()
	{
		var collection = [];
		var model1 = { name: 'foo' };
		var model2 = { name: 'bar' };
		collection.push(model1);
		collection.push(model2);
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each .name:text"/>');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1,
			scope: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){

			expect($div1.find('div').length).to.equal(2);
			expect($div1.find('div').eq(0).text()).to.equal('foo');
			expect($div1.find('div').eq(1).text()).to.equal('bar');

			collection.splice(0, 1);

			expect($div1.find('div').length).to.equal(1);
			expect($div1.find('div').eq(0).text()).to.equal('bar');
		}, 0);

	});

	it('should remove element from collection binding', function()
	{
		var collection = [];
		var model1 = {};
		var model2 = {};
		var model3 = {};
		collection.push(model1);
		collection.push(model2);
		collection.push(model3);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each"/>');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1,
			scope: {
				collection: collection
			}
		});
		view.init();

		expect($div1.find('div').length).to.equal(3);
		collection.splice(1, 1);
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
		var $div = $('<div data-kff-bind="collection.length:text"/>');
		var view = new kff.View(
		{
			env: env,
			element: $div,
			scope: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){
			expect($div.text()).to.equal('2');
			collection.splice(0, 1);
			view.refreshAll();
			expect($div.text()).to.equal('1');
		}, 0);

	});


	// it('should rebind a :watch binding when model path change', function(done)
	// {
	// 	var intel = new kff.Model({
	// 		name: 'intel'
	// 	});
	// 	var amd = new kff.Model({
	// 		name: 'amd'
	// 	});
	// 	var motherboard = new kff.Model({
	// 		processor: intel
	// 	});
	// 	var computer = new kff.Model({
	// 		motherboard: motherboard
	// 	});

	// 	var $div = $('<div data-kff-bind="computer.motherboard.processor.name:text:watch"/>');
	// 	var view = new kff.View(
	// 	{
	// 		env: env,
	// 		element: $div,
	// 		scope: {
	// 			computer: computer
	// 		}
	// 	});
	// 	view.init();

	// 	setTimeout(function()
	// 	{
	// 		expect($div.text()).to.equal('intel');

	// 		motherboard.set({ processor: amd });
	// 		setTimeout(function()
	// 		{
	// 			expect($div.text()).to.equal('amd');
	// 			done();
	// 		}, 0);

	// 	}, 0);

	// });

	it('should render filtered collection', function()
	{
		var collection = [];
		var model1 = {};
		var model2 = {};
		var model3 = {};
		var filterModel = {};
		filterModel.filter = function(item)
		{
			return item === model1;
		};
		collection.push(model1);
		collection.push(model2);
		collection.push(model3);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each:filter(filterModel.filter)" />');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1,
			scope: {
				collection: new kff.Cursor(collection),
				filterModel: new kff.Cursor(filterModel)
			}
		});
		view.init();

		expect($div1.find('div').length).to.equal(1);
	});

	it('should render sorted collection', function()
	{
		var collection = [];
		var model1 = { a: 2 };
		var model2 = { a: 1 };
		var model3 = { a: 3 };
		var sortModel = {};
		sortModel.sort = function(a, b)
		{
			return a.a - b.a;
		};
		collection.push(model1);
		collection.push(model2);
		collection.push(model3);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each:sort(sortModel.sort) .a:text" />');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1,
			scope: {
				collection: new kff.Cursor(collection),
				sortModel: new kff.Cursor(sortModel)
			}
		});
		view.init();

		expect($div1.find('div').length).to.equal(3);
		expect($div1.text()).to.equal('123');
	});

	it('should render sorted and filtered collection', function()
	{
		var collection = [];
		var model1 = { a: 2 };
		var model2 = { a: 1 };
		var model3 = { a: 3 };
		var sortModel = {};
		sortModel.sort = function(a, b)
		{
			return a.a - b.a;
		};
		sortModel.filter = function(a)
		{
			return a.a < 3;
		};

		collection.push(model1);
		collection.push(model2);
		collection.push(model3);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection:each:filter(sortModel.filter):sort(sortModel.sort) .a:text" />');
		$div1.append($div2);
		var view = new kff.View(
		{
			env: env,
			element: $div1,
			scope: {
				collection: new kff.Cursor(collection),
				sortModel: new kff.Cursor(sortModel)
			}
		});
		view.init();

		expect($div1.find('div').length).to.equal(2);
		expect($div1.text()).to.equal('12');
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
			element: $div1,
			scope: {
				collection: new kff.Cursor(collection),
			}
		});
		view.init();

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
			element: $div1,
			scope: {
				collection: new kff.Cursor(collection),
			}
		});
		view.init();

		expect($div1.text()).to.equal('12');
	});

});
