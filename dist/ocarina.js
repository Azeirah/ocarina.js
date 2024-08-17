(function (speechCommands) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var speechCommands__namespace = /*#__PURE__*/_interopNamespaceDefault(speechCommands);

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    class OcarinaClassifier {
        constructor() {
            this.recognizer = null;
            this.labels = [];
        }
        init(modelPath) {
            return __awaiter(this, void 0, void 0, function* () {
                const checkpointURL = `${modelPath}/model.json`;
                const metadataURL = `${modelPath}/metadata.json`;
                this.recognizer = speechCommands__namespace.create('BROWSER_FFT', undefined, checkpointURL, metadataURL);
                yield this.recognizer.ensureModelLoaded();
                this.labels = this.recognizer.wordLabels();
                console.log('Model loaded successfully');
            });
        }
        startListening(callback_1) {
            return __awaiter(this, arguments, void 0, function* (callback, probabilityThreshold = 0.75, overlapFactor = 0.5) {
                if (!this.recognizer) {
                    throw new Error('Model not initialized. Call init() first.');
                }
                yield this.recognizer.listen(
                // @ts-ignore
                (result) => {
                    const probability = result.scores[1];
                    callback(probability > 0.5);
                }, {
                    includeSpectrogram: true,
                    probabilityThreshold,
                    invokeCallbackOnNoiseAndUnknown: true,
                    overlapFactor,
                });
            });
        }
        stopListening() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.recognizer) {
                    this.recognizer.stopListening();
                }
            });
        }
    }

    class PitchDetector {
        constructor() {
            // @ts-ignore
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Float32Array(this.bufferLength);
        }
        init() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const stream = yield navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = this.audioContext.createMediaStreamSource(stream);
                    source.connect(this.analyser);
                    console.log("Microphone connected successfully");
                }
                catch (error) {
                    console.error("Error accessing microphone:", error);
                }
            });
        }
        detectPitch() {
            this.analyser.getFloatTimeDomainData(this.dataArray);
            const ac = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);
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
            if (rms < 0.01)
                return -1;
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
                }
                else if (foundGoodCorrelation) {
                    (correlationShift(buffer, bestOffset, SIZE));
                    return sampleRate / bestOffset;
                }
                lastCorrelation = correlation;
            }
            if (bestCorrelation > 0.01) {
                (correlationShift(buffer, bestOffset, SIZE));
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

    class NoteStabilityDetector {
        constructor() {
            this.history = [];
            this.lastStableNote = null;
        }
        static frequencyToNote(frequency) {
            const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const a4 = 440;
            const c0 = a4 * Math.pow(2, -4.75);
            const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / c0));
            const octave = Math.floor(halfStepsBelowMiddleC / 12);
            const noteIndex = (halfStepsBelowMiddleC % 12 + 12) % 12;
            return noteNames[noteIndex] + octave;
        }
        isFrequencyStable() {
            if (this.history.length < NoteStabilityDetector.HISTORY_SIZE)
                return false;
            const recentFrequencies = this.history.slice(-NoteStabilityDetector.HISTORY_SIZE);
            const maxDiff = Math.max(...recentFrequencies) - Math.min(...recentFrequencies);
            return maxDiff <= NoteStabilityDetector.STABILITY_THRESHOLD;
        }
        onFrequencyReceived(frequency) {
            this.history.push(frequency);
            if (this.history.length > NoteStabilityDetector.HISTORY_SIZE) {
                this.history.shift();
            }
            const isStable = this.isFrequencyStable();
            let currentNote = null;
            if (isStable) {
                currentNote = NoteStabilityDetector.frequencyToNote(frequency);
                this.lastStableNote = currentNote;
            }
            else if (this.history.length >= 2) {
                const previousFrequency = this.history[this.history.length - 2];
                const frequencyDelta = Math.abs(frequency - previousFrequency);
                if (frequencyDelta > NoteStabilityDetector.FREQUENCY_DELTA_THRESHOLD) {
                    // Frequency changed significantly, reset last stable note
                    this.lastStableNote = null;
                }
            }
            return {
                isStable,
                note: isStable ? currentNote : this.lastStableNote
            };
        }
    }
    NoteStabilityDetector.HISTORY_SIZE = 5;
    NoteStabilityDetector.FREQUENCY_DELTA_THRESHOLD = 3; // Hz
    NoteStabilityDetector.STABILITY_THRESHOLD = 2; // Hz
    // Usage example
    // const detector = new NoteStabilityDetector();
    // function onFrequencyReceived(frequency: number) {
    //     const result = detector.onFrequencyReceived(frequency);
    //     console.log(`Frequency: ${frequency.toFixed(2)} Hz, Stable: ${result.isStable}, Note: ${result.note || 'N/A'}`);
    //     return result;
    // }
    // Simulate some frequency data
    // const testFrequencies = [
    //     440, 441, 442, 443, 444, 445, 445, 445, 445, 445, // A4 start and stabilize
    //     445, 445, 445, 445, 445, 445, 445, 445, 445, 445, // A4 continues
    //     450, 460, 470, 480, 490, 500, 510, 520, 523, 523, // Transition to C5
    //     523, 523, 523, 523, 523, 523, 523, 523, 523, 523, // C5 continues
    //     520, 510, 500, 490, 480, 470, 460, 450, 440, 440, // Back to A4
    //     440, 440, 440, 440, 440, 440, 440, 440, 440, 440, // A4 continues
    //     30, 20, 10, 5, 2, 1, 1, 1, 1, 1 // Note end
    // ];
    //
    // testFrequencies.forEach(freq => onFrequencyReceived(freq));

    class Ocarina {
        constructor() {
            this.pitchListener = new PitchDetector();
            this.ocarinaDetector = new OcarinaClassifier();
            this.isPlaying = false;
            this.currentNote = null;
            this.noteOnsetDetector = new NoteStabilityDetector();
            this.startTime = Date.now();
        }
        listen() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.pitchListener.init();
                yield this.ocarinaDetector.init("http://localhost/models/ocarina-classifier");
                yield this.ocarinaDetector.startListening((result) => {
                    this.ocarinaPlaying = result;
                });
                this.startDetection();
            });
        }
        startDetection() {
            setInterval(() => {
                const isOcarina = this.ocarinaPlaying;
                const pitch = this.pitchListener.detectPitch();
                const { isStable, note } = this.noteOnsetDetector.onFrequencyReceived(pitch);
                if (pitch == null || isOcarina == null || !isStable)
                    return;
                if (isOcarina && !this.isPlaying) {
                    this.isPlaying = true;
                    this.currentNote = note;
                    this.dispatchNoteStart(note);
                }
                else if (!isOcarina && this.isPlaying) {
                    this.isPlaying = false;
                    this.dispatchNoteEnd(this.currentNote);
                    this.currentNote = null;
                }
                else if (isOcarina && this.currentNote !== note) {
                    this.dispatchNoteEnd(this.currentNote);
                    this.currentNote = note;
                    this.dispatchNoteStart(note);
                }
            }, 10); // Adjust interval as needed
        }
        dispatchNoteStart(note) {
            const event = new CustomEvent('note-start', {
                detail: {
                    type: "NoteStarted",
                    note: note,
                    timestamp: Date.now() - this.startTime
                }
            });
            window.dispatchEvent(event);
        }
        dispatchNoteEnd(note) {
            const endTimestamp = Date.now() - this.startTime;
            const event = new CustomEvent('note-end', {
                detail: {
                    type: "NoteEnded",
                    note: note,
                    // startTimestamp: this.currentNoteStartTime,
                    endTimestamp: endTimestamp,
                    // duration: endTimestamp - this.currentNoteStartTime
                }
            });
            window.dispatchEvent(event);
            // this.checkSongs(note);
        }
        pitchToNote(pitch) {
            if (pitch === 0)
                return null; // No pitch detected
            const A4 = 440; // A4 note frequency in Hz
            const C0 = A4 * Math.pow(2, -4.75); // C0 frequency (lowest note)
            const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            // Calculate number of half steps from C0
            const halfSteps = Math.round(12 * Math.log2(pitch / C0));
            // Calculate octave and note index
            const octave = Math.floor(halfSteps / 12);
            const noteIndex = halfSteps % 12;
            // Construct note name
            return noteNames[noteIndex] + octave;
        }
        // createSongListener(pattern, callback) {
        //     this.songListeners.push({pattern: pattern.split(' '), callback});
        // }
        // checkSongs(endedNote) {
        //     this.songListeners.forEach(listener => {
        //         if (this.recentNotes.join(' ') === listener.pattern.join(' ')) {
        //             listener.callback();
        //             this.dispatchSongEvent('song-ended', listener.pattern);
        //         }
        //     });
        // }
        dispatchSongEvent(eventName, pattern) {
            const event = new CustomEvent(eventName, {
                detail: {
                    pattern: pattern,
                    timestamp: Date.now() - this.startTime
                }
            });
            window.dispatchEvent(event);
        }
    }

    console.log("Hoi!");
    const $note = document.createElement("span");
    $note.innerHTML = "-";
    document.body.appendChild($note);
    const ocarina = new Ocarina();
    ocarina.listen().then(() => {
        console.log("listening");
        window.addEventListener("note-start", function (event) {
            //@ts-ignore
            $note.innerHTML = event.detail.note;
        });
        window.addEventListener("note-end", function () {
            console.log("note end detected");
        });
    });

})(speechCommands);
