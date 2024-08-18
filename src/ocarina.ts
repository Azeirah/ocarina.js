import {OcarinaClassifier} from "./ocarina-classifier";
import {PitchDetector} from "./pitch-detection";
import {NoteStabilityDetector} from "./Hysteresis";

export class Ocarina {
    private pitchListener: PitchDetector;
    private ocarinaDetector: OcarinaClassifier;
    private isPlaying: boolean;
    private currentNote: null | string;
    private readonly startTime: number;
    // private songListeners: any[];
    private ocarinaPlaying: boolean;
    private noteOnsetDetector: NoteStabilityDetector;

    constructor() {
        this.pitchListener = new PitchDetector();
        this.ocarinaDetector = new OcarinaClassifier();
        this.isPlaying = false;
        this.currentNote = null;
        this.noteOnsetDetector = new NoteStabilityDetector();
        this.startTime = Date.now();
    }

    async listen() {
        await this.pitchListener.init();
        await this.ocarinaDetector.init("http://localhost/models/ocarina-classifier")
        await this.ocarinaDetector.startListening((result) => {
            this.ocarinaPlaying = result;
        });
        this.startDetection();
    }

    startDetection() {
        setInterval(() => {
            const isOcarina = this.ocarinaPlaying;
            const pitch = this.pitchListener.detectPitch();
            const {isStable, note} = this.noteOnsetDetector.onFrequencyReceived(pitch);

            if (pitch == null || isOcarina == null || !isStable) return;

            if (isOcarina && !this.isPlaying) {
                this.isPlaying = true;
                this.currentNote = note;
                this.dispatchNoteStart(note);
            } else if (!isOcarina && this.isPlaying) {
                this.isPlaying = false;
                this.dispatchNoteEnd(this.currentNote);
                this.currentNote = null;
            } else if (isOcarina && this.currentNote !== note) {
                this.dispatchNoteEnd(this.currentNote);
                this.currentNote = note;
                this.dispatchNoteStart(note);
            }
        }, 10); // Adjust interval as needed
    }

    private dispatchNoteStart(note) {
        const event = new CustomEvent('note-start', {
            detail: {
                type: "NoteStarted",
                note: note,
                timestamp: Date.now() - this.startTime
            }
        });
        window.dispatchEvent(event);
    }

    private dispatchNoteEnd(note) {
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
        if (pitch === 0) return null; // No pitch detected

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
}