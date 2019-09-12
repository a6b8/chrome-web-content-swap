function titleize( sentence ) {
    if( !sentence.split ) return sentence

    var _titleizeWord = function( string ) {
            return string.charAt( 0 ).toUpperCase() + string.slice( 1 ).toLowerCase()
        },
        result = []
    
        sentence.split(' ').forEach( function( w ) {
            result.push(_titleizeWord( w ) )
        } )
    return result.join( ' ' )
}


function date_calculate( str ) {
    item = {
        'date' : {
            'search' : new Date( str ),
            'now' : new Date( Date.now() )
        },
        'result' : {
            'one_day_ms' : 24 * 60 * 60 * 1000,
            'days' : '',
            'str' : ''
        }
    }

    item['result']['days'] = Math.round(
        Math.abs( 
            ( item['date']['search'].getTime() - item['date']['now'].getTime() ) / ( item['result']['one_day_ms'] ) 
        ) 
    )

    let threshold_months = 3

    if( item['result']['days'] > threshold_months * 30 ) {
        item['result']['str'] = Math.floor( item['result']['days'] / 30 ) + ' Months ago'
    } else {
        item['result']['str'] = item['result']['days'] + ' Days ago'
    }

    return item['result']['str']
} 


function watch_node_start( node ) {

    let l = hash['json']['data'][ hash['mode']['current'] ].length
    let data = hash['json']['data'][ hash['mode']['current'] ][ hash['init']['count']['items'] % l ]

    if( hash['init']['count']['items'] == 0 ) {
        hash['channel'] = init_channel( hash['view']['current'] )
        set_logo()
        set_button()
    }
   
    data['href_video'] = 'https://www.youtube.com/watch?v=' + data['video_id']
    data['href_video_short'] = '/watch?v=' + data['video_id']
    data['href_channel'] = 'https://www.youtube.com/channel/' + data['channel_id']

    data['days_str'] = date_calculate( data['time'] )

    watch_node_set( node, data )

    hash['init']['count']['items'] = hash['init']['count']['items'] + 1

    if( hash['init']['count']['items'] > Math.floor( l * 2.5 ) ) {
        console.log( hash['init']['count']['items'] + ' stopped' ) 
        hash['init']['observer'].disconnect()
    }
}


function watch_node_set( node, data ) {
    selectors = {
        'title' : '#video-title',
        'time' : '.ytd-thumbnail-overlay-time-status-renderer',
        'image' : '#img',
        'thumbnail' : '#thumbnail',
        'channel_name' : '#channel-name',
        'channel_text' : '#text',
        'metadata' : '#metadata-line',
        'href_video' : null,
        'href_video_short' : null,
        'href_channel' : null,
        'href_thumbnail' : null
    }

    node
        .querySelector( selectors['title'] )
        .innerText = data['title']

    node
        .querySelector( selectors['title'] )
        .setAttribute( 'href', data['href_video'] )

    node
        .querySelector( selectors['title'] )
        .setAttribute( 'aria-label', data['title'] )

    node
        .querySelector( selectors['channel_name'] )
        .querySelector( selectors['channel_text'] )
        .innerText = data['channel_name']

    node
        .querySelector( '#mouseover-overlay' )
        .outerHTML = ''

    node
        .querySelector( '#metadata-line' )
        .innerText = '' + data['days_str']


    badges = document.body.querySelectorAll( 'div.style-scope.ytd-badge-supported-renderer' )

    for( var i = 0; i < badges.length; i++ ) {
        badges[ i ].outerHTML = ''
    }

    episodes = document.body.querySelectorAll( 'div.badge-badge-style-type-collection-style-scope-ytd-badge-supported-renderer' )

    for( var i = 0; i < episodes.length; i++ ) {
        episodes[ i ].outerHTML = ''
    }

    str = ''        
    str += '<a id="thumbnail" class="yt-simple-endpoint inline-block style-scope ytd-thumbnail" aria-hidden="true" tabindex="-1" rel="nofollow" href="/watch?v='
    str += data['video_id']
    str += '"></a>'

    node
        .querySelector( '#thumbnail' )
        .outerHTML = str

    str = ''
    str += '<img id="test" src="'
    str += data['href_thumbnail']
    str += '" alt="The Image" width="168" href="' + data['href_video_short'] + '"'
    str += '/>'

    node
        .querySelector( '#thumbnail' )
        .innerHTML = str

    node
        .setAttribute( "href", data['href_video_short'] )
}


function watch_observer_set() {
    return new Promise(function( resolve, reject ) {
        const callback = function( mutationsList, observer ) {
            for( let mutation of mutationsList ) {
                if ( mutation.type === 'childList' ) {
                    if( mutation.target.id == 'items' ) {
                        for( var i = 0; i < mutation.addedNodes.length; i++ ) {
                            for( var j = 0; j < mutation.addedNodes[ i ].children.length; j++) {
                                if( mutation.addedNodes[ i ].children[ j ].id == 'dismissable' && 
                                    mutation.addedNodes[ i ].children[ j ].getAttribute( 'modified' ) == null ) 
                                    {
                                        mutation.addedNodes[ i ].children[ j ].setAttribute( 'modified', 'true' )
                                        result = mutation.addedNodes[ i ].children[ j ]
                                        watch_node_start( result )
                                    }
                            break
                            }
                        break
                        }
                    // break
                    }
                }
            }
        }
        
        hash['init']['observer'] = new MutationObserver( callback )
        hash['init']['observer'].observe( 
            document.body, 
            {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
             } 
        )
        return resolve
    })
}


function json_to_data() {
    let stacks = []
    switch( hash['view']['current'] ) {
        case 'watch':
            var stack = {
                'category' : 'Mixed Content',
                'items' : []
            }

            for( var i = 0; i < hash['json']['data'][ hash['mode']['current'] ].length; i++ ) {
                let index = i
                data = hash['json']['data'][ hash['mode']['current'] ][ index ]

                data['href_video'] = 'https://www.youtube.com/watch?v=' + data['video_id']
                data['href_video_short'] = '/watch?v=' + data['video_id']
                data['href_channel'] = 'https://www.youtube.com/channel/' + data['channel_id']
            
                data['href_thumbnail'] = '' //'https://i.ytimg.com/vi/' + data['video_id'] + '/hqdefault.jpg'
                data['href_thumbnail'] += hash['server']['url']
                data['href_thumbnail'] += hash['server']['route']

                data['href_thumbnail'] += hash['view']['shortcut'][ hash['view']['current'] ] + '--'
                data['href_thumbnail'] += hash['mode']['current'] + '---' + data['category'].replace( '_', '-' )
                data['href_thumbnail'] += '.jpg'
                
                data['days_str'] = date_calculate( data['time'] )
                stack['items'].push( data )                
            }
            stacks.push( stack )
            break
        case 'frontpage':
            categories = Object.keys( hash['json']['data'][ hash['mode']['current'] ] )

            for( var j = 0; j < categories.length; j++ ) {
                var stack = {
                    'category' : categories[ j ],
                    'items' : []
                }

                l = hash['json']['data'][ hash['mode']['current'] ][ stack['category'] ]
                for( var i = 0; i < l.length; i++ ) {
                    let index = i
                    data = hash['json']['data'][ hash['mode']['current'] ][ stack['category'] ][ index ]
                    data['category'] = stack['category']
                    data['href_video'] = 'https://www.youtube.com/watch?v=' + data['video_id']
                    data['href_video_short'] = '/watch?v=' + data['video_id']
                    data['href_channel'] = 'https://www.youtube.com/channel/' + data['channel_id']
                
                    data['href_thumbnail'] = '' //'https://i.ytimg.com/vi/' + data['video_id'] + '/hqdefault.jpg'
                    data['href_thumbnail'] += hash['server']['url']
                    data['href_thumbnail'] += hash['server']['route']
                    data['href_thumbnail'] += hash['view']['shortcut'][ hash['view']['current'] ] + '--'
                    data['href_thumbnail'] += hash['mode']['current'] + '---' + data['category'].replace( '_', '-' )
                    data['href_thumbnail'] += '.jpg'
                    
                    data['days_str'] = date_calculate( data['time'] )
                    stack['items'].push( data )
                }
                stacks.push( stack )
            }
            break
    } 
    return stacks
}


function init_channel( view ) {

    result = {
        'id' : null,
        'is_added' : false,
        'category' : null
    }

    if( view === 'watch' ) {
        let id = document
            .querySelector( '#text-container' )
            .querySelector( 'a.yt-simple-endpoint.style-scope.yt-formatted-string' )
            .href

        str = 'https://www.youtube.com/channel/'
        result['id'] = id.substring( str.length, id.length )

        items = hash['data'][ 0 ]['items']
        for( var i = 0; i < items.length; i++ ) {
            if( items[ i ]['channel_id'] == result['id'] ) {
                result['is_added'] = true
                result['category'] = items[ i ]['category']
            }
        }
    }
    return result
}


function set_logo() {
    header = document.querySelector( '#masthead-container' ).querySelector( '#container' ).children
    a = document.createElement( 'a' )
    a.setAttribute( 'href', 'https://www.curlai.com' )
    img = document.createElement( 'img' )
    img.src = hash['server']['full'] + hash['server']['logo']
    a.append( img )
    header[ 3 ].parentNode.insertBefore( a, header[ 3 ].nextSibling )
    return true
}


function set_button() {
    b = document.body.querySelector('#top-row.ytd-video-secondary-info-renderer').querySelector('#button')
    if( hash['channel']['is_added'] ) {
        b.innerText = hash['channel']['category'].replace('_', ' ')
        b.style = 'background:' + '#' + hash['init']['colors']['grey']
    } else {
        b.innerText = 'ADD TO CURLAI'
        b.style = 'background:' + '#' + hash['init']['colors'][ hash['mode']['current'] ]
    }
    return true
}


async function main() {
    switch( hash['view']['current'] ) {
        case 'watch':
            console.log( 'Curlai.com - YouTube Extension v0.1' )
            console.log( 'Mode: ' + hash['mode']['current'] )
            console.log( 'View: ' + hash['view']['current'] )
            let temp = await fetch( hash['json']['url'] )
            hash['json'] = await temp.json()
            hash['data'] = json_to_data( hash['json'] )
            hash['init']['count']['items'] = 0
            await watch_observer_set()
            break;
        case 'frontpage':
            break;
        default:
    } 
}


function parameters_init( e ) {
    return new Promise( function( resolve, reject ) {
        function init_route( obj ) {
            let url = window.location.href
            let keys = Object.keys( obj['view']['selector'] )
        
            index = null
            if( url.indexOf( obj['view']['selector'][ keys[0] ] ) == 0 ) {
                index = 0
            } else {
                index = 1
            }
            return keys[ index ]
        }
        
        function init_mode( obj ) {
            let hour = ( new Date() ).getHours()
            let index = null
            if( hour > obj['mode']['morning']['from'] && hour < obj['mode']['morning']['to'] ) {
                index = 0
            } else {
                index = 1
            }
            
            return obj['mode']['choose'][ index ]
        }

        hash = {
            'server' : {
                'url' : e['SERVER_URL'],
                'route' : e['SERVER_FOLDER'],
                'full' : '',
                'logo' : 'curlai-logo--24.png'
            },
            'mode' : {
                'choose' : [ 'morning', 'evening' ],
                'morning' : {
                    'from' : 7,
                    'to' : 20 
                },
                'current' : null
            },
            'view' : {
                'selector' : {
                    'watch' : 'https://www.youtube.com/watch?v=',
                    'frontpage' : 'https://www.youtube.com/'
                },
                'current' : null,
                'shortcut' : {
                    'watch' : 'yt-wa',
                    'frontpage' : 'yt-fp '
                }
            },
            'json' : {
                'selector' : {
                    'watch' : 'data--yt-watch.json',
                    'frontpage' : 'data--yt-frontpage.json'
                },
                'url' : null,
                'data' : null
            },
            'init' : {
                'observer' : null,
                'count' : {
                    'items' : 0,
                    'categories' : 0,
                    'max' : {
                        'watch' : 25,
                        'frontpage' : 7
                    }
                },
                'channel' : {
                    'id' : null,
                    'is_added' : null,
                },
                'colors' : {
                    'morning' : '2E6E5E',
                    'evening' : '2E5A6E',
                    'grey' : '757575'
                }
            },
            'data' : null
        }
        
        hash['mode']['current'] = init_mode( hash )
        hash['view']['current'] = init_route( hash )
        
        hash['server']['full'] = ''
        hash['server']['full'] += hash['server']['url']
        hash['server']['full'] += hash['server']['route']

        hash['json']['url'] = ''
        hash['json']['url'] += hash['server']['full']
        hash['json']['url'] += hash['json']['selector'][ hash['view']['current'] ]

        resolve()
    } )
}


console.log(env)

parameters_init( env )
.then( () => {
    main()
})
.catch( ( err ) => {
    console.log( err )
} )





