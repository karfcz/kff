
import createClass from './functions/createClass';

import View from './View';
import Cursor from './Cursor';

var ModelView = createClass({
	extend: View
},
{
	constructor: function(options)
	{
		View.call(this, options);
		this.scope['*'] = new Cursor({});
	}
});

export default ModelView;
