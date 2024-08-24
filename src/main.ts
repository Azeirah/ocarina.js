import {Ocarina} from "./ocarina";
import {createSongListener} from "./SongListener";
import {NoteStartEvent} from "./types";

const container = document.createElement("div");

const $currentNote = document.createElement("span")
$currentNote.innerHTML = "-";
container.appendChild($currentNote);

let zeldasLullaby = "D F C D F C"; // not actually epona's song!! git gud idiot >_>
let zeldasLullabyLonger = "D F C A# C D F C";

container.appendChild(document.createElement("br"));
container.appendChild(document.createElement("br"));

const $zeldasLullaby = document.createElement("p");
for (let i of zeldasLullabyLonger.split(" ")) {
    const $note = document.createElement("span");
    $note.innerText = i;
    $zeldasLullaby.appendChild($note);
}
container.appendChild($zeldasLullaby);
document.body.appendChild(container);

const ocarina = new Ocarina();
ocarina.listen().then(() => {
    createSongListener(zeldasLullabyLonger, function () {
        for (let $note of $zeldasLullaby.children) {
            // @ts-ignore
            $note.style.color = "green";
        }
    }, function (note, step) {
        // @ts-ignore
        $zeldasLullaby.children[step].style.color = "steelblue";
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

