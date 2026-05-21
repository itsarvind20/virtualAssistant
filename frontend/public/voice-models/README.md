# Offline Voice Models

Put optional offline voice assets here.

## Porcupine

- Create a Picovoice access key in the Picovoice Console.
- Train a custom wake word for the assistant name, for example `Robin`.
- Download the keyword for target platform `Web (WASM)`.
- Save it here as `assistant.ppn`, or update `VITE_PORCUPINE_KEYWORD_PATH`.
- Also add the Porcupine parameter model `.pv` as `porcupine_params.pv`, or update `VITE_PORCUPINE_MODEL_PATH`.

Porcupine cannot dynamically understand every user-created assistant name without a matching `.ppn` keyword model. If no Porcupine model is configured, the app falls back to transcript-based wake phrase detection.

## Vosk

- Download a Vosk browser-compatible model archive.
- Save it here, for example `vosk-model-small-en-us-0.15.tar.gz`.
- Set `VITE_VOSK_MODEL_PATH=/voice-models/vosk-model-small-en-us-0.15.tar.gz`.

Vosk models are large and run locally in the browser, so the first load can take time.
