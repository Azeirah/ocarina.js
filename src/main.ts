import {Ocarina} from "./ocarina";
import {Note} from "./Note";

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

new Ocarina().listen().then((ocarina) => {
    ocarina.listenForSong(zeldasLullabyLonger, {
        onNotePlayed(note: Note, step: number): void {
            ($zeldasLullaby.children[step] as HTMLSpanElement).style.color = "steelblue";
        },
        onSongFailed(note: Note, step: number): void {
            for (let $note of $zeldasLullaby.children) {
                ($note as HTMLSpanElement).style.color = "inherit";
            }
        },
        onSongPlayed(): void {
            for (let $note of $zeldasLullaby.children) {
                ($note as HTMLSpanElement).style.color = "green";
            }
        }
    });

    ocarina.onNoteStart(({note, timestamp}) => {
        $currentNote.innerHTML = note.toString();
    });

    ocarina.onOcarinaEnd(() => {
        $currentNote.innerHTML = "-";
    });
});

