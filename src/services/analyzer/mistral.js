const Analyzer = require('./base');
const mistral = require('../ai/mistral');

class MistralAnalyzer extends Analyzer {
  async analyze(filePath, text, options) {
    const gptResult = await mistral.analyzeDirectFromAudio(filePath, text, options.doChecklist, options.dontChecklist, options.language);
    return gptResult;
  }
}
module.exports = MistralAnalyzer;