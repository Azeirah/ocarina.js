import {Accidental, Pitch} from "./types";

export class Note {
    static fromNotation(noteNotation: string) {
        const regex = /^([A-G])([#b])?(\d)?$/;
        const match = noteNotation.match(regex);

        if (!match) {
            return null;
        }

        const [, notePitch, noteAccidental, noteOctave] = match;
        return new Note(notePitch as Pitch, parseAccidental(noteAccidental), noteOctave ?? null);
    }

    constructor(private pitch: Pitch, private accidental: "flat" | "sharp" | null, private octave: string | null) {
    }

    matches(note: Note): boolean {
        // Split the input note string into its components
        const regex = /^([A-G])(#|b)?(\d)?$/;
        const match = note.toString().match(regex);

        if (!match) {
            return false;
        }

        const [, notePitch, noteAccidental, noteOctave] = match;

        // Check if the pitch matches
        if (notePitch !== this.pitch) {
            return false;
        }

        // Check if the accidental matches
        if (this.accidental === null && noteAccidental !== undefined) {
            return false;
        }
        if (this.accidental === "sharp" && noteAccidental !== "#") {
            return false;
        }
        if (this.accidental === "flat" && noteAccidental !== "b") {
            return false;
        }

        // Check if the octave matches (if specified)
        if (this.octave !== null) {
            if (noteOctave === undefined) {
                return false;
            }
            if (noteOctave !== this.octave.toString()) {
                return false;
            }
        }

        return true;
    }

    toString() {
        const pitch = this.pitch;
        let accidental = "";
        if (this.accidental === "flat") accidental = "b";
        if (this.accidental === "sharp") accidental = "#";
        const octave = this.octave ? this.octave : "";

        return pitch + accidental + octave;
    }
}

export function parseAccidental(accidental: string |null): null | Accidental {
    if (accidental === null) return null;
    if (accidental === "b" || accidental === "♭") {
        return "flat";
    }
    if (accidental === "#" || accidental === "♯") {
        return "sharp";
    }
}

// @ts-ignore
window.Note = Note;