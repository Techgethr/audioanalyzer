const Analyzer = require('./base');
const openai = require('../ai/openai');

class OpenAIAnalyzer extends Analyzer {
  async analyze(filePath, text, options) {
    const gptResult = await openai.analyzeWithGPT(text, options.doChecklist, options.dontChecklist, options.language);
    return gptResult;
  }
}
module.exports = OpenAIAnalyzer;