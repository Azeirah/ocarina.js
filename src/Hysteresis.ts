export class NoteStabilityDetector {
    private static readonly HISTORY_SIZE = 5;
    private static readonly FREQUENCY_DELTA_THRESHOLD = 3; // Hz
    private static readonly STABILITY_THRESHOLD = 2; // Hz

    private history: number[] = [];
    private lastStableNote: string | null = null;

    constructor() {}

    private static frequencyToNote(frequency: number): string {
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const a4 = 440;
        const c0 = a4 * Math.pow(2, -4.75);
        const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / c0));
        const octave = Math.floor(halfStepsBelowMiddleC / 12);
        const noteIndex = (halfStepsBelowMiddleC % 12 + 12) % 12;
        return noteNames[noteIndex] + octave;
    }

    private isFrequencyStable(): boolean {
        if (this.history.length < NoteStabilityDetector.HISTORY_SIZE) return false;
        const recentFrequencies = this.history.slice(-NoteStabilityDetector.HISTORY_SIZE);
        const maxDiff = Math.max(...recentFrequencies) - Math.min(...recentFrequencies);
        return maxDiff <= NoteStabilityDetector.STABILITY_THRESHOLD;
    }

    onFrequencyReceived(frequency: number): { isStable: boolean; note: string | null } {
        this.history.push(frequency);
        if (this.history.length > NoteStabilityDetector.HISTORY_SIZE) {
            this.history.shift();
        }

        const isStable = this.isFrequencyStable();
        let currentNote = null;

        if (isStable) {
            currentNote = NoteStabilityDetector.frequencyToNote(frequency);
            this.lastStableNote = currentNote;
        } else if (this.history.length >= 2) {
            const previousFrequency = this.history[this.history.length - 2];
            const frequencyDelta = Math.abs(frequency - previousFrequency);
            if (frequencyDelta > NoteStabilityDetector.FREQUENCY_DELTA_THRESHOLD) {
                // Frequency changed significantly, reset last stable note
                this.lastStableNote = null;
            }
        }

        return {
            isStable,
            note: isStable ? currentNote : this.lastStableNote
        };
    }
}

// Usage example
// const detector = new NoteStabilityDetector();

// function onFrequencyReceived(frequency: number) {
//     const result = detector.onFrequencyReceived(frequency);
//     console.log(`Frequency: ${frequency.toFixed(2)} Hz, Stable: ${result.isStable}, Note: ${result.note || 'N/A'}`);
//     return result;
// }

// Simulate some frequency data
// const testFrequencies = [
//     440, 441, 442, 443, 444, 445, 445, 445, 445, 445, // A4 start and stabilize
//     445, 445, 445, 445, 445, 445, 445, 445, 445, 445, // A4 continues
//     450, 460, 470, 480, 490, 500, 510, 520, 523, 523, // Transition to C5
//     523, 523, 523, 523, 523, 523, 523, 523, 523, 523, // C5 continues
//     520, 510, 500, 490, 480, 470, 460, 450, 440, 440, // Back to A4
//     440, 440, 440, 440, 440, 440, 440, 440, 440, 440, // A4 continues
//     30, 20, 10, 5, 2, 1, 1, 1, 1, 1 // Note end
// ];
//
// testFrequencies.forEach(freq => onFrequencyReceived(freq));