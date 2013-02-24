
if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.Events', function()
{

	it('should bind event handler that catches triggered event', function(done)
	{
		var events = new kff.Events;
		events.on('testEvent', done);
		events.trigger('testEvent');
	});

	it('should bind event handler that catches triggered event only once', function()
	{
		var events = new kff.Events, count = 0;
		events.one('testEvent', function(){
			count++;
		});
		events.trigger('testEvent');
		events.trigger('testEvent');
		count.should.equal(1);
	});

	it('should bind two event handlers that both catch triggered event', function(done)
	{
		var events = new kff.Events;
		var i = 0;
		var callback1 = function()
		{
			i++;
		};
		var callback2 = function()
		{
			i++;
			if(i == 2) done();
		};
		events.on('testEvent', callback1);
		events.on('testEvent', callback2);
		events.trigger('testEvent');
	});

	it('should unbind previously bound event handler', function(done)
	{
		var events = new kff.Events;
		var callback = function(){ throw "error"; };
		events.on('testEvent', callback);
		events.off('testEvent', callback);
		events.trigger('testEvent');
		done();
	});


});
