const Anonymizer = require('./base');
const huggingface = require('../ai/huggingface');

class HuggingfaceAnonymizer extends Anonymizer {
  async anonymizeText(text) {
    const anonymizedText = await huggingface.anonymizeText(text);
    return anonymizedText;
  }
}
module.exports = HuggingfaceAnonymizer;