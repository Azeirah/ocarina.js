export class PitchDetector {
    private audioContext: AudioContext;
    private readonly analyser: AnalyserNode;
    private readonly bufferLength: number;
    readonly dataArray: Float32Array;

    constructor() {
        // @ts-ignore
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Float32Array(this.bufferLength);
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            console.log("Microphone connected successfully");
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    }

    detectPitch() {
        this.analyser.getFloatTimeDomainData(this.dataArray);
        const ac = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);
        console.log(ac);
        return ac === -1 ? null : ac;
    }

    autoCorrelate(buffer, sampleRate) {
        const SIZE = buffer.length;
        let bestOffset = -1;
        let bestCorrelation = 0;
        let rms = 0;
        let foundGoodCorrelation = false;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) return -1;

        let lastCorrelation = 1;
        for (let offset = 0; offset < SIZE / 2; offset++) {
            let correlation = 0;

            for (let i = 0; i < SIZE / 2; i++) {
                correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
            }
            correlation = 1 - (correlation / (SIZE / 2));

            if ((correlation > 0.9) && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true;
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestOffset = offset;
                }
            } else if (foundGoodCorrelation) {
                let shift = (correlationShift(buffer, bestOffset, SIZE));
                return sampleRate / bestOffset;
            }
            lastCorrelation = correlation;
        }

        if (bestCorrelation > 0.01) {
            let shift = (correlationShift(buffer, bestOffset, SIZE));
            return sampleRate / bestOffset;
        }
        return -1;
    }
}

function correlationShift(buffer, bestOffset, SIZE) {
    let shift = 0;
    const maxShift = 10;
    for (let i = 0; i < maxShift; i++) {
        if (((bestOffset + i) < SIZE / 2) && (buffer[bestOffset + i] > buffer[bestOffset])) {
            shift = i;
            break;
        }
    }
    return shift;
}
