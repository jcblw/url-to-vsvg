(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{"../":2}],2:[function(require,module,exports){
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
    if ( parsed[ 0 ] ) {
        // this is here because of a bug in the initialization of DOM nodes
        parsed[ 0 ].innerHTML = parsed[ 0 ].innerHTML
    }
    callback( null, parsed[ 0 ] ) 
}


},{"vsvg":3,"xhr":10}],3:[function(require,module,exports){

// export out src svg
var vsvg = require( './src/' );

module.exports = vsvg;

if ( typeof window === 'object' ) {
    window.vsvg = vsvg;
}
},{"./src/":5}],4:[function(require,module,exports){
'use strict';

var startTag = /^<([-A-Za-z0-9_:]+)(.*?)(\/?)>/g, // match opening tag
    endTag = /<\/([-A-Za-z0-9_:]+)[^>]*>/, // this just matches the first one
    attr = /([-A-Za-z0-9_:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g; // match tag attributes

exports.parse = parse;

function makeArray( arr ) {
    return Array.prototype.slice.call( arr, 0 );
}

/*
    getAttributes - turns an array of attributes into a key value object
    params
        attributes { Array } - array of strings eg. [ 'x="5"' ]
    returns
        attributes { Object } - object of key values eg. { x: '5' }
*/

var getAttributes =
exports.getAttributes = function getAttributes( attributes ) {
    var _attributes = {};

    function addToAttributes( keyvalue ) {
        var arr = keyvalue.split( /=/ ),
            key = arr[ 0 ],
            value = arr[ 1 ] ? arr[ 1 ].slice( 1 ).slice( 0, -1 ) : '';

        _attributes[ key ] = value;
    }

    attributes.forEach( addToAttributes );

    return _attributes;
};

/*
    getTagIndex - given a tagName it will return the index of the last tag that matches the tagName
    params
        tagName { String } - the tagName eg, svg, text, line
        tags { Array } - array of tags, the tag object has a tagName variable that is matched against the tagName
    returns
        index { Number } - returns index of tag, or -1 if not in array
*/

var getTagIndex =
exports.getTagIndex = function getTagIndex( tagName, tags ) {
    for ( var i = tags.length - 1; i >= 0; i -= 1 ) {
        if ( tags[i].tagName === tagName ) {
            return i;
        }
    }
    return -1;
};

/*
    getLastOpenTag - gets the index of the last opened tag
    params
        tags { Array } - array of tags, the tag object has a closed variable that is test which
            indicates if the tag is closed. Array is ran through in reverse
    returns
        index { Number } - returns index of tag, or -1 if not in array
*/

var getLastOpenTag =
exports.getLastOpenTag = function getLastOpenTag( tags ) {
   for ( var i = tags.length - 1; i >= 0; i -= 1 ) {
        if ( !tags[ i ].closed ) {
            return i;
        }
   } 
   return -1;
};

/*
    createTree - turns an array of elements and turns them into tree based off position array
    params
        tags { Array } - array of tags, the tag object consist of three main things, tagName, position, attributes
    returns
        attributes { Object } - object which is a nest object representation of the original svg
*/

var createTree =
exports.createTree = function createTree( tags ) {

    var _tags = [];

    function getArray( position, arr ) {
        var _position = makeArray( position );
        if ( _position.length === 1 ) {
            return arr;
        }
        var next = arr[ _position[ 0 ] ].children;
        _position.shift();
        return getArray( _position, next );
    }

    function addTagToTree( tag ) {
        var arr = getArray( tag.position, _tags );
        arr.push( tag );
    }

    tags.forEach( addTagToTree );
    return _tags;

};



/*
    parse - will parse a xml string and turn it into an array of tags
    params
        xml { String } - a xml string eg. '<svg><line /></svg>'
    returns
        index { Array } - array of tags in a tree form same as the structure as the xml string
        
        eg.
            [{
                tagName: 'svg',
                attributes: {},
                position: [ 0 ]
                children: [{
                    tagName: 'line',
                    attributes: {},
                    children: [],
                    postion: [ 0, 0 ]
                }]
            }]

*/

function parse( xml ) {

    xml = xml.replace( /(\r\n|\n|\r)/gm, '' ); // remove all line breaks

    var tags = [],
        position = [ 0 ], // initial position
        openTag, 
        attributes,
        end,
        text,
        index,
        prevTag,
        prevLength,
        closed,
        tagName,
        tag;

    while ( xml ) { // we carve away at the xml variable

        // this checks to see if the previous string length is same as 
        // the current string length
        if ( xml.length === prevLength ) {
            throw new Error( 'Failed to parse SVG at chars: ' + xml.substring( 0, 5 ) );
        }
        // set prevLength
        prevLength = xml.length;

        xml = xml.trim(); // there is some issues with open tag if this is not done

        openTag = xml.match( startTag );

        if ( openTag ) { // if there is an open tag grab the attribute, and remove tag from xml string
            openTag = openTag[ 0 ];
            attributes = openTag.match( attr );
            xml = xml.substring( openTag.length ); 
            // reseting some vars
            text = null;
            prevTag = null;
            closed = null;
            if ( /\/>$/.test( openTag ) ) { // testing for self closing tags
                closed = true;
            }
        }
        else {
            end = xml.match( endTag ); // see if there is an end tag
            attributes = [];
            if ( end ) { // if there is a end tag find the last tag with same name, set text, and remove data from xml string
                index = getTagIndex( end[ 1 ], tags ); 
                prevTag = tags[ index ];
                text = xml.slice( 0, end.index );
                xml = xml.substring( end.index + end[ 0 ].length );
            }
        }

        tagName = attributes.shift(); // tagName with be the first in array

        if ( tagName || text ) { // tagName or text will be set if it is somewhat of a good output

            tag = {
                tagName: tagName,
                attributes: getAttributes( attributes ), // convert to object
                children: [],
                text: text,
                inside: getLastOpenTag( tags ), // this is needed to get an accurate position
                closed: closed || !!text
            };

            if ( tag.inside > -1 ) {
                position.push( -1 ); // push this value it is sometime just cut off
                position[ tags[ tag.inside ].position.length ] += 1;
                position = position.slice( 0, tags[ tag.inside ].position.length + 1 );
                // eg. [ 0, 0, 1 ] this is a map of where this tag should be at
            }

            tag.position = makeArray( position );
            tags.push( tag ); // push the tag

        }

        if ( prevTag ) {
            prevTag.closed = true; // close the prevTag
        }

    }

    return createTree( tags ); // convert flat array to tree
}
},{}],5:[function(require,module,exports){

'use strict';

var tags = require( './tags' ),
    SvgNode = require( './svgNode' ),
    parser = require( 'vsvg-parser' ),
    methods = {};

/*
    runs and returns an object with all the tagNames eg. vsvg.style()
*/

module.exports = ( function() {
    tags.forEach( function( tagName ) {
        methods[ tagName ] = SvgNode.bind( null, tagName );
    } );
    return methods;
}( ) );


/*
    vsvg::_eachTag - utility to loop through the children of results of a parsed svg 
    string to turn the structure into vsvg tags.

    params
        tag { Object } - a tag object returned from parser.parse

    returns
        elem { Object } - a svgNode or textNode
*/

var _eachTag =
methods._eachTag = function _eachTag( tag ) {
 
    var elem;

    if ( tag.tagName && methods[ tag.tagName ] ) {

        elem = methods[ tag.tagName ]( tag.attributes );
        if ( elem.children ) {    

            for( var i = 0; i < tag.children.length; i += 1 ) {

                var _elem = _eachTag( tag.children[ i ] );

                if ( typeof _elem === 'string' ) {

                    elem.innerText = _elem;
                } else {

                    elem.appendChild( _elem );
                }
            }
        }

        return elem;
    }

    return tag.text || '';
};

/*
    vsvg::parse - A wrapper around parser.parse to create vsvg Elements
    out of the return of parser.parse

    params
        svg { String } - a compiled string version of a svg to be parsed

    returns 
        tags { Array } - an array of svgNodes
*/
var parse =
methods.parse = function( svg ) {
    var parsedSVG;
    try {
        parsedSVG = parser.parse( svg );
    } catch ( e ) {
        return null;
    }
    return parsedSVG.map( _eachTag );
};

/*
    vsvg::_addNodeToVNode - adds regular DOM node to virtual node to allow for
    method proxing to actual dom nodes. Als o recusivly jumps into children and 
    attempts to add those nodes as well.

    params 
        node { Object } - a DOM node
        vNode { object } - a virtual svgNode
*/

var addNodeToVNode =
methods._addNodeToVNode = function( node, vNode ) {
    
    function eachChild( _vNode, index ) {
        addNodeToVNode( node.children[ index ], _vNode ); // recursivly jump down tree
    }

    vNode.children.forEach( eachChild ); // loop through all the children
    vNode._node = node;// attach node to vNode
};

/*
    vsvg::mount - mounts to a actual dom node and adds children  dom nodes to virtual tree
    as well.

    params 
        el { Object } - an entry point DOM node

    returns
        elem { Object } - a virtual representation of the DOM node
*/

methods.mount = function( el ) {
    var svg = el.outerHTML,
        tagTree = parse( svg );

    addNodeToVNode( el, tagTree[ 0 ] ); // start walking the parsed tree 
    return tagTree[ 0 ];
};
},{"./svgNode":6,"./tags":7,"vsvg-parser":4}],6:[function(require,module,exports){

'use strict';

var utils = require( './utils' ),
    TextNode = require( './textNode' ),
    namespace = 'http://www.w3.org/2000/svg';

module.exports = SvgNode;

/*
    SvgNode - creates an svg node
    params
        tagName { String } - name of tag to create
        _attribute { Object } - an object with attribute declarations
    returns
        this { SvgNode Object } - an object with a number of methods to
            manipulate element

    TODO make toHTML serve back self closing tags 
*/

function SvgNode( tagName, attributes ) {

    if ( !( this instanceof SvgNode ) ) { // magical invocation
        return new SvgNode( tagName, attributes );
    }

    attributes = Object.create( attributes || {} );

    this.guid = utils.guid();
    this.tagName = tagName;
    this._children = [];
    this.styles = attributes.style ? utils.styleToObject( attributes.style ) : {};
    attributes.style = this.styles;
    this._attributes = attributes;
    if ( typeof document === 'object' ) { // auto create element if in client
        this._node = document.createElementNS( namespace, tagName );
    }
}

SvgNode.prototype = {

    /*
        SvgNode::insertBefore - inserts new child before a referanced child
        params
            elem { SvgNode } - a new element
            refElem { SvgNode } - an exsisting child element
    */

    insertBefore: function ( elem, refElem ) {
        var index = utils.getElementIndex( refElem, this._children );
        this.removeChild( elem ); // this needs to be revised to be more like normal html spec
        this._children.splice( index, 0, elem );
        if ( this._node && elem._node && refElem._node ) {
            this._node.insertBefore( elem._node, refElem._node );
        }
    },

    /*
        SvgNode::removeChild - removes a child element from child array
        params
            elem { SvgNode } - an exsisting child element to be removed
    */


    removeChild: function ( elem ) {
        var index = utils.getElementIndex( elem, this._children );
        if ( index === -1 ) {
            return;
        }
        this._children.splice( index, 1 ); 
        if ( this._node && elem._node ) {
            this._node.removeChild( elem._node );
        }
    },

    /*
        SvgNode::replaceChild - removes a child element from child array and add a new one
        params
            elem { SvgNode } - an exsisting child element to be removed
            replaceElem { SvgNode } - an element to replace removed elem
    */


    replaceChild: function ( elem, replaceElem ) {
        var index = utils.getElementIndex( elem, this._children );
        if ( index === -1 ) {
            return;
        }
        this._children.splice( index, 1, replaceElem ); 
        if ( this._node && elem._node && replaceElem._node ) {
            this._node.replaceChild( replaceElem._node, elem._node );
        }
    },

    /*
        SvgNode::appendChild - appends a child element from child array
        params
            elem { SvgNode } - an exsisting child element to be appended
    */

    appendChild: function ( elem ) {
        this.removeChild( elem ); // remove any old instances
        elem.parentNode = this;
        this._children.push( elem );
        if ( this._node && elem._node ) {
            this._node.appendChild( elem._node );
        }
    },

    /*
        SvgNode::_removeTextNodes - a utility to remove text nodes from array
        params
            node { SvgNode } - a node to test to see if its a text node
    */

    _removeTextNodes: function ( node ) {
        return !!node.tagName;
    },
    
    /*
        SvgNode::children [ getter ]
        returns 
            array of nodes that are not text nodes
    */

    get children () {
        return this._children.filter( this._removeTextNodes );
    },

    /*
        SvgNode::firstChild [ getter ] 
        returns 
            child { SvgNode } - first child or null
    */

    get firstChild ( ) {
        return this._children[ 0 ];
    },

    /*
        SvgNode::toHTML - compiles tags for the element and child elements
        returns
            html { String } - the html ( svg ) compilied to a string form
    */

    toHTML: function ( ) {
        return '<' + 
            this.tagName + 
            ' ' + 
            utils.objToAttributes( this._attributes || {} ) + 
            '>' + 
            this._children.map( utils.mapElementsToHTML ).join('') +
            '</' +
            this.tagName +
            '>';
    },

    /*
        SvgNode::toText - compiles element inner text nodes to strings
        returns
            text { String } - the text inside of elements
    */

    toText: function( ) {
        return this._children.map( utils.mapElementsToText ).join('');
    },

    /*
        SvgNode::getAttribute - get attribute of element
        params 
            key { String } - attribute name 
        returns
            value { Mixed } - the value of the attribute
    */

    getAttribute: function( key ) {
        return this._attributes[ key ];
    },

    /*
        SvgNode::setAttribute - set attribute of element
        params 
            key { String } - attribute name 
            value { Mixed } - the value of the attribute
    */

    setAttribute: function( key, value ) {
        this._attributes[ key ] = value;
        if ( this._node ) {
            this._node.setAttribute( key, value );
        }
    },

    /*
        SvgNode::attributes [ getter ] - returns the actual attribute object
        returns 
            attributes { Object } - object of attributes key values 
    */

    get attributes ( ) {
        return this._attributes;
    },

    /*
        SvgNode::attributes [ setter ] - blocks the direct setting of attributes
        returns 
            attributes { Mixed } - value attempting to set attibutes to 
    */

    set attributes ( value ) {
        return value; // block from directly setting
    },

    /*
        SvgNode::outerHTML [ getter ] - returns same as toHTML();
        returns 
            html { String } - compiled version of element and children
    */

    get outerHTML () {
        return this.toHTML();
    },

    /*
        SvgNode::innerHTML [ getter ]
        returns 
            html { String } - compiled version of element's children
    */

    get innerHTML () {
        return this._children.map( utils.mapElementsToHTML ).join('');
    },

    /*
        SvgNode::innerHTML [ setter ]
        params 
            html { String } - compiled version of element's children
    */

    set  innerHTML ( html ) {
        var vsvg = require( '../' ); // defer require so everything is loaded

        if ( this._node ) {
            this._node.innerHTML = html;
            this._children = vsvg.mount( this._node ).children;
        }
        else {
            this._children = vsvg.parse( html ); 
        }
    },

    /*
        SvgNode::innerText [ getter ]
        returns 
            html { String } - current does the exact same thing as innerHTML
    */

    get innerText () {
        return this.toText();
    },


    /*
        SvgNode::innerText [ setter ]
        params
            value { String } - This creates a textNode with the text given in it,
                will also remove any other Nodes from current element
    */

    set innerText ( value ) {
        this._children.length = 0; // empty array
        this._children.push( new TextNode( value, {
            unsafe: this.tagName === 'style' 
        } ) ); // style tags need no escape
        if ( this._node ) {
            this._node.innerText = value;
        }
    }
};
},{"../":3,"./textNode":8,"./utils":9}],7:[function(require,module,exports){

'use strict';

/*
    All current svg tags
*/

module.exports = [
    "a",
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignObject",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "script",
    "set",
    "stop",
    "style",
    "svg",
    "span",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern"
];
},{}],8:[function(require,module,exports){

'use strict';

var utils = require( './utils' );

module.exports = TextNode;

function TextNode ( text, options ) {
    if ( !( this instanceof TextNode ) ) { // magical invocation
        return new TextNode( text, options );
    }
    options = options || {};
    this.text = options.unsafe ? text : utils.escapeHTML( text );
}

TextNode.prototype = {
    toHTML: function( ) {
        return this.text;
    },
    toText: function( ) {
        return this.text;
    }
};
},{"./utils":9}],9:[function(require,module,exports){

'use strict';

/*
    s4 & guid - makes a unique idenifier for elements
*/
function s4( ) {
    return Math.floor( ( 1 + Math.random( ) ) * 0x10000 )
        .toString( 16 )
        .substring( 1 );
}


exports.guid = function guid( ) {
    return s4( ) + s4( ) + '-' + s4( ) + '-' + s4( ) + '-' +
        s4( ) + '-' + s4( ) + s4( ) + s4( );
};

/*
    objToStyle - compiles { key: value } to key:value;
    params
        styles { Object } - object of style declarations
    retruns
        ret { String } - compiled sting with css declarations 

    TODO - support camel case
*/

var objToStyles =
exports.objToStyles = function objToStyles( styles ) {
    var ret = '';
    for ( var prop in styles ) {
        ret += prop + ':' + styles[ prop ] + ';';
    }
    return ret;
};

/*
    styleToObject - decompilies key:value to { key: value };
    params
        styles { String } - compiled sting with css declarations
    retruns
        ret { Object } - object of style declarations
*/

exports.styleToObject = function styleToObject( styles ) {
    var ret = { };

    if ( typeof styles === 'object' ) {
        return styles;
    }

    styles.split( ';' ).map( keyVal ).forEach( addToReturn );

    function addToReturn ( keyval ) {
        ret[ keyval[ 0 ] ] = keyval[ 1 ];
    }

    function keyVal( str ) {
        return str.trim().split( ':' );
    }
    return ret;
};

/*
    objToAttribute - compiles { key: value } to key="value"
    params
        attributes { Object } - object of attribute declarations
            style objects will run through objToStyles
    returns
        ret { String } - compiled string with attribute declaration 

    TODO - support camel case
*/

exports.objToAttributes = function objToAttributes( attributes ) {
    var ret = '',
        value;
    for( var attr in attributes ) {
        value = attr === 'style' ? objToStyles( attributes[ attr ] ) : attributes[ attr ];
        if ( attr !== 'style' || value ) {
            ret += attr + '="' + value + '" ';
        }
    }
    return ret;
};

/*
    mapElementsToHTML - to be use with arr.map with run toHTML of each element
    params
        elem { SvgNode Object } - object created by calling tag().
    returns
        html { String } - compiled elem object
*/

exports.mapElementsToHTML = function mapElementsToHTML( elem ) {
    return elem.toHTML();
};

/*
    mapElementsToHTML - to be use with arr.map with run toHTML of each element
    params
        elem { SvgNode Object } - object created by calling tag().
    returns
        html { String } - compiled elem object
*/

exports.mapElementsToText = function mapElementsToText( elem ) {
    return elem.toText();
};

/*
    getElementIndex - get the index of the element in an array
    params
        elem { SvgNode Object } - object created by calling tag().
        arr { Array } - a collections of SvgNode Objects
    returns
        index { Number } - the index of SvgNode obj in collection
*/

exports.getElementIndex = function getElementIndex( elem, arr ) {
    var index = -1;
    arr.forEach( function( _elem, _index ) {
        if ( elem.guid === _elem.guid ) {
            index = _index;
        }
    } );
    return index;
};

/*
    escapeHTML - escapes HTML
    params
        html { String } - unescaped html
    returns
        text { String } - escaped html
*/

exports.escapeHTML = function escapeHTML( html ) {
  return String( html )
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/*
    makeArray - creates a copy of an array
    params
        arr { Array } - original array
    returns
        arr { Array } - new Array
*/

exports.makeArray = function makeArray( arr ) {
    return Array.prototype.slice.call( arr, 0 );
};
},{}],10:[function(require,module,exports){
"use strict";
var window = require("global/window")
var once = require("once")
var parseHeaders = require("parse-headers")


var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }
    
    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }
    
    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(! evt instanceof Error){
            evt = new Error(""+evt)
        }
        evt.statusCode = 0
        callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        clearTimeout(timeoutTimer)
        
        var status = (xhr.status === 1223 ? 204 : xhr.status)
        var response = failureResponse
        var err = null
        
        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        callback(err, response, response.body)
        
    }
    
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new XDR()
        }else{
            xhr = new XHR()
        }
    }

    var key
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync)
    //has to be after open
    xhr.withCredentials = !!options.withCredentials
    
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            xhr.abort("timeout");
        }, options.timeout+2 );
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }
    
    if ("beforeSend" in options && 
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}


function noop() {}

},{"global/window":11,"once":12,"parse-headers":16}],11:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],13:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":14}],14:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],15:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],16:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":13,"trim":15}]},{},[1]);
