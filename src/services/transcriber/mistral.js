const Transcriber = require('./base');
const { transcribeAudio } = require('../ai/mistral');

class MistralTranscriber extends Transcriber {
  async transcribe(filePath) {
    const transcription = await transcribeAudio(filePath);
    return transcription;
  }
}

module.exports = MistralTranscriber;