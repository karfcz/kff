if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.BindingView', function()
{

	it('should bind a simple collection', function()
	{
		var collection = new kff.Collection();
		collection.append(new kff.Model());
		collection.append(new kff.Model());
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection"/>');
		$div1.append($div2);
		var view = new kff.BindingView(
		{
			element: $div1,
			models: {
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
		var collection = new kff.Collection();
		var model1 = new kff.Model({ name: 'foo' });
		var model2 = new kff.Model({ name: 'bar' });
		collection.append(model1);
		collection.append(model2);
		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection .name:text"/>');
		$div1.append($div2);
		var view = new kff.BindingView(
		{
			element: $div1,
			models: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){

			expect($div1.find('div').length).to.equal(2);
			expect($div1.find('div').eq(0).text()).to.equal('foo');
			expect($div1.find('div').eq(1).text()).to.equal('bar');

			collection.remove(model1);

			expect($div1.find('div').length).to.equal(1);
			expect($div1.find('div').eq(0).text()).to.equal('bar');
		}, 0);

	});

	it('should remove element from collection binding', function()
	{
		var collection = new kff.Collection();
		var model1 = new kff.Model();
		var model2 = new kff.Model();
		var model3 = new kff.Model();
		collection.append(model1);
		collection.append(model2);
		collection.append(model3);

		var $div1 = $('<div/>');
		var $div2 = $('<div data-kff-bind="collection"/>');
		$div1.append($div2);
		var view = new kff.BindingView(
		{
			element: $div1,
			models: {
				collection: collection
			}
		});
		view.init();

		expect($div1.find('div').length).to.equal(3);
		collection.remove(model2);
		expect($div1.find('div').length).to.equal(2);
	});

	it('should bind a collection count pseudoattribute', function()
	{
		var collection = new kff.Collection();
		var model1 = new kff.Model({ name: 'foo' });
		var model2 = new kff.Model({ name: 'bar' });
		collection.append(model1);
		collection.append(model2);
		var $div = $('<div data-kff-bind="collection.count:text"/>');
		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				collection: collection
			}
		});
		view.init();

		setTimeout(function(){
			expect($div.text()).to.equal('2');
			collection.remove(model1);
			expect($div.text()).to.equal('1');
		}, 0);

	});


	it('should rebind a :watch binding when model path change', function()
	{
		var intel = new kff.Model({
			name: 'intel'
		});
		var amd = new kff.Model({
			name: 'amd'
		});
		var motherboard = new kff.Model({
			processor: intel
		});
		var computer = new kff.Model({
			motherboard: motherboard
		});

		var $div = $('<div data-kff-bind="computer.motherboard.processor.name:text:watch"/>');
		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				computer: computer
			}
		});
		view.init();

		setTimeout(function()
		{
			expect($div.text()).to.equal('intel');

			motherboard.set({ processor: amd });
			setTimeout(function()
			{
				expect($div.text()).to.equal('amd');
			}, 0);

		}, 0);

	});

});
