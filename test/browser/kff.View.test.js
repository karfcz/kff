if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.View', function()
{
 	var view,
 		$div,
 		testString = 'test';

 	var TestView = kff.createClass({
 		extend: kff.View
 	},
 	{
 		constructor: function(options)
 		{
 			options = options || {};
 			options.events = [
 				['click', 'click']
 			];
 			kff.View.apply(this, arguments);
 		},

 		render: function()
 		{
 			this.$element.html(testString);
 			TestView._super.render.apply(this, arguments);
 		},

 		destroy: function()
 		{
 			this.$element.html('');
 			TestView._super.destroy.apply(this, arguments);
 		},

 		click: function()
 		{
 			this.options.done && this.options.done();
 		}
 	});

 	beforeEach(function()
	{
		$div = $('<div/>');
		view = new TestView({
			element: $div
		});
	});

	describe('#getModel', function()
	{
		it('should return model associated with the view', function()
		{
			view = new TestView({element: $div, models: { myModel: 42 } });
			view.getModel('myModel').should.equal(42);
		});

	});

	describe('#render', function()
	{
		it('should render the view', function()
		{
			view = new TestView({element: $div});
			view.init();
			$div.html().should.equal(testString);
			$div.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
		});

		it('should render the view async', function(done)
		{
			view = new TestView({element: $div});
			view.on('render',function(){
				$div.html().should.equal(testString);
				$div.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
				done();
			});
			view.init();
		});
	});

	describe('#destroy', function()
	{
		it('should destroy the view', function()
		{
			view = new TestView({element: $div});
			view.init();
			$div.html().should.equal(testString);
			$div.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
			view.startDestroy();
			$div.html().should.equal('');
			should.not.exist($div.attr(kff.View.DATA_RENDERED_ATTR));
		});

		it('should destroy the view async', function(done)
		{
			view = new TestView({element: $div});
			view.on('render', function()
			{
				$div.html().should.equal(testString);
				$div.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
				view.on('destroy', function()
				{
					$div.html().should.equal('');
					should.not.exist($div.attr(kff.View.DATA_RENDERED_ATTR));
					done();
				});
				view.startDestroy();
			});
			view.init();
		});
	});

	describe('#delegateEvents', function()
	{
		it('should delegate a click event to a method', function(done)
		{
			view = new TestView({element: $div, done: done});
			view.init();
			$div.triggerHandler('click');
		});

		it('should delegate an added event to a method', function(done)
		{
			view = new TestView({element: $div, done: done});
			view.addEvents([['mouseover', 'click']]);
			view.init();
			$div.triggerHandler('mouseover');
		});

		it('should trigger both delegated events', function(done)
		{
			var i = 0;
			view = new TestView({element: $div, done: function(){
				i++;
				if(i === 2) done();
			}});
			view.addEvents([['mouseover', 'click']]);
			view.init();
			$div.triggerHandler('mouseover');
			$div.triggerHandler('click');
		});
	});

	describe('#undelegateEvents', function()
	{
		it('should undelegate a click event from a method', function()
		{
			view = new TestView({element: $div, done: function(){
				throw 'Error';
			}});
			view.init();
			view.startDestroy();
			$div.triggerHandler('click');
		});

		it('should undelegate an added event to a method', function()
		{
			view = new TestView({element: $div, done: function(){
				throw 'Error';
			}});
			view.addEvents([['mouseover', 'click']]);
			view.init();
			view.startDestroy();
			$div.triggerHandler('mouseover');
		});

		it('should not trigger both undelegated events', function()
		{
			var i = 0;
			view = new TestView({element: $div, done: function(){
				throw 'Error';
			}});
			view.addEvents([['mouseover', 'click']]);
			view.init();
			view.startDestroy();
			$div.triggerHandler('mouseover');
			$div.triggerHandler('click');
		});

	});


	describe('#renderSubviews', function()
	{
	 	var TestView2 = kff.createClass({
	 		extend: kff.View
	 	},
	 	{
	 		constructor: function(options)
	 		{
	 			options = options || {};
	 			options.events = [
	 				['click', 'click']
	 			];
	 			kff.View.apply(this, arguments);
	 		},

	 		click: function()
	 		{
	 			this.options.done && this.options.done();
	 		}
	 	});


		it('should render subView', function()
		{
			var $mainDiv = $('<div/>');
			var $intermediateDiv = $('<div></div>');
			var $innerDiv = $('<div data-kff-view="testViewB"/>');

			$intermediateDiv.append($innerDiv);
			$mainDiv.append($intermediateDiv);

			var config = {
				services: {
					'viewFactory': {
						construct: kff.ViewFactory,
						args: [{
							serviceContainer: '@'
						}],
						shared: true
					},
					'testViewA': {
						construct: TestView2,
						args: [{
							element: $mainDiv,
					    	viewFactory: '@viewFactory'
					    }]
					},
					'testViewB': {
						construct: TestView2
					}
				}
			};

			var container = new kff.ServiceContainer(config);
			var view1 = container.getService('testViewA');
			view1.init();

			$mainDiv.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
			$innerDiv.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');

			view1.startDestroy();

			should.not.exist($mainDiv.attr(kff.View.DATA_RENDERED_ATTR));
			should.not.exist($innerDiv.attr(kff.View.DATA_RENDERED_ATTR));
		});


		it('should render subView and trigger an event on it', function(done)
		{
			var $mainDiv = $('<div/>');
			var $intermediateDiv = $('<div></div>');
			var $innerDiv = $('<div data-kff-view="testViewB"/>');

			$intermediateDiv.append($innerDiv);
			$mainDiv.append($intermediateDiv);

			var config = {
				services: {
					'viewFactory': {
						construct: kff.ViewFactory,
						args: [{
							serviceContainer: '@'
						}],
						shared: true
					},
					'testViewA': {
						construct: TestView2,
						args: [{
							element: $mainDiv,
					    	viewFactory: '@viewFactory'
					    }]
					},
					'testViewB': {
						construct: TestView2,
					    args: [{
					    	done: done
					    }]
					}
				}
			};

			var container = new kff.ServiceContainer(config);
			var view1 = container.getService('testViewA');
			view1.init();

			$mainDiv.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
			$innerDiv.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
			$innerDiv.triggerHandler('click');
		});
	});

});
