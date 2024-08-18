import {Ocarina} from "./ocarina";
import {createSongListener} from "./SongListener";

console.log("Hoi!")

const $note = document.createElement("span")
$note.innerHTML = "-";
document.body.appendChild($note);


const ocarina = new Ocarina();
ocarina.listen().then(() => {
    console.log("listening for epona's song")
    let song = "D F C D F C"; // not actually epona's song!! git gud idiot >_>
    console.log(song)

    createSongListener(song, function () {
        console.log("song finished")
    }, function (note) {
        console.log("played one note");
    });

    window.addEventListener("note-start", function (e) {
        // @ts-ignore
        $note.innerHTML = e.detail.note;
    });
});

