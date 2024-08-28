import * as speechCommands from '@tensorflow-models/speech-commands';
import * as tf from '@tensorflow/tfjs';
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-wasm";

export class OcarinaClassifier {
    private recognizer: speechCommands.SpeechCommandRecognizer | null = null;

    async init(modelPath: string) {
        const checkpointURL = `${modelPath}/model.json`;
        const metadataURL = `${modelPath}/metadata.json`;

        this.recognizer = speechCommands.create(
            'BROWSER_FFT',
            undefined,
            checkpointURL,
            metadataURL,
        );
        await tf.ready();

        await this.recognizer.ensureModelLoaded();
    }

    async startListening(
        callback: (result: boolean) => void,
        probabilityThreshold = 0.75,
        overlapFactor = 0.1
    ) {
        if (!this.recognizer) {
            throw new Error('Model not initialized. Call init() first.');
        }

        await this.recognizer.listen(
            // @ts-ignore
            (result) => {
                const probability = result.scores[1] as number;
                callback(probability > 0.5);
            },
            {
                includeSpectrogram: false,
                probabilityThreshold,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor,
            }
        );
    }

    async stopListening() {
        if (this.recognizer) {
            await this.recognizer.stopListening();
        }
    }
}