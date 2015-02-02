
// if(typeof require === 'function') var kff = require('../build/kff.js');

// describe('kff.Cursor', function()
// {

// 	it('should create a simple cursor from primitive value', function()
// 	{
// 		var a = '42';
// 		var cursor = kff.createCursor(null, a);
// 		expect(kff.getCursorValue(cursor)).to.equal('42');

// 	});

// 	it('should create a simple cursor from object', function()
// 	{
// 		var o = { a: '42' };
// 		var cursor = kff.createCursor(['a'], o);
// 		expect(kff.getCursorValue(cursor)).to.equal('42');

// 	});


// 	it('should create a simple cursor from array', function()
// 	{
// 		var arr = ['41', '42', '43'];
// 		var cursor = kff.createCursor([1], arr);
// 		expect(kff.getCursorValue(cursor)).to.equal('42');
// 	});


// 	it('should create a deep cursor from object', function()
// 	{
// 		var arr = ['41', { a: '42' }, '43'];
// 		var cursor = kff.createCursor([1, 'a'], arr);
// 		expect(kff.getCursorValue(cursor)).to.equal('42');
// 	});

// 	it('should create a cursor from cursor', function()
// 	{
// 		var arr = ['41', { a: { b: '42'} }, '43'];
// 		var cursorA = kff.createCursor([1, 'a'], arr);
// 		var cursorB = kff.createCursor(['b'], cursorA);
// 		expect(kff.getCursorValue(cursorB)).to.equal('42');
// 	});


// 	it('should create a curried cursor from another curried cursor', function()
// 	{
// 		var arr = ['41', { a: { b: '42'} }, '43'];
// 		var cursorAp = kff.createCursor([1, 'a']);
// 		var cursorBp = kff.createCursor(['b']);
// 		var cursorB = kff.compose(cursorBp, cursorAp)(arr);

// 		expect(kff.getCursorValue(cursorB)).to.equal('42');
// 	});



// });
