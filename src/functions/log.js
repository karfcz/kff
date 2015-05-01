
var settings = require('../settings');

/**
 * Logs a debug message to the console if settings.debug is set to true
 * @param  {string} message The message to log
 */
function log(message)
{
	if(settings.debug === true && typeof console === 'object') console.log(message);
}

module.exports = log;
