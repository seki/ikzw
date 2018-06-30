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

function applyForm(table, head) {
  for (var name in head) {
    node = table.getElementsByClassName(name);
    node[0].textContent = head[name];
  }
};

table.style.display = "none";

function openQRMode() {
  table.style.display = "none";
  canvas.style.display = "block";
  animation = requestAnimationFrame(draw);
}

function openTableMode() {
  canvas.style.display = "none";
  table.style.display = "inline";
}

applyForm(table, getDataHeading());
applyForm(table, getDataValue());

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
      return;
    }
  } else {
    count = 0;
  }
  animation = requestAnimationFrame(draw);
}
