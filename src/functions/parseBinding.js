
var curry = require('./curry');
var compose = require('./compose');
var immerge = require('./immerge');

function matchBindingOperatorName(input)
{
	var match = /^:([a-zA-Z_$][0-9a-zA-Z_$]*)/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expectin operator name ' + input };
	}
}

function matchIdentifier(input)
{
	var match = /^[a-zA-Z_$*][0-9a-zA-Z_$-]*/.exec(input);
	if(match)
	{
		return { match: match[0], rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expectin identifier ' + input };
	}
}

function matchString(input)
{
	var match = /^\'([^\']*)\'/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting string ' + input };
	}
}

function matchNumber(input)
{
	var match = /^[+-]?\d+(\.\d+)?/.exec(input);
	if(match)
	{
		return { match: Number(match[0]), rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting number ' + input };
	}
}

function matchBoolean(input)
{
	var match = /^(true|false)[^a-zA-Z0-9_$*]]/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[1].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting boolean ' + input };
	}
}

function matchEos(input)
{
	var match = input.length === 0;
	if(match)
	{
		return { match: 'eos', rest: null };
	}
	else
	{
		return { error: 'Syntax error: expecting end of string ' + input };
	}
}

var matchSingleChar = curry(function(char, input)
{
	if(input[0] === char)
	{
		return { match: char, rest: input.slice(1)};
	}
	else
	{
		return { error: 'Syntax error: expecting character ' + char + ' rest:' + input };
	}
});

var matchPeriod = matchSingleChar('.');
var matchAt = matchSingleChar('@');
var matchComma = matchSingleChar(',');

var matchOr = curry(function(args, input)
{
	for(var i = 0; i < args.length; i++)
	{
		var match = args[i](input);
		if(!match.error)
		{
			return match;
		}
	}

	return { error: 'Syntax error: cannot parse ' + input }
});

var matchSequence = curry(function(args, input)
{
	var sequence = []

	for(var i = 0; i < args.length; i++)
	{
		var match = args[i](input);
		if(!match.error)
		{
			sequence.push(match.match);
			input = match.rest;
		}
		else break;
	}

	if(sequence.length !== args.length)
	{
		return match;
	}

	return { match: sequence, rest: input };
});

function flattenArray(arr)
{
	return arr.reduce(function(a, b) {
	  return a.concat(b);
	}, []);
}

var flattenMatch = curry(function(fn, input)
{
	var match = fn(input);
	if(!match.error)
	{
		return { match: flattenArray(match.match), rest: match.rest };
	}
	else return match;
});

var matchMultiple = curry(function(fn, input)
{
	var matches = [];

	do {
		var match = fn(input);
		if(!match.error)
		{
			matches.push(match.match);
			input = match.rest;
		}
		else break;
	} while(true)

	if(matches.length === 0)
	{
		return { error: 'Syntax error: empty multiple ' + input };
	}

	return { match: matches, rest: input };
});

var matchOptional = curry(function(fn, input)
{
	var match = fn(input);

	if(!match.error)
	{
		return match;
	}

	return { match: null, rest: input };
});

function getRest(match)
{
	return match.rest;
}

function odds(element, i)
{
	return !(i % 2);
}

function notNull(element, i)
{
	return element != null;
}

function convertNullToStar(match)
{
	if(match.match == null)
	{
		match.match = '*';
	}
	return match;
}

function matchKeyPath(input)
{
	var ret = flattenMatch(matchSequence([
		matchPostProcess(convertNullToStar, matchOptional(matchIdentifier)),
		compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([matchPeriod, matchOptional(matchIdentifier) ])
	]))(input);

	if(!ret.error) ret.match = ret.match.filter(odds).filter(notNull);

	return ret;
}

var skipWhiteSpace = function(fn)
{
	return compose(fn, skipSpace);
};

var matchPostProcess = curry(function(ppFn, fn, input)
{
	var match = fn(input);

	if(!match.error)
	{
		return ppFn(match);
	}

	return match;
});


var matchCursor = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'cursor',
			keyPath: match.match[1]
		},
		rest: match.rest
	};
}, matchSequence([matchAt, matchKeyPath]));


var matchFunction = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'function',
			name: match.match[0],
			params: match.match[1]
		},
		rest: match.rest
	};
}, matchSequence([matchIdentifier, matchOperatorParams]));

var matchNumberObject = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'number',
			value: match.match
		},
		rest: match.rest
	};
}, matchNumber);

var matchIdentifierObject = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'ident',
			value: match.match
		},
		rest: match.rest
	};
}, matchIdentifier);

var matchStringObject = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'string',
			value: match.match
		},
		rest: match.rest
	};
}, matchString);

var matchBooleanObject = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'boolean',
			value: match.match === 'true'
		},
		rest: match.rest
	};
}, matchBoolean);

var matchNamedParam = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'namedParam',
			name: match.match[0],
			operand: match.match[2]
		},
		rest: match.rest
	};
}, matchSequence([skipWhiteSpace(matchIdentifier), skipWhiteSpace(matchSingleChar(':')), skipWhiteSpace(matchOr([ matchBooleanObject, matchNumberObject, matchStringObject, matchIdentifierObject, matchCursor]))]));


var matchOperand = matchOr([matchBooleanObject, matchNumberObject, matchStringObject, matchNamedParam, matchFunction, matchIdentifierObject, matchCursor]);


function matchOperatorParams(input)
{
	var match = flattenMatch(matchSequence([
		matchSingleChar('('),
		skipWhiteSpace(matchOperand),
		compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([skipWhiteSpace(matchComma), skipWhiteSpace(matchOperand)]),
		skipWhiteSpace(matchSingleChar(')'))
	]))(input);

	if(match.match)
	{
		match = {
			type: 'params',
			match: match.match.filter(function(item){ return item !== ',' && item !== '(' && item !== ')'; }),
			rest: match.rest
		};
	}
	return match;
}

var matchBindingOperator = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'operator',
			name: match.match[0],
			args: match.match[1]
		},
		rest: match.rest
	};
}, matchSequence([matchBindingOperatorName, matchOptional(matchOperatorParams)]));


var matchBinding = matchPostProcess(function(match)
{
	return {
		match: {
			type: 'binding',
			keyPath: match.match[0],
			modelArgs: match.match[1],
			binder: match.match[2],
			binderArgs: match.match[3],
			operators: match.match[4]
		},
		rest: match.rest
	};
}, skipWhiteSpace(matchSequence([
		matchKeyPath,
		matchOptional(matchOperatorParams),
		matchBindingOperatorName,
		matchOptional(matchOperatorParams),
		matchOptional(matchMultiple(matchBindingOperator))
	])));


var matchBindings = matchPostProcess(function(match)
{
	return {
		match: {
			bindings: match.match.filter(function(item){ return item !== 'eos'; }),
		},
		rest: match.rest
	};
}, flattenMatch(matchSequence([skipWhiteSpace(matchMultiple(matchBinding)), skipWhiteSpace(matchEos)])));


function skipSpace(string)
{
	var first = string.search(/\S/);
	if(first === -1) return "";
	return string.slice(first);
}



module.exports = {
	matchIdentifier: matchIdentifier,
	matchNumber: matchNumber,
	matchKeyPath: matchKeyPath,
	matchBindingOperatorName: matchBindingOperatorName,
	matchOr: matchOr,
	matchCursor: matchCursor,
	skipWhiteSpace: skipWhiteSpace,
	matchOperatorParams: matchOperatorParams,
	matchBinding: matchBinding,
	matchBindings: matchBindings
};
