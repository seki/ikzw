# -*- coding: utf-8 -*-
require 'tofu'
require 'json'
require 'pond-drip'

class Time
  def to_json(*a)
    # strftime('%Y-%m-%d %H:%M').to_json(*a)
    (to_f * 1000).to_json(*a)
  end
end

module Pond

  DB = PondDrip.new(nil)
  load_dummy_data(DB.drip)

  class PondSession < Tofu::Session
    def initialize(bartender, hint='')
      super
      @base = BaseTofu.new(self)
      @state = StateTofu.new(self)
    end

    def lookup_view(context)
      if context.req_path_info.include?('/api')
        @state
      else
        @base
      end
    end

    def do_GET(context)
      context.res_header('pragma', 'no-cache')
      context.res_header('cache-control', 'no-cache')
      context.res_header('expires', 'Thu, 01 Dec 1994 16:00:00 GMT')
      super(context)
    end
  end

  class StateTofu < Tofu::Tofu
    def to_html(context)
      context.res_header('content-type', 'application/json')
      tid = ticket_id(context)
      if tid
        body = DB[tid].to_json
      else
        body = {'list' => 'not implemented'}.to_json
      end
      p body
      context.res_body(body)
      context.done
    end

    def ticket_id(context)
      p context.req_path_info
      if /\/api\/([\w-]+)\// =~ context.req_path_info 
        return $1
      else
        nil
      end
    end

    def tofu_id
      'api'
    end

    def do_open_event(context, params)
      tid = ticket_id(context)
      return unless tid
      stage ,= params['stage']
      return unless stage
      stage.force_encoding('utf-8')
      DB.add_open_event(tid, stage, Time.now)
    end

    def do_close_event(context, params)
      tid = ticket_id(context)
      return unless tid
      stage ,= params['stage']
      return unless stage
      stage.force_encoding('utf-8')
      DB.add_close_event(tid, stage, Time.now)
    end
  end

  class BaseTofu < Tofu::Tofu
    set_erb(__dir__ + '/table.html')
  end

  class MyTofulet < Tofu::CGITofulet
    def [](key)
      case key
      when 'drip'
        return 'DRIPDB'
      end
      super(key)
    end
  end
end

if __FILE__ == $0
  unless $DEBUG
    exit!(0) if fork
    Process.setsid
    exit!(0) if fork
  end
  uri = ARGV.shift || 'druby://localhost:54345'
  tofu = Tofu::Bartender.new(Pond::PondSession, 'pond_' + uri.split(':').last)
  DRb.start_service(uri, Pond::MyTofulet.new(tofu))
  unless $DEBUG
    STDIN.reopen('/dev/null')
    STDOUT.reopen('/dev/null', 'w')
    STDERR.reopen('/dev/null', 'w')
  end
  DRb.thread.join
end
