
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
	var match = /^[a-zA-Z_$*%][0-9a-zA-Z_$-]*/.exec(input);
	if(match)
	{
		return { match: match[0], rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting identifier ' + input };
	}
}

function matchUnquotedString(input)
{
	var match = /^[^,()):]*/.exec(input);
	if(match)
	{
		return { match: match[0], rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting unquoted string ' + input };
	}
}

function matchString(input)
{
	var match = /^'((\\\'|\\|[^'\\]+)*)'/.exec(input);
	if(match)
	{
		return { match: match[1].replace("\'", '\''), rest: input.slice(match[0].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting string ' + input };
	}
}

function matchNumber(input)
{
	var match = /^[+-]?((0(b|B)[0|1]+)|(0(o|O)[0-7]+)|(0(x|X)[0-9a-fA-F]+)|(\d+(\.\d+)?((e|E)(\+|\-)?\d+)?))/.exec(input);

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
	var match = /^(true|false)[^a-zA-Z0-9_$*]/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[1].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting boolean ' + input };
	}
}

function matchNull(input)
{
	var match = /^(null)[^a-zA-Z0-9_$*]/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[1].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting null ' + input };
	}
}

function matchUndefined(input)
{
	var match = /^(undefined)[^a-zA-Z0-9_$*]/.exec(input);
	if(match)
	{
		return { match: match[1], rest: input.slice(match[1].length)};
	}
	else
	{
		return { error: 'Syntax error: expecting undefined ' + input };
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
		var result = args[i](input);
		if(!result.error)
		{
			return result;
		}
	}

	return { error: 'Syntax error: cannot parse ' + input }
});

var matchSequence = curry(function(args, input)
{
	var sequence = []

	for(var i = 0; i < args.length; i++)
	{
		var result = args[i](input);
		if(!result.error)
		{
			sequence.push(result.match);
			input = result.rest;
		}
		else break;
	}

	if(sequence.length !== args.length)
	{
		return result;
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
	var result = fn(input);
	if(!result.error)
	{
		return { match: flattenArray(result.match), rest: result.rest };
	}
	else return result;
});

var matchMultiple = curry(function(fn, input)
{
	var matches = [];

	do {
		var result = fn(input);
		if(!result.error)
		{
			matches.push(result.match);
			input = result.rest;
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
	var result = fn(input);

	if(!result.error)
	{
		return result;
	}

	return { match: null, rest: input };
});

function getRest(result)
{
	return result.rest;
}

function odds(element, i)
{
	return !(i % 2);
}

function notNull(element, i)
{
	return element != null;
}

function convertNullToStar(result)
{
	if(result.match == null)
	{
		result.match = '*';
	}
	return result;
}

function matchKeyPath(input)
{
	var result = flattenMatch(matchSequence([
		matchPostProcess(convertNullToStar, matchOptional(matchIdentifier)),
		compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([matchPeriod, matchOptional(matchIdentifier) ])
	]))(input);

	if(!result.error) result.match = result.match.filter(odds).filter(notNull);

	return result;
}

var skipWhiteSpace = function(fn)
{
	return compose(fn, skipSpace);
};

var matchPostProcess = curry(function(ppFn, fn, input)
{
	var result = fn(input);

	if(!result.error)
	{
		return ppFn(result);
	}

	return result;
});


var matchCursor = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'cursor',
			keyPath: result.match[1]
		},
		rest: result.rest
	};
}, matchSequence([matchAt, matchKeyPath]));

var matchCursorValue = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'cursorValue',
			keyPath: result.match[2]
		},
		rest: result.rest
	};
}, matchSequence([matchAt, matchAt, matchKeyPath]));


var matchFunction = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'function',
			name: result.match[0],
			params: result.match[1]
		},
		rest: result.rest
	};
}, matchSequence([matchIdentifier, matchOperatorParams]));

var matchNumberObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'number',
			value: result.match
		},
		rest: result.rest
	};
}, matchNumber);

var matchIdentifierObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'ident',
			value: result.match
		},
		rest: result.rest
	};
}, matchIdentifier);

var matchUnquotedStringObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'ident',
			value: result.match
		},
		rest: result.rest
	};
}, matchUnquotedString);

var matchStringObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'string',
			value: result.match
		},
		rest: result.rest
	};
}, matchString);

var matchBooleanObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'boolean',
			value: result.match === 'true'
		},
		rest: result.rest
	};
}, matchBoolean);

var matchNullObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'null',
			value: null
		},
		rest: result.rest
	};
}, matchNull);

var matchUndefinedObject = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'undefined',
			value: undefined
		},
		rest: result.rest
	};
}, matchUndefined);


var operands = [matchNullObject, matchUndefinedObject, matchBooleanObject, matchNumberObject, matchCursorValue, matchCursor, matchStringObject, matchUnquotedStringObject];

var matchNamedParam = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'namedParam',
			name: result.match[0],
			operand: result.match[2]
		},
		rest: result.rest
	};
}, matchSequence([skipWhiteSpace(matchIdentifier), skipWhiteSpace(matchSingleChar(':')), skipWhiteSpace(matchOr(operands))]));


var matchOperand = matchOr([matchNamedParam, matchFunction].concat(operands));


function matchOperatorParamsList(input)
{
	var result = flattenMatch(matchSequence([
		skipWhiteSpace(matchOperand),
		compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([skipWhiteSpace(matchComma), skipWhiteSpace(matchOperand)])
	]))(input);

	if(result.match)
	{
		result = {
			type: 'params',
			match: result.match.filter(function(item){ return item !== null && item !== ','; }),
			rest: result.rest
		};
	}
	return result;
}

function matchOperatorParams(input)
{
	var result = flattenMatch(matchSequence([
		matchSingleChar('('),
		matchOptional(matchOperatorParamsList),
		skipWhiteSpace(matchSingleChar(')'))
	]))(input);

	if(result.match)
	{
		result = {
			type: 'params',
			match: result.match.filter(function(item){ return item !== '(' && item !== ')'; }),
			rest: result.rest
		};
	}
	return result;
}

var matchBindingOperator = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'operator',
			name: result.match[0],
			args: result.match[1] || []
		},
		rest: result.rest
	};
}, matchSequence([matchBindingOperatorName, matchOptional(matchOperatorParams)]));


var matchBinding = matchPostProcess(function(result)
{
	return {
		match: {
			type: 'binding',
			keyPath: result.match[0],
			modelArgs: result.match[1] || [],
			binder: result.match[2],
			binderArgs: result.match[3] || [],
			operators: result.match[4] || []
		},
		rest: result.rest
	};
}, skipWhiteSpace(matchSequence([
		matchKeyPath,
		matchOptional(matchOperatorParams),
		matchBindingOperatorName,
		matchOptional(matchOperatorParams),
		matchOptional(matchMultiple(matchBindingOperator))
	])));


var matchBindings = matchPostProcess(function(result)
{
	return {
		match: {
			bindings: result.match.filter(function(item){ return item !== 'eos'; }),
		},
		rest: result.rest
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
	matchCursorValue: matchCursorValue,
	skipWhiteSpace: skipWhiteSpace,
	matchOperatorParams: matchOperatorParams,
	matchBinding: matchBinding,
	matchBindings: matchBindings
};
