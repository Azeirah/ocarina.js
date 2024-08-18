import {Note} from "./Note";

export type Pitch = "C" | "D" | "E" | "F" | "G" | "A" | "B";
export type Accidental = "flat" | "sharp";

interface NoteEventDetail {
    note: Note;
    timestamp: number;
}

interface OcarinaEventDetail {
    timestamp: number;
}

export interface NoteStartEvent extends CustomEvent {
    detail: NoteEventDetail;
}

export interface NoteEndEvent extends CustomEvent {
    detail: NoteEventDetail;
}

export interface OcarinaStartEvent extends CustomEvent {
    detail: OcarinaEventDetail;
}

export interface OcarinaEndEvent extends CustomEvent {
    detail: OcarinaEventDetail;
}
