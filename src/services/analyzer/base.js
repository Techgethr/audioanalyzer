class Analyzer {
    /**
     * Analyze a text (transcription) and return analysis results.
     * @param {string} filePath - Path to the audio file.
     * @param {string} text - Transcribed text.
     * @param {object} options - Additional options (checklists, language, etc.).
     * @returns {Promise<object>} - Analysis results.
     */
    async analyze(filePath, text, options) {
      throw new Error('analyze() must be implemented by subclass');
    }
  }
  
module.exports = Analyzer;