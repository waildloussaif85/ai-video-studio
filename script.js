var storeImages = [];
var activeIdx = 0;
var ratioType = "16:9";
var playDuration = 2000; 
var loopTimer = null;

var currentOpacity = 1.0;
var scaleZoom = 1.0;
var zoomDir = 1;

// تشغيل حدث الانتقال عند الضغط على زر الدخول معزولاً تماماً هنا
document.getElementById('btn-enter-trigger').onclick = function() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('studio-screen').style.display = 'flex';
    adjustCanvasSize();
};

function adjustCanvasSize() {
    var canvas = document.getElementById('video-canvas');
    if (ratioType === "16:9") {
        canvas.width = 640; canvas.height = 360;
    } else if (ratioType === "9:16") {
        canvas.width = 360; canvas.height = 640;
    } else if (ratioType === "1:1") {
        canvas.width = 500; canvas.height = 500;
    }
    renderStudioFrame();
}

// دالة الرسم المتقدمة - تم دمج تقنية ملء كامل الشاشة التلقائي (Cover) بدون ترك حواف سوداء
function renderStudioFrame() {
    var canvas = document.getElementById('video-canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (storeImages.length > 0) {
        ctx.save();
        if (document.getElementById('color-filter').value === 'grayscale') ctx.filter = 'grayscale(100%)';
        if (document.getElementById('color-filter').value === 'sepia') ctx.filter = 'sepia(80%)';
        ctx.globalAlpha = currentOpacity;

        var currentImg = storeImages[activeIdx];
        if (currentImg) {
            // تقنية الـ Cover الاحترافية لملء شاشة الفيديو بالكامل
            var imgRatio = currentImg.width / currentImg.height;
            var canvasRatio = canvas.width / canvas.height;
            var rw, rh, rx, ry;

            if (imgRatio > canvasRatio) {
                rh = canvas.height; rw = canvas.height * imgRatio;
            } else {
                rw = canvas.width; rh = canvas.width / imgRatio;
            }
            rx = (canvas.width - rw) / 2;
            ry = (canvas.height - rh) / 2;

            // تطبيق تأثير حركة تكبير الكاميرا السينمائية المستمر ببطء
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scaleZoom, scaleZoom);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            ctx.drawImage(currentImg, rx, ry, rw, rh);
        }
        ctx.restore();
    } else {
        ctx.fillStyle = "#111c32";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    var textVal = document.getElementById('video-text-input').value;
    if (textVal.trim() !== "") {
        ctx.save();
        var fontSize = Math.floor(canvas.height * 0.06); 
        ctx.font = "bold " + (fontSize < 18 ? 18 : fontSize) + "px sans-serif";
        ctx.fillStyle = document.getElementById('text-color-input').value;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 6;
        ctx.fillText(textVal, canvas.width / 2, canvas.height - (canvas.height * 0.1));
        ctx.restore();
    }
}

function triggerCinemaAnimation() {
    if (storeImages.length > 0) {
        scaleZoom += 0.0006 * zoomDir;
        if (scaleZoom > 1.16) zoomDir = -1;
        if (scaleZoom < 1.0) zoomDir = 1;
    } else {
        scaleZoom = 1.0;
    }
    renderStudioFrame();
    requestAnimationFrame(triggerCinemaAnimation);
}
requestAnimationFrame(triggerCinemaAnimation);

document.querySelectorAll('.ratio-btn').forEach(function(btn) {
    btn.onclick = function() {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        ratioType = this.getAttribute('data-ratio');
        adjustCanvasSize();
    };
});

document.getElementById('duration-slider').oninput = function() {
    document.getElementById('duration-val').textContent = this.value;
    playDuration = parseFloat(this.value) * 1000;
    if (storeImages.length > 0) runPlaybackLoop();
};

document.getElementById('video-text-input').oninput = renderStudioFrame;
document.getElementById('text-color-input').oninput = renderStudioFrame;
document.getElementById('color-filter').onchange = renderStudioFrame;

document.getElementById('img-input').onchange = function() {
    var files = this.files;
    if (!files || files.length === 0) return;
    storeImages = [];
    document.getElementById('counter-output').textContent = files.length + " Photos loaded";
    var loaded = 0;
    for (var i = 0; i < files.length; i++) {
        (function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    storeImages.push(img);
                    loaded++;
                    if (loaded === files.length) {
                        activeIdx = 0;
                        scaleZoom = 1.0;
                        renderStudioFrame();
                        runPlaybackLoop();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        })(files[i]);
    }
};

function runPlaybackLoop() {
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(function() {
        if (storeImages.length > 0) {
            var fadeEffect = setInterval(function() {
                currentOpacity -= 0.1;
                if (currentOpacity <= 0.1) {
                    clearInterval(fadeEffect);
                    activeIdx = (activeIdx + 1) % storeImages.length;
                    currentOpacity = 1.0;
                    scaleZoom = 1.0; 
                    renderStudioFrame();
                } else {
                    renderStudioFrame();
                }
            }, 30);
        }
    }, playDuration);
}

// محرك التسجيل المطور لضمان تسجيل كل الصور كاملة بالتتابع بدون أي تجاهل
document.getElementById('export-btn').onclick = function() {
    if (storeImages.length === 0) {
        alert('Please choose photos first!');
        return;
    }
    
    var btnEl = this;
    btnEl.disabled = true;
    btnEl.textContent = "⏳ Exporting Full Video...";

    if (loopTimer) clearInterval(loopTimer);

    var collectedData = [];
    var vCanvas = document.getElementById('video-canvas');
    var vStream = vCanvas.captureStream(30); 
    var recorder = new MediaRecorder(vStream, { mimeType: 'video/webm' });

    recorder.ondataavailable = function(e) { 
        if (e.data && e.data.size > 0) {
            collectedData.push(e.data); 
        }
    };
    
   recorder.onstop = function() {
    var finalMovieBlob = new Blob(collectedData, { type: "video/mp4" });
    
    var fileReaderInstance = new FileReader();
    fileReaderInstance.onloadend = function() {
        var link = document.createElement('a');
        link.href = fileReaderInstance.result;
        link.download = 'ai-studio-movie.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        btnEl.disabled = false;
        btnEl.textContent = "🎬 Enregistrer et exporter la vidéo (MP4)";
        alert('🎉 Video saved completely with all full screen photos!');
        runPlaybackLoop();
    };
    fileReaderInstance.readAsDataURL(finalMovieBlob);
};

        fileReaderInstance.readAsDataURL(finalMovieBlob);
    }
}; // هنا ينتهي السطر 208 القديم بعد التعديل


    recorder.start();
    
    // تقنية التنقل الإجباري التزامني لضمان ظهور وتسجيل كل الصور بداخل الفيديو النهائي
    var recIdx = 0;
    var recTimer = setInterval(function() {
        if (recIdx >= storeImages.length) {
            clearInterval(recTimer);
            recorder.stop();
        } else {
            activeIdx = recIdx;
            renderStudioFrame();
            recIdx++;
        }
    }, playDuration); 
};
