const medias = {audio : false, video : {
        facingMode : {
          exact : "environment"
        }
      }},
      video  = document.getElementById("video"),
      canvas = document.getElementById("canvas"),
      ctx    = canvas.getContext("2d"),
      table  = document.getElementById("form1");

let imgData, data, ave, animation;

navigator.getUserMedia(medias, successCallback, errorCallback);

animation = requestAnimationFrame(draw);

function applyForm(head) {
  for (var name in head) {
    node = document.getElementById(name);
    node.textContent = head[name];
  }
};

table.style.display = "none";

function openQRMode() {
  table.style.display = "none";
  canvas.style.display = "block";
}

function openTableMode() {
  canvas.style.display = "none";
  table.style.display = "inline";
}

applyForm(getDataHeading());
applyForm(getDataValue());

navigator.getUserMedia(medias, successCallback, errorCallback);

animation = requestAnimationFrame(draw);

function successCallback(stream) {
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
    data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      ave = (data[i + 0] + data[i + 1] + data[i + 2]) / 3;

      data[i + 0] = 
      data[i + 1] = 
      data[i + 2] = (ave > 255 / 2) ? 255 : (ave > 255 / 4) ? 127 : 0;
      data[i + 3] = 255;
    }

  ctx.putImageData(imgData, 0, 0);
  animation = requestAnimationFrame(draw);
}
