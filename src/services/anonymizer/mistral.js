const Anonymizer = require('./base');
const mistral = require('../ai/mistral');

class MistralAnonymizer extends Anonymizer {
  async anonymizeText(text) {
    const anonymizedText = await mistral.anonymizeText(text);
    return anonymizedText;
  }
}
module.exports = MistralAnonymizer;