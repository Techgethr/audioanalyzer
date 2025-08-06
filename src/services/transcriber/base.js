class Transcriber {
    /**
     * Transcribe an audio file and return the text.
     * @param {string} filePath - Path to the audio file.
     * @returns {Promise<string>} - Transcription text.
     */
    async transcribe(filePath) {
      throw new Error('transcribe() must be implemented by subclass');
    }
  }
  
module.exports = Transcriber;