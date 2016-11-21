
if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.EventStream', function()
{

	it('should bind event handler that catches triggered event', function(done)
	{
		var events = new kff.EventStream;
		events.on(function(){ done(); }).trigger('testEvent');
	});

	it('should bind event handler that catches triggered event only once', function()
	{
		var events = new kff.EventStream, count = 0;
		events.one('testEvent', function(){
			count++;
		});
		events.trigger('testEvent');
		events.trigger('testEvent');
		expect(count).to.equal(1);
	});

	it('should bind two event handlers that both catch triggered event', function(done)
	{
		var events = new kff.EventStream;
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
		events.on(callback1);
		events.on(callback2);
		events.trigger('testEvent');
	});

	it('should unbind previously bound event handler', function(done)
	{
		var events = new kff.EventStream;
		var callback = function(){ done(new Error('Event should not trigger')); };
		events.on(callback);
		events.off(callback);
		events.trigger('testEvent');
		done();
	});

	it('should filter events', function(done)
	{
		var events = new kff.EventStream;

		var filtered = events.filter(function(event){
			return event === 'a';
		});

		var x = 'a';

		var callback1 = function(event)
		{
			expect(event).to.equal(x);
			x = 'b';
		};

		var callback2 = function(event)
		{
			if(event !== 'a') throw new Error('Event should not trigger');
			expect(event).to.equal('a');
		};
		events.on(callback1);
		filtered.on(callback2);
		events.trigger('a');
		events.trigger('b');
		done();
	});

	it('should map events', function(done)
	{
		var events = new kff.EventStream;

		var filtered = events.map(function(event){
			return event.toUpperCase();
		});

		var callback = function(event)
		{
			expect(event).to.equal('A');
		};
		filtered.on(callback);
		events.trigger('a');
		done();
	});

	it('should merge two event streams', function(done)
	{
		var es1 = new kff.EventStream;
		var es2 = new kff.EventStream;

		var es3 = es1.merge(es2);

		var x = 'a';

		var callback = function(event)
		{
			expect(event).to.equal(x);
			x = 'b';
		};
		es3.on(callback);
		es1.trigger('a');
		es2.trigger('b');
		done();
	});


});
