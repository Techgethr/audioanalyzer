const Transcriber = require('./base');
const { transcribeAudio } = require('../ai/openai');

class OpenAITranscriber extends Transcriber {
  async transcribe(filePath) {
    const transcription = await transcribeAudio(filePath);
    return transcription;
  }
}

module.exports = OpenAITranscriber;