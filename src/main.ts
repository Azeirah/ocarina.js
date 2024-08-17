import {Ocarina} from "./ocarina";

console.log("Hoi!")

const $note = document.createElement("span")
$note.innerHTML = "-";
document.body.appendChild($note);


const ocarina = new Ocarina();
ocarina.listen().then(() => {
    console.log("listening")
    window.addEventListener("note-start", function (event) {
        //@ts-ignore
        $note.innerHTML = event.detail.note;
    });

    window.addEventListener("note-end", function () {
        console.log("note end detected");
    });
});

