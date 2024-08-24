import {OcarinaClassifier} from "./ocarina-classifier";
import {PitchDetector} from "./pitch-detection";
import {NoteStabilityDetector} from "./Hysteresis";
import {Note} from "./Note";
import {NoteEvent, OcarinaEvent} from "./types";
import {songGrammar, songToNotes} from "./SongGrammar";

const SAMPLING_FREQUENCY_IN_Hz = 40;

export class Ocarina {
    private pitchListener: PitchDetector;
    private ocarinaDetector: OcarinaClassifier;
    private currentNote: null | Note;
    private ocarinaPlaying: boolean = false;
    private noteOnsetDetector: NoteStabilityDetector;

    private startListeners = [];
    private endListeners = [];
    private ocarinaStartListeners = [];
    private ocarinaEndListeners = [];


    constructor() {
        this.pitchListener = new PitchDetector();
        this.ocarinaDetector = new OcarinaClassifier();
        this.currentNote = null;
        this.noteOnsetDetector = new NoteStabilityDetector();
    }

    listenForSong(
        song: string,
        {onSongPlayed, onNotePlayed, onSongFailed}: {
            onSongPlayed?: () => void,
            onNotePlayed?: (note: Note, step: number) => void,
            onSongFailed?: (note: Note, step: number) => void
        }
    ) {
        const notes = songToNotes(song);
        let step = 1;

        this.onNoteStart(function ({note}) {
            if (notes[step].matches(note)) {
                if (step < notes.length - 1) {
                    onNotePlayed(notes[step], step);
                    step += 1;
                } else {
                    onNotePlayed(notes[step], notes.length - 1);
                    onSongPlayed();
                }
            } else if (step > 0) {
                onSongFailed(notes[step], step);
                step = 0;
            }
        });
    }

    onOcarinaStart(fn: (e: OcarinaEvent) => void) {
        this.ocarinaStartListeners.push(fn);
        return this;
    }

    onOcarinaEnd(fn: (e: OcarinaEvent) => void) {
        this.ocarinaEndListeners.push(fn);
        return this;
    }

    onNoteStart(fn: (e: NoteEvent) => void) {
        this.startListeners.push(fn);
        return this;
    }

    onNoteEnd(fn: (e: NoteEvent) => void) {
        this.endListeners.push(fn);
        return this;
    }

    async listen() {
        await this.pitchListener.init();
        await this.ocarinaDetector.init("http://localhost/models/ocarina-2pc")
        await this.ocarinaDetector.startListening((current) => {
            const prev = this.ocarinaPlaying;
            if (!prev && current) {
                this.dispatchOcarinaStart();
            }
            if (prev && !current) {
                this.dispatchOcarinaEnd();
            }

            this.ocarinaPlaying = current;
        });
        this.startDetection();

        return this;
    }

    private startDetection() {
        setInterval(() => {
            const pitch = this.pitchListener.detectPitch();
            const {isStable, note: noteString} = this.noteOnsetDetector.onFrequencyReceived(pitch);

            if (pitch == null && this.currentNote) {
                this.dispatchNoteEnd(this.currentNote);
                this.currentNote = null;
                return;
            }

            if (!isStable || pitch == null) return;
            const note = Note.fromNotation(noteString);

            if (this.ocarinaPlaying) {
                if (this.currentNote?.toString() !== note.toString()) {
                    if (this.currentNote) {
                        this.dispatchNoteEnd(this.currentNote);
                    }
                    this.dispatchNoteStart(note);
                    this.currentNote = note;
                }
            }
        }, 1_000 / SAMPLING_FREQUENCY_IN_Hz);
    }

    private dispatchNoteStart(note: Note) {
        for (let listener of this.startListeners) {
            listener({note, timestamp: +Date.now()});
        }
    }

    private dispatchNoteEnd(note: Note) {
        for (let listener of this.endListeners) {
            listener({note, timestamp: +Date.now()});
        }
    }

    private dispatchOcarinaStart() {
        for (let listener of this.ocarinaStartListeners) {
            listener({timestamp: +Date.now()});
        }
    }

    private dispatchOcarinaEnd() {
        for (let listener of this.ocarinaEndListeners) {
            listener({timestamp: +Date.now()});
        }
    }
}
