#!/usr/local/bin/ruby

require 'drb/drb'

DRb.start_service('druby://localhost:0')
ro = DRbObject.new_with_uri('druby://localhost:54345')
ro.start(ENV.to_hash, $stdin, $stdout)
