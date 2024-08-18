import * as ohm from "ohm-js";

// this should be imported somehow but I can't be bothered to do that right now :(
const song = `
OcarinaSong {
  Exp = Note+

  Note = NaturalNote | AccidentalNote

  NaturalNote = NaturalPitch Octave?
  AccidentalNote = AccidentalPitch Accidental? Octave?

  NaturalPitch = "E" | "B"
  AccidentalPitch = "C" | "D" | "F" | "G" | "A"

  Octave = digit

  Flat = "♭" | "b"
  Sharp = "♯" | "#"
  Accidental = Flat | Sharp
}`;

type Pitch = "C" | "D" | "E" | "F" | "G" | "A" | "B";

class Note {
    constructor(private pitch: Pitch, private accidental: "flat" | "sharp" | null, private octave: string | null) {
    }

    matches(note: string): boolean {
        // Split the input note string into its components
        const regex = /^([A-G])(#|b)?(\d)?$/;
        const match = note.match(regex);

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

        console.groupEnd();
        return true;
    }
}

const songGrammar = ohm.grammar(song);
const semantics = songGrammar.createSemantics().addOperation('toArray', {
    Exp: function (note) {
        return note.toArray();
    },
    NaturalNote: function (pitch, octave) {
        return new Note(pitch.sourceString as Pitch, null, octave.sourceString || null);
    },
    AccidentalNote: function (pitch, accidental, octave) {
        let accident = null;
        if (accidental.sourceString === "b" || accidental.sourceString === "♭") {
            accident = "flat";
        }
        if (accidental.sourceString === "#" || accidental.sourceString === "♯") {
            accident = "sharp";
        }
        return new Note(pitch.sourceString as Pitch, accident, octave.sourceString || null);
    },
    _iter(...children) {
        return children.map((n) => n.toArray());
    }
});

export function createSongListener(song: string, onSuccess: () => void, onPlayedNote: (note: Note) => void) {
    let match = songGrammar.match(song);
    if (match.failed()) {
        console.error(match.message);
        throw new Error("Your song pattern doesn't match the syntax.");
    }

    const notes = semantics(match).toArray();
    let step = 0;

    window.addEventListener("note-start", function (note) {
        // @ts-ignore
        if (notes[step].matches(note.detail.note)) {
            if (step < notes.length - 1) {
                onPlayedNote(notes[step]);
                step += 1;
            } else  {
                onSuccess();
            }
        }
    });
}