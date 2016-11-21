// if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

// describe('kff.EventBinder', function()
// {
// 	this.timeout(500);
// 	it('should bind event binder', function(done)
// 	{

// 		var myModel = new kff.Cursor({
// 			name: 'Karel'
// 		});

// 		var dispatcher = new kff.Dispatcher({
// 			set: function(event)
// 			{
// 				event.cursor.set(event.value);
// 				return {
// 					type: 'refresh'
// 				};
// 			}
// 		});

// 		var $div = $('<div data-kff-bind="myModel.name:event(Petr):on(click, mouseenter)"/>');

// 		var view = new kff.View(
// 		{
// 			element: $div[0],
// 			scope: {
// 				myModel: myModel
// 			},
// 			dispatcher: dispatcher
// 		});
// 		view.renderAll();
// 		view.runAll();

// 		expect(myModel.getIn('name')).to.equal('Karel');

// 		// $div.trigger('mouseenter');
// 		$div[0].dispatchEvent(new MouseEvent('mouseenter'));

// 		setTimeout(function()
// 		{
// 			expect(myModel.getIn('name')).to.equal('Petr');

// 			myModel.setIn('name', 'Honza');

// 			view.refreshAll();

// 			expect(myModel.getIn('name')).to.equal('Honza');
// 			// $div.trigger('click');

// 			$div[0].dispatchEvent(new MouseEvent('click'));

// 			setTimeout(function(){
// 				expect(myModel.getIn('name')).to.equal('Petr');
// 				done();
// 			}, 0);
// 		}, 0);
// 	});


// });


