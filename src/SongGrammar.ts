import * as ohm from "ohm-js";
import {Note} from "./Note";
import {Pitch} from "./types";

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

export const songGrammar = ohm.grammar(song);
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

export function songToNotes(song: string): Note[] {
    let match = songGrammar.match(song);
    if (match.failed()) {
        console.error(match.message);
        throw new Error("Your song pattern doesn't match the syntax.");
    }

    return semantics(match).toArray();
}
