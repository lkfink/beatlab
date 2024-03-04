document.addEventListener("DOMContentLoaded", function() {
    generatePlot();
});  // Generate plot when page loads

document.getElementById("generateButton").addEventListener("click", function() {
    generatePlot();
}); // Re-generate plot when user clicks button

// Plotting function 
function generatePlot() {
    // Parse user inputs 
    const samplingFreq = 1000;
    const impulseIOI = parseInt(document.getElementById("impulseIOI").value);
    const weight = parseInt(document.getElementById("weight").value);
    const motor = document.getElementById("motor").checked;

    const impulseTrain = generateImpulseTrain(impulseIOI, weight);
    const prf = generatePRF(samplingFreq, motor);
    const predPup = convolve(impulseTrain, prf);

    plotResults(impulseTrain, prf, predPup, samplingFreq);
}

// Create 10 second long impulse train
function generateImpulseTrain(impulseIOI, weight) {
    const impulseTrain = new Array(10000).fill(0);
    for (let i = 0; i < impulseTrain.length; i += impulseIOI) {
        impulseTrain[i] = 1;
    }
    for (let i = 0; i < impulseTrain.length; i += impulseIOI * weight) {
        impulseTrain[i] = 2;
    }
    return impulseTrain;
}

// PRF function 
function generatePRF(Fs, motor) {
    let tmax, tlim;

    // Latency of pupil response maximum. 
    // Different depending on whether motor response involved (i.e., button press)
    if (motor) {
        tmax = 930; //from Hoeks & Levelt (1993)
        tlim = 2500;
    } else {
        tmax = 512; // McCloy et al. 2016
        tlim = 1300; // See McCloy Fig. 1a
    }

    // Shape parameter of Erlang gamma distribution
    // (proposed to be the number of signaling steps in neural pathway 
    // transmitting attentional pulse to pupil)
    const n = 10.1;

    // Time
    const tscale = [];
    for (let i = 0; i <= tlim; i += 1000 / Fs) {
        tscale.push(i);
    }

    // PRF
    const PRF = tscale.map(t => Math.pow(t, n) * Math.exp(-10.1 * t / tmax));
    return PRF;
    // NOTE would need to divide by scaling factor if want to compare motor and non-motor
    // NOTE end of function approaches infinity and does not return to zero. That may be a problem for some operations. But setting last point
    // to 0 would introduce a small bump. 
}

// Convolution (signal, kernel)
const convolve = (vec1, vec2) => {
    if (vec1.length === 0 || vec2.length === 0) {
        throw new Error('Vectors can not be empty!');
    }
    const volume = vec1;
    const kernel = vec2;
    const convVec = new Float32Array(volume.length + kernel.length);

    let i = 0;
    for (let j = 0; j < kernel.length; ++j) {
        convVec[j] = volume[0] * kernel[j];
    }

    for (i = 1; i < volume.length; ++i) {
        for (let j = 0; j < kernel.length; ++j) {
            convVec[i + j] += volume[i] * kernel[j];
        }
    }

    return convVec;
};

// Plot all results
function plotResults(impulseTrain, prf, predPup, samplingFreq) {
    plotSingleResult("impulseCanvas", impulseTrain, samplingFreq);
    plotSingleResult("prfCanvas", prf, samplingFreq);
    plotSingleResult("predPupCanvas", predPup, samplingFreq);
}

function plotSingleResult(canvasId, data, samplingFreq) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Canvas context not supported.");
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    const scale = canvas.width / 10000; // Adjust scale for 10 seconds
    const timeInterval = 1000; // Interval for time ticks in milliseconds

    const maxHeight = Math.max(...data); // Get the maximum value of the data
    const padding = 0.1 * maxHeight; // Add 10% padding to the top of the plot

    for (let i = 0; i < data.length; i++) {
        const xPos = i * scale - 0.01 * scale; // Adjust x-coordinate
        const yPos = canvas.height / 2 - ((data[i] + padding) / (maxHeight + padding)) * (canvas.height / 2); // Adjusted y-coordinate with padding
        ctx.lineTo(xPos, yPos);

        // Draw time ticks
        if (i % timeInterval === 0) {
            const timeLabel = (i / samplingFreq).toFixed(1) + "s"; // Append "s" for seconds
            ctx.fillText(timeLabel, xPos, canvas.height - 5);
        }
    }

    ctx.strokeStyle = 'black';
    ctx.stroke();
}





