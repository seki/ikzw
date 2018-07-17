const medias = {audio : false, video : {
        facingMode : {
          exact : "environment"
        }
      }},
      video  = document.getElementById("video"),
      canvas = document.getElementById("canvas"),
      ctx    = canvas.getContext("2d"),
      table  = document.getElementById("table1");

let imgData, data, ave, animation, count;
navigator.getUserMedia(medias, successCallback, errorCallback);
table.style.display = "none";

let curr_ticket;

function cloneTicket() {
  node = document.querySelector("#ticket_detail_template").content;
  clone = document.importNode(node, true);
  return table.insertBefore(clone, table.firstChild);
}

function openQRMode() {
  curr_tickeet = null;
  table.style.display = "none";
  canvas.style.display = "block";
  video.style.display = "none";
  animation = requestAnimationFrame(draw);
}

function apply_state(state) {
  curr_ticket = state;
  prepareTicket(table, curr_ticket);
  openTableMode();
}

function openTableMode() {
  canvas.style.display = "none";
  video.style.display = "none";
  table.style.display = "block";
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
    if (count > 6) {
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

function startLog(a, b) {
  if (curr_ticket) {
    addLogTicket(curr_ticket['td1'], '切る', 'open_event');
  }
}

function stopLog(a, b) {
  if (curr_ticket) {
    addLogTicket(curr_ticket['td1'], '切る', 'close_event');
  }
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