const medias = {audio : false, video : {
        facingMode : {
          exact : "environment"
        }
      }},
      video  = document.getElementById("video"),
      canvas = document.getElementById("canvas"),
      ctx    = canvas.getContext("2d"),
      ticket_pane = document.getElementById("ticket_pane"),
      qr_pane = document.getElementById("qr_reader"),
      table  = document.getElementById("table1"),
      logger = document.getElementById("logger");

let imgData, data, ave, animation, count;
navigator.getUserMedia(medias, successCallback, errorCallback);

ticket_pane.style.display = "none";

let curr_ticket;
let curr_room = [["重さを測る"], ["帰る"], ["データ作成"]];

function cloneTicket() {
  node = document.querySelector("#ticket_detail_template").content;
  clone = document.importNode(node, true);
  return table.insertBefore(clone, table.firstChild);
}

function timeStr(f) {
  let d = new Date(f);
  let hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
  let min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
  return hour + ':' + min;
}

function cloneLog(str, fwd_disable) {
  node = document.querySelector("#ticket_log_template").content;
  clone = document.importNode(node, true);
  clone.querySelector(".description").textContent = str;
  let open_pb = clone.querySelector(".open_button");
  let close_pb = clone.querySelector(".close_button");
  let ary = curr_ticket['stage'][str];
  if (ary) {
    if (ary[0][0] == 'open') {
      open_pb.style.background = "#efe";
      open_pb.textContent = open_pb.textContent + " " + timeStr(ary[0][1]);
      fwd_disable = true;
    } else {
      if (ary[0][0] == 'close') {
        open_pb.style.background = "#efe";
        close_pb.style.background = "#fee";
        close_pb.textContent = close_pb.textContent + " " + timeStr(ary[0][1]);
      }
    }
  } else {
    if (fwd_disable) {
      open_pb.style.background = "#efe";
      open_pb.disabled = true;
    }
    close_pb.style.background = "#fee";
    close_pb.disabled = true;
    fwd_disable = true;
  }
  logger.insertBefore(clone, null);
  return fwd_disable;
}

function openQRMode() {
  curr_tickeet = null;
  ticket_pane.style.display = "none";
  qr_pane.style.display = "block";
  animation = requestAnimationFrame(draw);
}

function apply_state(state) {
  curr_ticket = state;
  prepareTicket(table, curr_ticket);
  openTableMode();
}

function openTableMode() {
  qr_pane.style.display = "none";
  ticket_pane.style.display = "block";
  cancelAnimationFrame(animation);
}

function successCallback(stream) {
  count = 0;
  video.srcObject = stream;
  animation = requestAnimationFrame(draw);
};

function errorCallback(err) {
  alert(err);
};

function draw() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.drawImage(video, 0, 0);

  imgData = ctx.getImageData(0, 0, canvas.width,  canvas.height);

  ctx.putImageData(imgData, 0, 0);
  memo = jsQR(imgData.data, imgData.width, imgData.height);
  if (memo) {
    count = count + 1;
    if (count > 3) {
      count = 0;
      openTableMode();
      tid = memo.data;
      queryTicket(tid);
     
      return;
    }
  } else {
    count = 0;
  }
  animation = requestAnimationFrame(draw);
}

function MyQR(options) {
  // if options is string, 
  if( typeof options === 'string' ){
    options	= { text: options };
  }

  // set default values
  // typeNumber < 1 for automatic calculation
  options = options || {};
  var default_options = {
    width		: 64,
    height		: 64,
    typeNumber	: -1,
    correctLevel	: QRErrorCorrectLevel.H,
    background      : "#ffffff",
    foreground      : "#000000"
  };
  for (var key in default_options){
    if(!options[key]){
      options[key] = default_options[key]
    }
  }

  var createCanvas	= function(){
    // create the qrcode itself
    var qrcode	= new QRCode(options.typeNumber, options.correctLevel);
    qrcode.addData(options.text);
    qrcode.make();

    // create canvas element
    var canvas	= document.createElement('canvas');
    canvas.width	= options.width;
    canvas.height	= options.height;
    var ctx		= canvas.getContext('2d');

    // compute tileW/tileH based on options.width/options.height
    var tileW	= options.width  / qrcode.getModuleCount();
    var tileH	= options.height / qrcode.getModuleCount();

    // draw in the canvas
    for( var row = 0; row < qrcode.getModuleCount(); row++ ){
      for( var col = 0; col < qrcode.getModuleCount(); col++ ){
        ctx.fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background;
        var w = (Math.ceil((col+1)*tileW) - Math.floor(col*tileW));
        var h = (Math.ceil((row+1)*tileW) - Math.floor(row*tileW));
        ctx.fillRect(Math.round(col*tileW),Math.round(row*tileH), w, h);  
      }	
    }
    // return just built canvas
    return canvas;
  }

  return createCanvas();
};

function prepareTicket(ticket, value) {
  let table = ticket.querySelector(".ticket_detail");
  for (var td of table.querySelectorAll("td")) {
    let key = td.classList[0];
    let v = value[key];
    td.textContent = v;
  }
  let qr_canvas = MyQR(value["td1"]);
  let qr = table.querySelector(".qr");
  qr.innerHTML = "";
  qr.appendChild(qr_canvas);

  logger.innerHTML = "";
  let fwd_disable = false;
  for (var i in curr_room) {
    fwd_disable = cloneLog(curr_room[i][0], fwd_disable);
  }
}

function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function queryTicketURL(tid) {
  if (tid.match(/^[\w-]+$/)) {
    return "/cgi-bin/pond/api/" + tid + "/";
  } else {
    return null;
  }
}

function queryTicket(tid) {
  url = queryTicketURL(tid);
  if (url) {
    load_state(url);
  }
}

function addLogTicket(tid, stage, event) {
  url = queryTicketURL(tid);
  if (url) {
    stage_str = fixedEncodeURIComponent(stage);
    url = url + '?tofu_id=api;tofu_cmd=' + event + ';stage=' + stage_str;
    load_state(url);
  }
}

function event_button_cb(node, event) {
  if (curr_ticket) {
    stage = node.parentNode.querySelector(".description").textContent;
    addLogTicket(curr_ticket['td1'], stage, event);
  }
}

function open_button_cb(node) {
  event_button_cb(node, 'open_event')
}

function close_button_cb(node) {
  event_button_cb(node, 'close_event')
}

var load_state = (function(url) {
  var x;
  try {
      x = new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
          try {
          x = new ActiveXObject("Microsoft.XMLHTTP");
          } catch (e) {
          x = null;
      }
  }
  if (!x && typeof XMLHttpRequest != "undefined") {
      x = new XMLHttpRequest();
  }
  if (x) {
      x.onreadystatechange = function() {
          if (x.readyState == 4 && x.status == 200) {
              var state = JSON.parse(x.responseText);
              apply_state(state);
         }
      }
      x.open("GET", url);
      x.send(null);
  }
});

cloneTicket();