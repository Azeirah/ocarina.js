import {OcarinaClassifier} from "./ocarina-classifier";
import {PitchDetector} from "./pitch-detection";
import {NoteStabilityDetector} from "./Hysteresis";
import {Note} from "./Note";

const SAMPLING_FREQUENCY_IN_Hz = 100;

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
        await this.ocarinaDetector.init("http://localhost/models/ocarina-2pc")
        await this.ocarinaDetector.startListening((result) => {
            if (this.ocarinaPlaying === false && result === true) {
                this.dispatchOcarinaStart();
            } else if (this.ocarinaPlaying === true && result === false) {
                this.dispatchOcarinaEnd();
            }
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
        }, 1_000 / SAMPLING_FREQUENCY_IN_Hz);
    }

    private dispatchNoteStart(note) {
        const event = new CustomEvent('note-start', {
            detail: {
                note: Note.fromNotation(note),
                timestamp: +Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    private dispatchNoteEnd(note) {
        const event = new CustomEvent('note-end', {
            detail: {
                note: Note.fromNotation(note),
                timestamp: +Date.now(),
            }
        });
        window.dispatchEvent(event);
    }

    private dispatchOcarinaStart() {
        const event = new CustomEvent('ocarina-start', {
            detail: {
                timestamp: +Date.now()
            }
        });
        window.dispatchEvent(event);
    }

    private dispatchOcarinaEnd() {
        const event = new CustomEvent('ocarina-end', {
            detail: {
                timestamp: +Date.now()
            }
        });
        window.dispatchEvent(event);
    }
}
