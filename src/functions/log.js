
import settings from '../settings.js';

/**
 * Logs a debug message to the console if settings.debug is set to true
 * @param  {string} message The message to log
 */
export default function log(message)
{
	if(typeof console === 'object') console.log(message);
}
