# -*- coding: utf-8 -*-
require 'tofu'
require 'json'
require 'drip'

module Pond
  Stage = [
    ["room1", ["room1_stage1", "room1_stage2"]],
    ["room2", ["room2_stage1", "room2_stage2"]],
    ["room3", ["room3_stage1"]],
    ["room4", ["room4_stage1", "room4_stage2"]],
    ["room5", ["room5_stage1", "room5_stage2", "room5_stage3"]],
    ["room6", ["room6_stage1", "room6_stage2", "room6_stage3"]]
  ]

  class Ticket
    def initialize(hash)
      @value = hash
      seek_stage
    end
    attr_reader :value

    def to_hash
      @value
    end

    def [](key)
      @value[key]
    end

    def []=(key, value)
      @value[key] = value
    end

    def where
      seek_stage
      r, s = Stage.assoc(@room)
      [@room, s]
    end

    def seek_stage
      @room, @stage = find_stage
      if @value.dig(@room, 1)
        @stage = nil
      end
    end

    def find_stage
      Stage.reverse_each do |room, proc|
        proc.reverse_each do |key|
          return [room, key] if @value[key]
          return [room, nil] if @value[room]
        end
      end
      return nil, nil
    end
  end 

  class Place
    def initialize
      @ticket = {}
      build_data
    end

    def [](key)
      @ticket[key]
    end

    def build_data
      @drip = Drip.new(nil)
      @origin = @drip.write(true, 'begin')
      load_dummy_data()
      cur = @origin
      while buf = @drip.read(cur, 1, 0)[0]
        cur, it, tags = buf
        @ticket[it['td1']] = Ticket.new(it)
      end
    end

    def load_dummy_data
      # dummy data
      Dir.glob('data/*.json') do |name|
        json = File.read(name)
        ti = JSON.parse(json)
        @drip.write(ti, ti['td1'])
      end
    end

    def start_stage(key, stage)
      ti = @ticket[key]
      ti[stage] = [Time.now]
      p ti.where
    end

    def end_stage(key, stage)
      ti = @ticket[key]
      ary = ti[stage]
      ary[1] = Time.now
    end
  end

  DB = Place.new

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
        body = DB[tid].to_hash.to_json
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

    def do_start(context, params)
      tid = ticket_id(context)
      return unless tid
      stage ,= params['stage']
      return unless stage
      DB.start_stage(tid, stage)
    end
  end

  class BaseTofu < Tofu::Tofu
    set_erb(__dir__ + '/table.html')
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
  DRb.start_service(uri, Tofu::CGITofulet.new(tofu))
  unless $DEBUG
    STDIN.reopen('/dev/null')
    STDOUT.reopen('/dev/null', 'w')
    STDERR.reopen('/dev/null', 'w')
  end
  DRb.thread.join
end
