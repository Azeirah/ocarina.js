import {Note} from "./Note";

export type Pitch = "C" | "D" | "E" | "F" | "G" | "A" | "B";
export type Accidental = "flat" | "sharp";

export type NoteEvent = {
    note: Note;
    timestamp: number;
}

export type OcarinaEvent = {
    timestamp: number;
}
