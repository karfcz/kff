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
 		render: function()
 		{
 			this.$element.html(testString);
 			TestView._super.render.apply(this, arguments);
 		},

 		destroy: function()
 		{
 			this.$element.html('');
 			TestView._super.destroy.apply(this, arguments);
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
			view.on('init',function(){
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
			view.destroy();
			$div.html().should.equal('');
			should.not.exist($div.attr(kff.View.DATA_RENDERED_ATTR));
		});

		it('should destroy the view async', function(done)
		{
			view = new TestView({element: $div});
			view.on('init', function()
			{
				$div.html().should.equal(testString);
				$div.attr(kff.View.DATA_RENDERED_ATTR).should.equal('true');
				view.on('destroy', function()
				{
					$div.html().should.equal('');
					should.not.exist($div.attr(kff.View.DATA_RENDERED_ATTR));
					done();
				});
				view.destroy();
			});
			view.init();
		});
	});

});
