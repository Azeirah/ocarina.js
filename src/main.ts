import {Ocarina} from "./ocarina";
import {createSongListener} from "./SongListener";
import {NoteStartEvent} from "./types";

console.log("Hoi!")

const container = document.createElement("div");

const $currentNote = document.createElement("span")
$currentNote.innerHTML = "-";
container.appendChild($currentNote);

let zeldasLullaby = "D F C D F C"; // not actually epona's song!! git gud idiot >_>

container.appendChild(document.createElement("br"));
container.appendChild(document.createElement("br"));

const $zeldasLullaby = document.createElement("p");
for (let i of zeldasLullaby) {
    const $note = document.createElement("span");
    $note.innerText = i;
    $zeldasLullaby.appendChild($note);
}
container.appendChild($zeldasLullaby);
document.body.appendChild(container);

const ocarina = new Ocarina();
ocarina.listen().then(() => {
    createSongListener(zeldasLullaby, function () {
        for (let $note of $zeldasLullaby.children) {
            // @ts-ignore
            $note.style.color = "green";
        }
    }, function (note, step) {
        // @ts-ignore
        $zeldasLullaby.children[step * 2].style.color = "steelblue";
    }, function (note, step) {
        for (let $note of $zeldasLullaby.children) {
            // @ts-ignore
            $note.style.color = "inherit";
        }
    });

    window.addEventListener("note-start", function (e: NoteStartEvent) {
        $currentNote.innerHTML = e.detail.note.toString();
    });
});

