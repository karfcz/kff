
# Installation

The preferred installation method is using npm:

```
npm install kff
```

Then you can import it like any other library:

```js
import kff from 'kff'

const myView = new kff.View(...)
```

or

```js
import {View} from 'kff'

const myView = new View(...)
```

Alternatively you can download precompiled builds from https://github.com/karfcz/kff/releases and use it directly in the script tag:

```html
<html>
    <body>
        ...
        <script src="kff.min.js"></script>
    </body>
</html>
```

## Production vs. development mode

Precompiled releases are available in two build variants:

##### kff.js

Non-minified development build. It's slower, contains many runtime checks and can log some warning messages to the console.

##### kff.min.js

Minified production build. Suitable for production. It's faster and doesn't emit runtime warnings.

When building using webpack, browserify or rollup, use `process.env.NODE_ENV` environment variable to set up `development` or `production` build. For production build, you should also minify the build by the uglify plugin with dead code elimination enabled.

### Webpack configuration

```js
new webpack.DefinePlugin({
    'process.env': {
        NODE_ENV: JSON.stringify('production')
    }
}),
new webpack.optimize.UglifyJsPlugin()
```

### Rollup configuration

```js
var replace = require('rollup-plugin-replace')
/*...*/
plugins: [
    replace({
        'process.env.NODE_ENV': JSON.stringify('production')
    })
]
```

### Browserify configuration

```js
var replace = require('rollup-plugin-replace')
/*...*/
transform: [
    ['envify', {
        NODE_ENV: 'production'
    }]
]
```

For detailed instructions see respective bundler documentation.


