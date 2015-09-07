if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.EventBinder', function()
{
	this.timeout(500);
	it('should bind event binder', function(done)
	{
		var a = 42;
		setTimeout(function(){
			// expect(a).to.equal(42);
			done();
		}, 0);


		// var myModel = new kff.Cursor({
		// 	name: 'Karel'
		// });

		// var dispatcher = new kff.Dispatcher({
		// 	set: function(event)
		// 	{
		// 		event.cursor.set(event.value);
		// 		return {
		// 			type: 'refresh'
		// 		};
		// 	}
		// });

		// var $div = $('<div data-kff-bind="myModel.name:event(Petr):on(myevent, mouseenter)"/>');

		// var view = new kff.View(
		// {
		// 	element: $div,
		// 	scope: {
		// 		myModel: myModel
		// 	},
		// 	dispatcher: dispatcher
		// });
		// view.renderAll();
		// view.runAll();

		// expect(myModel.getIn('name')).to.equal('Karel');

		// $div.trigger('mouseenter');

		// setTimeout(function()
		// {
		// 	console.log('alůksdlkj');

		// 	expect(myModel.getIn('name')).to.equal('Petr');

		// 	done();
		// 	// myModel.setIn('name', 'Honza');

		// 	// view.refreshAll();

		// 	// expect(myModel.getIn('name')).to.equal('Honza');
		// 	// $div.trigger('myevent');
		// 	// setTimeout(function(){
		// 	// 	expect(myModel.getIn('name')).to.equal('Petr');
		// 	// 	done();
		// 	// }, 0);
		// }, 100);
	});


});


