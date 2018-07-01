require 'json'

class Seed
  def initialize(fname)
    @seed = []
    File.open(fname) do |fp|
      while line = fp.gets
        ary = line.chomp.split("\t")
        ary[7] = ary[7].chop
        @seed.push(ary)
      end
    end
    @stream = @seed.sort_by {rand}
  end

  def next
    @stream.shift
  ensure
    if @stream.empty?
      @stream = @seed.sort_by {rand}
    end
  end
end

class IDSeq
  def initialize(start=18000)
    @offset = start
    @skip = 10
    @last = rand(@skip) + 1
  end

  def next
    @offset + @last
  ensure
    @last += rand(@skip) + 1
  end
end

# 名前	ふりがな	アドレス	性別	年齢	誕生日	婚姻	血液型	都道府県	電話番号	携帯	キャリア	カレーの食べ方

def dummy(idseq, seed)
  it = seed.next
  more = seed.next
  items = []
  if rand(2) == 0
    items << more
    if rand(2) == 0
      items << seed.next
      if rand(2) == 0
        items << seed.next
      end
    end
  end

  { "td1" => idseq.to_s,
    "td2" => it[0],
    "td3" => it[3] + it[7] + it[4],
    "td4" => it[8],
    "td4_1" => rand(2) == 0 ? it[2].split("@")[0] : "-",
    "td4_2" => rand(4) == 0 ? more[4] : "-",
    "td5" => it[11],
    "td6" => "",
    "td7" => "1 個中/１ケ",
    "td8" => more[0],
    "td9" => "kg",
    "td10" => rand(2) == 0 ? it[12] : "-",
    "td11_1" => items[0] ? items[0][6] : "-",
    "td12_1" => items[0] ? items[0][8] : "-",
    "td13_1" => items[0] ? rand(4) + 1 : "-",
    "td11_2" => items[1] ? items[1][6] : "-",
    "td12_2" => items[1] ? items[1][8] : "-",
    "td13_2" => items[1] ? rand(4) + 1 : "-",
    "td11_3" => items[2] ? items[2][6] : "-",
    "td12_3" => items[2] ? items[2][8] : "-",
    "td13_3" => items[2] ? rand(4) + 1 : "-",
    "td14" => "",
    "td15" => ""
  }
end

seed = Seed.new(ARGV.shift)
idseq = IDSeq.new
10.times do
  tid = idseq.next
  File.open("#{tid}.json", 'w') {|fp| fp.puts(dummy(tid, seed).to_json)}
end


