const folderInput = document.getElementById("folderInput");
const btnStart = document.getElementById("btnStart");
const wasteTypeEl = document.getElementById("waste-type");
const originalImage = document.getElementById("originalImage");
const processedCanvas = document.getElementById("processedCanvas");
const hiddenCanvas = document.getElementById("hiddenCanvas");

let imageFiles = [], currentIndex = -1, autoTimer = null;

// Guide Controls
document.getElementById("btnHowToUseTop").onclick = () => document.getElementById("howToUseModal").classList.remove("hidden");
document.getElementById("btnCloseModal").onclick = () => document.getElementById("howToUseModal").classList.add("hidden");

folderInput.onchange = (e) => { imageFiles = Array.from(e.target.files).filter(f => f.type.startsWith("image/")); currentIndex = -1; };

btnStart.onclick = () => {
    if(!imageFiles.length) return alert("Select a folder first!");
    currentIndex = -1;
    analyzeNext();
    autoTimer = setInterval(analyzeNext, 10000); // 10s Presentation Pace
};

function analyzeNext() {
    currentIndex++;
    if(currentIndex >= imageFiles.length) return clearInterval(autoTimer);
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => { originalImage.src = e.target.result; performSpectralAnalysis(img); };
        img.src = e.target.result;
    };
    reader.readAsDataURL(imageFiles[currentIndex]);
}

function performSpectralAnalysis(img) {
    const w = 400, h = 300;
    hiddenCanvas.width = w; hiddenCanvas.height = h;
    const hctx = hiddenCanvas.getContext("2d");
    hctx.drawImage(img, 0, 0, w, h);
    const data = hctx.getImageData(0, 0, w, h).data;
    processedCanvas.width = w; processedCanvas.height = h;
    const ctx = processedCanvas.getContext("2d");
    const out = ctx.createImageData(w, h);
    let totalPollution = 0;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        const saturation = (Math.max(data[i], data[i+1], data[i+2]) - Math.min(data[i], data[i+1], data[i+2])) / 255;
        const index = saturation * (255 - brightness); // Proxy Formula
        totalPollution += index;
        const t = index / 255;
        if (t < 0.3) { out.data[i]=0; out.data[i+1]=150; out.data[i+2]=255; }
        else if (t < 0.6) { out.data[i]=255; out.data[i+1]=255; out.data[i+2]=0; }
        else { out.data[i]=255; out.data[i+1]=0; out.data[i+2]=0; }
        out.data[i+3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    updateUI((totalPollution / (w * h)) / 255);
}

function updateUI(val) {
    let waste, ph, turb, do2, remedy, plan, risk, color;
    window.speechSynthesis.cancel();
    if (val < 0.25) {
        waste = "None (Clear)"; ph = "7.0"; turb = "Low"; do2 = "High"; color = "#64ffda";
        remedy = "Water is safe."; plan = "Safe for drinking and livestock."; risk = "Stable ecosystem.";
    } else if (val < 0.5) {
        waste = "Sewage / Organic"; ph = "6.2"; turb = "Medium"; do2 = "Low"; color = "#ffcc00";
        remedy = "Use sand filtration."; plan = "Boil before use."; risk = "Risk of Algal Blooms.";
    } else {
        waste = "Industrial Chemical"; ph = "4.5"; turb = "High"; do2 = "None"; color = "#ff4b5c";
        remedy = "Add Sunnamu (Lime)."; plan = "DANGER: High toxic levels."; risk = "Dead Zone formation.";
    }
    wasteTypeEl.innerText = waste; wasteTypeEl.style.color = color;
    document.getElementById("iot-ph").innerText = ph; document.getElementById("iot-turb").innerText = turb;
    document.getElementById("iot-do").innerText = do2; document.getElementById("remedyText").innerText = remedy;
    document.getElementById("suggestionBox").innerText = plan; document.getElementById("consequenceBox").innerText = risk;
    const speech = new SpeechSynthesisUtterance(`${waste} detected. ${plan}`);
    speech.rate = 0.9; window.speechSynthesis.speak(speech); // Clear English Voice
}