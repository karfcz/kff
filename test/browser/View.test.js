if(typeof require === 'function') var kff = require('../build/kff.js');

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
			this.element.innerHTML = testString;
		},

		destroy: function()
		{
			this.element.innerHTML = '';
		},

		click: function()
		{
			if(this.options.done) this.options.done();
		},

		modelChange: function()
		{
			if(this.options.modelChangeDone) this.options.modelChangeDone();
		}
	});

	beforeEach(function()
	{
		$div = $('<div/>');
		view = new TestView({
			element: $div[0]
		});
	});

	describe('#getCursor', function()
	{
		it('should return cursor for model associated with the view', function()
		{
			var myModel = { prop: 42 };
			view = new TestView({element: $div[0], scope: { myModel: new kff.Cursor(myModel) } });
			expect(view.getCursor(['myModel', 'prop']).get()).to.equal(42);
		});

	});

	describe('#render', function()
	{
		it('should render the view', function()
		{
			view = new TestView({element: $div[0]});
			view.renderAll();
			view.runAll();
			expect($div.html()).to.equal(testString);
			expect($div.attr(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');
		});

	});

	describe('#destroy', function()
	{
		it('should destroy the view', function()
		{
			view = new TestView({element: $div[0]});
			view.renderAll();
			view.runAll();
			expect($div.html()).to.equal(testString);
			expect($div.attr(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');
			view.destroyAll();
			expect($div.html()).to.equal('');
			expect($div.attr(kff.settings.DATA_RENDERED_ATTR)).to.be.undefined;
		});
	});

	describe('#delegateEvents', function()
	{
		it('should delegate a click event to a method', function(done)
		{
			view = new TestView({element: $div[0], done: done});
			view.renderAll();
			view.runAll();
			emitEvent($div[0], 'click');
		});

		it('should delegate an added event to a method', function(done)
		{
			view = new TestView({element: $div[0], done: done});
			view.addEvents([['mouseover', 'click']]);
			view.renderAll();
			view.runAll();
			emitEvent($div[0], 'click');
			emitEvent($div[0], 'mouseover');
		});

		it('should trigger both delegated events', function(done)
		{
			var i = 0;
			view = new TestView({element: $div[0], done: function(){
				i++;
				if(i === 2) done();
			}});
			view.addEvents([['mouseover', 'click']]);
			view.renderAll();
			view.runAll();
			emitEvent($div[0], 'mouseover');
			emitEvent($div[0], 'click');
		});
	});

	describe('#undelegateEvents', function()
	{
		it('should undelegate a click event from a method', function()
		{
			view = new TestView({element: $div[0], done: function(){
				throw 'Error';
			}});
			view.renderAll();
			view.runAll();
			view.destroyAll();
			emitEvent($div[0], 'click');
		});

		it('should undelegate an added event to a method', function()
		{
			view = new TestView({element: $div[0], done: function(){
				throw 'Error';
			}});
			view.addEvents([['mouseover', 'click']]);
			view.renderAll();
			view.runAll();
			view.destroyAll();
			emitEvent($div[0], 'mouseover');
		});

		it('should not trigger both undelegated events', function()
		{
			var i = 0;
			view = new TestView({element: $div[0], done: function(){
				throw 'Error';
			}});
			view.addEvents([['mouseover', 'click']]);
			view.renderAll();
			view.runAll();
			view.destroyAll();
			emitEvent($div[0], 'click');
			emitEvent($div[0], 'mouseover');
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
			var mainDiv = document.createElement('div');
			var intermediateDiv = document.createElement('div');
			var innerDiv = document.createElement('div');
			innerDiv.setAttribute('data-kff-view', 'TestViewB');

			intermediateDiv.appendChild(innerDiv);
			mainDiv.appendChild(intermediateDiv);

			var view1 = new TestView2({
				element: mainDiv,
				scope: {
					TestViewB: TestView2
				}
			});

			view1.initAll();

			expect(mainDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');
			expect(innerDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');

			view1.destroyAll();

			expect(mainDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.be.null;
			expect(innerDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.be.null;
		});


		it('should render subView and trigger an event on it', function(done)
		{
			var mainDiv = document.createElement('div');
			var intermediateDiv = document.createElement('div');
			var innerDiv = document.createElement('div');
			innerDiv.setAttribute('data-kff-view', 'TestViewB');

			intermediateDiv.appendChild(innerDiv);
			mainDiv.appendChild(intermediateDiv);

			var TestViewB = kff.viewClassFactory(TestView2, { done: done });

			var view1 = new TestView2({
				element: mainDiv,
				scope: {
					TestViewB: TestViewB
				}
			});

			view1.initAll();

			expect(mainDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');
			expect(innerDiv.getAttribute(kff.settings.DATA_RENDERED_ATTR)).to.equal('true');

			emitEvent(innerDiv, 'click');
		});
	});

});
