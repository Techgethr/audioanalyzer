const Analyzer = require('./base');
const huggingface = require('../ai/huggingface');

class HuggingfaceAnalyzer extends Analyzer {
  async analyze(filePath, text, options) {
    const gptResult = await huggingface.analyzeTranscription(text, options.doChecklist, options.dontChecklist, options.language);
    return gptResult;
  }
}
module.exports = HuggingfaceAnalyzer;