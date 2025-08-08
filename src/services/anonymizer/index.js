function getAnonymizer() {
    const name = process.env.AI_ANALYZER_SERVICE;
    switch (name) {
      case 'openai':
        return new (require('./openai'))();
      case 'mistral':
        return new (require('./mistral'))();
      case 'huggingface':
        return new (require('./huggingface'))();
      default:
        throw new Error(`Unknown anonymizer: ${name}`);
    }
}

module.exports = { getAnonymizer };