function getAnalyzer() {
    const name = process.env.AI_ANALYZER_SERVICE;
    switch (name) {
      case 'openai':
        return new (require('./openai'))();
      case 'mistral':
        return new (require('./mistral'))();
      default:
        throw new Error(`Unknown analyzer: ${name}`);
    }
}

module.exports = { getAnalyzer };