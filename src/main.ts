import {Ocarina} from "./ocarina";
import {createSongListener} from "./SongListener";
import {NoteStartEvent} from "./types";

console.log("Hoi!")

const $currentNote = document.createElement("span")
$currentNote.innerHTML = "-";
document.body.appendChild($currentNote);

let zeldasLullaby = "D F C D F C"; // not actually epona's song!! git gud idiot >_>

// const $zeldasLullaby = document.createElement("div");
// for (let i of zeldasLullaby) {
//     const $note = document.createElement("span");
//     $note.innerText = i;
//     $zeldasLullaby.appendChild($note);
// }

const ocarina = new Ocarina();
ocarina.listen().then(() => {
    console.log(`listening for zelda's lullaby ${zeldasLullaby}`);

    createSongListener(zeldasLullaby, function () {
        console.log("song finished")
    }, function (note) {

    }, function (note, step) {

    });

    window.addEventListener("note-start", function (e: NoteStartEvent) {
        $currentNote.innerHTML = e.detail.note.toString();
    });
});

