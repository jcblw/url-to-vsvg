# URL to VSVG

This is a small util to request a svg's content and then parse that content using vsvg. 

## Install

    $ npm install url-to-vsvg

## Usage

```javascript
var URL2SVG = require( 'url-to-vsvg' )

URL2SVG( './foo.svg', function( err, svg ){
    if ( err ) return console.error( err )

    svg.children[ 0 ].innerHTML = ''
    svg.children[ 1 ].setAttribute( 'fill', 'tomato' )
    svg.children[ 2 ].setAttribute( 'fill', 'crimson' )
    svg.children[ 3 ].setAttribute( 'fill', 'honeydew' )
    svg.children[ 4 ].setAttribute( 'fill', 'crimson' )

    document.body.appendChild( svg._node );
})

```

If you have any issues open a ticket it probably has to do with the underlying libs
