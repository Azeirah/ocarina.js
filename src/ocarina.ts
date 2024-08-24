import {OcarinaClassifier} from "./ocarina-classifier";
import {PitchDetector} from "./pitch-detection";
import {NoteStabilityDetector} from "./Hysteresis";
import {Note} from "./Note";
import {NoteEvent, OcarinaEvent} from "./types";
import {songGrammar, songToNotes} from "./SongGrammar";

const SAMPLING_FREQUENCY_IN_Hz = 100;

type EventNames = 'note-start' | 'note-end' | 'ocarina-start' | 'ocarina-end';

export class Ocarina {
    private pitchListener: PitchDetector;
    private ocarinaDetector: OcarinaClassifier;
    private isPlaying: boolean;
    private currentNote: null | Note;
    private ocarinaPlaying: boolean;
    private noteOnsetDetector: NoteStabilityDetector;

    private startListeners = [];
    private endListeners = [];
    private ocarinaStartListeners = [];
    private ocarinaEndListeners = [];

    private SongListeners = [];


    constructor() {
        this.pitchListener = new PitchDetector();
        this.ocarinaDetector = new OcarinaClassifier();
        this.isPlaying = false;
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
        await this.ocarinaDetector.startListening((result) => {
            if (this.ocarinaPlaying === false && result === true) {
                this.dispatchOcarinaStart();
            } else if (this.ocarinaPlaying === true && result === false) {
                this.dispatchOcarinaEnd();
            }
            this.ocarinaPlaying = result;
        });
        this.startDetection();

        return this;
    }

    private startDetection() {
        setInterval(() => {
            const isOcarina = this.ocarinaPlaying;
            const pitch = this.pitchListener.detectPitch();
            const {isStable, note: noteString} = this.noteOnsetDetector.onFrequencyReceived(pitch);

            if (pitch == null || isOcarina == null || !isStable) return;
            const note = Note.fromNotation(noteString);

            if (isOcarina && !this.isPlaying) {
                this.isPlaying = true;
                this.currentNote = note;
                this.dispatchNoteStart(note);
            } else if (!isOcarina && this.isPlaying) {
                this.isPlaying = false;
                this.dispatchNoteEnd(this.currentNote);
                this.currentNote = null;
            } else if (isOcarina && this.currentNote.toString() !== note.toString()) {
                this.dispatchNoteEnd(this.currentNote);
                this.currentNote = note;
                this.dispatchNoteStart(note);
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
