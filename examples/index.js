var utSVG = require( '../' )

utSVG( './foo.svg', function( err, svg ){
    if ( err ) return console.error( err )

    svg.children[ 0 ].innerHTML = ''
    svg.children[ 1 ].setAttribute( 'fill', 'tomato' )
    svg.children[ 2 ].setAttribute( 'fill', 'crimson' )
    svg.children[ 3 ].setAttribute( 'fill', 'honeydew' )
    svg.children[ 4 ].setAttribute( 'fill', 'crimson' )

    document.body.appendChild( svg._node );
})

