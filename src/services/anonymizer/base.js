class Anonymizer {
    /**
     * Anonymize a text (transcription) and return anonymized text.
     * @param {string} text - Transcribed text.
     * @returns {Promise<string>} - Anonymized text.
     */
    async anonymizeText(text) {
      throw new Error('anonymizeText() must be implemented by subclass');
    }
  }
  
module.exports = Anonymizer;