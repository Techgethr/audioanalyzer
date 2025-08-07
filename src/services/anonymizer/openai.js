const Anonymizer = require('./base');
const openai = require('../ai/openai');

class OpenAIAnonymizer extends Anonymizer {
  async anonymizeText(text) {
    const anonymizedText = await openai.anonymizeText(text);
    return anonymizedText;
  }
}
module.exports = OpenAIAnonymizer;