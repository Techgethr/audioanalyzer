const Transcriber = require('./base');
const { transcribeAudio } = require('../ai/huggingface');

class HuggingfaceTranscriber extends Transcriber {
  async transcribe(filePath) {
    const transcription = await transcribeAudio(filePath);
    return transcription;
  }
}

module.exports = HuggingfaceTranscriber;