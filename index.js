var 
xhr = require( 'xhr' ),
vsvg = require( 'vsvg' )

module.exports = function( url, callback ) {
    xhr({
        url: url,
        method: 'GET'
    }, handleResp.bind( null, callback ) )
}

function handleResp( callback, err, resp ) {
    if ( err ) return callback( err )
    if ( typeof resp.body === 'string' && resp.statusCode === 200 ) return parseSVG( callback, resp.body )
    callback( new Error( 'Incorrect datatype or no data was returned' ) )
}

function parseSVG( callback, str ) {
    var parsed = vsvg.parse( str )
    if ( !parsed ) return callback( new Error( 'Failed to parse response from url' ) )
    callback( null, parsed[ 0 ] ) 
}

