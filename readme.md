# 🎼 Ocarina.js

Your Ocarina is an input device.

## Usage

### High-level: Listen for a song

```ts
const zeldasLullaby = "D F C D F C";

new Ocarina().listen().then((ocarina) => {
  ocarina.listenForSong(zeldasLullaby, 
  {
    onNotePlayed(note: Note, step: number) {
      // Fired every time you play the correct next note.
      // this song has 6 notes. Equaling 6 steps.
    },
    onSongFailed(note: Note, step: number) {
      // Fired when you make a mistake
    },
    onSongPlayed() {
      // When the song is completed
    }
  });
}
```

### Low-level: The full API

#### Create an ocarina instance, and wait for it to load

```ts
new Ocarina.listen().then((ocarina) => {
  // The ocarina is loaded, and ready to be used.
});

```

#### Ocarina detection events

```ts
ocarina.onOcarinaStart(({timestamp}) => {
  // Detected ocarina playing   
});
ocarina.onOcarinaEnd(({timestamp}) => {
  // Ocarina playing has ended
});
```

#### Listen for notes

```ts
ocarina.onNoteStart(({note, timestamp}) => {
  // note has been played.
  note.toString(); // "A4" "F#7" etc
});

ocarina.onNoteEnd(({note, timestamp}) => {

});
```

#### The `Note` object

```ts
/**
 * Notes consist of
 *   1. A pitch
 *      "C" "D" "E" "F" "G" "A" "B"
 *   2. Optionally, an Accidental
        "C#" "A#" "A♯" "E♭", etc...
 *      Flat = "♭" | "b"
 *      Sharp = "♯" | "#"
 *   3. Optionally, an Octave
 *      "A4" "F7" "C#3"
 */
const A4 = Note.fromNotation("A4");
const A3 = Note.fromNotation("A3");
const A = Note.fromNotation("A");
const D = Note.fromNotation("D");

// You can check whether notes match.
A.match(A4); // true, because A4 is an A.
A4.match(A); // false, because A is not as specific as A4
A3.match(A4); // false, because the octaves differ
D.match(A); // false, D is not an A.

// Enharmonic notes are currently not supported :(
const Csharp = Note.fromNotation("C♯");
const Dflat = Note.fromNotation("D♭");

Csharp.matches(Dflat); // false, but should be true.

// You can transform them back into a string again.
A4.toString(); // "A4"
A.toString(); // "A"

// Note, the string you use to make the note may be different from the toString() output
const Dflat = Note.fromNotation("D♭");
Dflat.toString(); // "Db"
```
