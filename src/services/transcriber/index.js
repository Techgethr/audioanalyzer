function getTranscriber() {
    const name = process.env.AI_TRANSCRIBER_SERVICE;
    switch (name) {
      case 'mistral':
        return new (require('./mistral'))();
      case 'openai':
        return new (require('./openai'))();
      default:
        throw new Error(`Unknown transcriber: ${name}`);
    }
}

module.exports = { getTranscriber };