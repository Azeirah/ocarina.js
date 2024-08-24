const container = document.createElement("div");

const $currentNote = document.createElement("span")
$currentNote.innerHTML = "-";
container.appendChild($currentNote);

let zeldasLullaby = "D F C D F C";
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
        onNotePlayed(note, step) {
            $zeldasLullaby.children[step].style.color = "steelblue";
        }, onSongFailed(note, step) {
            for (let $note of $zeldasLullaby.children) {
                $note.style.color = "inherit";
            }
        }, onSongPlayed() {
            for (let $note of $zeldasLullaby.children) {
                $note.style.color = "green";
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

