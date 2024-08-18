import * as ohm from "ohm-js";
import {Note} from "./Note";
import {NoteStartEvent, Pitch} from "./types";

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

export function createSongListener(
    song: string,
    onSuccess: () => void,
    onPlayedNote: (note: Note, step: number) => void,
    onFailed: (note: Note, step: number) => void
) {
    let match = songGrammar.match(song);
    if (match.failed()) {
        console.error(match.message);
        throw new Error("Your song pattern doesn't match the syntax.");
    }

    const notes = semantics(match).toArray();
    let step = 0;

    window.addEventListener("note-start", function (note: NoteStartEvent) {
        if (notes[step].matches(note.detail.note)) {
            console.log(`Note ${note.detail.note.toString()} matches ${notes[step].toString()}`)
            if (step < notes.length - 1) {
                onPlayedNote(notes[step], step);
                step += 1;
            } else {
                onPlayedNote(notes[step], notes.length - 1);
                onSuccess();
            }
        } else if (step > 0) {
            onFailed(notes[step], step);
            step = 0;
        }
    });
}