require 'drip'
require 'json'

class PondDrip
  include DRbUndumped

  def initialize(dir)
    @drip = Drip.new(dir)
  end
  attr_reader :drip

  def retrieve(tid, start = 0)
    cur = start
    while true
      ary = @drip.read_tag(cur, tid, 2, 0)
      break if ary.empty?
      ary.each do |k, v, *tags|
        tags.delete(tid)
        yield(v, tags)
        cur = k
      end
    end
  end

  def [](tid)
    hash = {}
    log = []
    retrieve(tid) do |v, tags|
      case tags[0]
      when 'value'
        hash.update(v)
      when 'log'
        log << v
      end
    end
    hash['log'] = log
    hash
  end

  def add_ticket(tid, hash)
    @drip.write(hash, tid, 'value')
  end

  def update_value(tid, key, value)
    @drip.write({key => value}, tid, 'value')
  end

  def add_open_event(tid, stage, time=Time.now, detail=nil)
    add_event(tid, stage, 'open', time, detail)
  end

  def add_close_event(tid, stage, time=Time.now, detail=nil)
    add_event(tid, stage, 'close', time, detail)
  end

  def add_event(tid, stage, event, time=Time.now, detail=nil)
    value = {'stage' => stage, 'event' => event, 'time' => time}
    value['detail'] = detail if detail
    @drip.write(value, tid, 'log', event)
  end
end

def load_dummy_data(drip)
  Dir.glob('data/*.json') do |name|
    json = File.read(name)
    ti = JSON.parse(json)
    drip.write(ti, ti['td1'], 'value')
  end
end

if __FILE__ == $0
  db = PondDrip.new(nil)
  load_dummy_data(db.drip)
  p db['18004']

  db.update_value('18004', 'td8', '20kg')
  db.add_event('18004', 'stage1', 'open')
  sleep(rand())
  db.add_event('18004', 'stage1', 'pause')
  sleep(rand())
  db.add_event('18004', 'stage1', 'resume')
  sleep(rand())
  db.add_event('18004', 'stage1', 'done')
  sleep(rand())

  p db['18004']
end