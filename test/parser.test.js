
if(typeof require === 'function') var kff = require('../build/kff.js');



describe('matchIdentifier', function()
{

	it('should match an integer number', function()
	{
		var result = kff.parser.matchNumber('4');
		expect(result.match).to.equal(4);
	});

	it('should match a negative float number', function()
	{
		var result = kff.parser.matchNumber('-42.85');
		expect(result.match).to.equal(-42.85);
	});

	it('should match an indentifier', function()
	{
		var result = kff.parser.matchIdentifier('foobar42.abc');
		expect(result.match).to.equal('foobar42');
		expect(result.rest).to.equal('.abc');
	});

	it('should match an binding operator name', function()
	{
		var result = kff.parser.matchBindingOperatorName(':name42(rest)');
		expect(result.match).to.equal('name42');
		expect(result.rest).to.equal('(rest)');
	});

	it('should match a keyPath', function()
	{
		var result = kff.parser.matchKeyPath('foo42.bar24.abc');
		expect(result.match.length).to.equal(3);
		expect(result.match[0]).to.equal('foo42');
		expect(result.match[1]).to.equal('bar24');
		expect(result.match[2]).to.equal('abc');
	});

	it('should match a keyPath with single part', function()
	{
		var result = kff.parser.matchKeyPath('foo42');
		expect(result.match.length).to.equal(1);
		expect(result.match[0]).to.equal('foo42');
	});

	it('should match a keyPath or operator', function()
	{
		var result = kff.parser.matchOr([kff.parser.matchKeyPath, kff.parser.matchBindingOperatorName] ,'foobar42.abc:text');
		expect(result.match.length).to.equal(2);
		expect(result.match[0]).to.equal('foobar42');
		expect(result.match[1]).to.equal('abc');
	});

	it('should match an operator or keyPath', function()
	{
		var result = kff.parser.matchOr([kff.parser.matchBindingOperatorName, kff.parser.matchKeyPath,], ':text');
		expect(result.match).to.equal('text');
	});

	it('should match a cursor', function()
	{
		var result = kff.parser.matchCursor('@foo42.bar24.abc');
		expect(result.match.type).to.equal('cursor');
		expect(result.match.keyPath.join('.')).to.equal('foo42.bar24.abc');
	});

	it('should match a cursor with whitespace before', function()
	{
		var result = kff.parser.skipWhiteSpace(kff.parser.matchCursor)(' @foo42.bar24.abc');
		expect(result.match.type).to.equal('cursor');
		expect(result.match.keyPath.join('.')).to.equal('foo42.bar24.abc');
	});

	// it('should match operator params', function()
	// {
	// 	var result = kff.parser.matchOperatorParams('(@foo42, (r1b2, @bar.abc), -42.8)');

	// 	// console.dir(result, { depth: 42 })
	// 	// console.log(result.match[result.match.length - 8])



	// 	// expect(result.match.length).to.equal(2);
	// 	// expect(result.match[0]).to.equal('@');
	// 	// expect(result.match[1].join('.')).to.equal('foo42.bar24.abc');
	// });



});
