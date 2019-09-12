
require 'net/http'
require "active_support/core_ext/hash/indifferent_access"
require 'rss'
require 'open-uri'
require 'cgi'
require 'set'
require 'fileutils'
require 'json'
require 'dotenv/load'


def titleize( x )
  words = x.split
  words.each do |word|
    if word.length <3
      word.downcase!
    elsif word.length >3
      word.capitalize!
    end
  end
  words.join ' '
end


def rand_n( n, max )
    randoms = Set.new
    loop do
        randoms << rand(max)
        return randoms.to_a if randoms.size >= n
    end
end


def parameters_init( obj )
    obj[:server][:full] = ''
    obj[:server][:full] += obj[:server][:bucket]
    obj[:server][:full] += obj[:server][:folder]

    obj[:path][:json][:folder] = ''
    obj[:path][:json][:folder] += obj[:path][:root]
    obj[:path][:json][:folder] += obj[:path][:folder]

    obj[:path][:json][:frontpage][:full] = ''
    obj[:path][:json][:frontpage][:full] += obj[:path][:json][:folder]
    obj[:path][:json][:frontpage][:full] += obj[:path][:json][:frontpage][:name]

    obj[:path][:json][:watch][:full] = ''
    obj[:path][:json][:watch][:full] += obj[:path][:json][:folder]
    obj[:path][:json][:watch][:full] += obj[:path][:json][:watch][:name]

    k = obj[:files].keys
    for j in 0..k.length-1
        kk = obj[:files][ k[ j ].to_sym ].keys
        for i in 0..kk.length-1
            temp  = obj[:files][ k[ j ].to_sym ][ kk[ i ].to_sym ] 
            obj[:files][ k[ j ].to_sym ][ kk[ i ].to_sym ] = ''
            obj[:files][ k[ j ].to_sym ][ kk[ i ].to_sym ] += obj[:server][:full]
            obj[:files][ k[ j ].to_sym ][ kk[ i ].to_sym ] += temp
        end
    end
  return obj
end


def generate_yt_frontpage( obj )
  k = obj[:files].keys
  final = {}
  for h in 0..k.length-1
    keys = obj[:files][ k[ h ] ].keys
    final[ k[ h ].to_sym ] = {}
    for j in 0..keys.length-1
      url = obj[:files][ k[ h ] ][ keys[ j ] ]
      uri = URI( url )
      response = Net::HTTP.get( uri )
      xml = response
      feed = RSS::Parser.parse( xml )

      final[ k[ h ].to_sym ][ keys[j].to_sym ] = []
      for i in rand_n( obj[:meta][:times], feed.items.length-1)
        feed.items[ i ].title
        url = feed.items[ i ].link.href.to_s
        params_raw = url.split( '?' )[ 1 ]
        params = CGI::parse( params_raw )
        item = {
          :title => params["title"][ 0 ].split( '|' )[ 1 ],
          :channel_name => titleize( params["title"][ 0 ].split( '|' )[ 0 ].downcase )[ 3, 1000 ],
          :video_id => params["video_id"][ 0 ],
          :channel_id => params["channel_id"][ 0 ],
          :time => feed.items[ i ].date.to_s
        }
        final[ k[ h ].to_sym ][ keys[j].to_sym ].push( item )
      end
    end
  end
  result = {
      :data => final
  }
  
  return result
end


def generate_yt_watch( frontpage )
    final = {
        :data => {}
    }
    t = frontpage.keys
    for h in 0..t.length-1
    k = frontpage[ t[ h ] ].keys
    
    final[:data][ t[ h ] ] = []

    for i in 0..k.length-1
        if i == 0
            for j in rand_n( 2, frontpage[ t[ h ] ][ k[ i ] ].length-1 )
                item = frontpage[ t[ h ] ][ k[ i ] ][ j ]
                item[:category] = k[ i ]
                final[:data][ t[ h ] ].push ( item )
            end
        else
            for j in rand_n( 1, frontpage[ t[ h ] ][ k[ i ] ].length-1 )
                item = frontpage[ t[ h ] ][ k[ i ] ][ j ]
                item[:category] = k[ i ]
                final[:data][ t[ h ] ].push ( item )
            end    
        end
    end
    end
    return final
end


hash = {
  :meta => {
    :times => 7
  },
  :server => {
    :bucket => ENV['SERVER_URL'],
    :folder => ENV['SERVER_FOLDER'],
    :full => nil
  },
  :files => {
    :morning => {
      :development => 'development.xml',
      :hype_technology => 'hype-technologies.xml',
      :research => 'research.xml',
      :startup => 'startup.xml',
      :talks_business => 'talks-business.xml',
      :talks_technology => 'talks-tech.xml'    
    },
    :evening => {
      :art => 'art.xml',
      :lifestyle => 'lifestyle.xml',
      :music => 'music.xml',
      :philosophy => 'philosophie.xml',
      :programming => 'programming.xml',
      :sport => 'sport.xml',
      :universe => 'universe.xml'
    }
  },
  :path => {
    :root => './',
    :folder => 'example/',
    :json => {
      :folder => nil,
      :frontpage => {
        :name => 'data--yt-frontpage.json',
        :full => nil
      },
      :watch => {
        :name => 'data--yt-watch.json',
        :full => nil
      }
    }
  }
}

print 'Start > '
hash = parameters_init( hash )
FileUtils.mkdir_p hash[:path][:json][:folder]

print 'Frontpage > '
frontpage = generate_yt_frontpage( hash )
File.open( hash[:path][:json][:frontpage][:full] ,'w' ) do | f |
  f.write( JSON.pretty_generate( frontpage ) )
end

print 'Watch > '
watch = generate_yt_watch( frontpage[:data] ) 
File.open( hash[:path][:json][:watch][:full] ,'w' ) do | f |
  f.write( JSON.pretty_generate( watch ) )
end

print 'Finished !'
