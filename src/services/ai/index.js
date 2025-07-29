require('dotenv').config();
const { analyzeWithGPT } = require('./openai');
const { analyzeDirectFromAudio, analyzeWithTranscription } = require('./voxtral');

async function analyzeAudio(filePath, checklist, language) {
    if (process.env.AI_SERVICE == 'voxtral') {
        if(process.env.MISTRAL_INCLUDE_TRANSCRIPTION === 'true') {
            const gptResult = await analyzeWithTranscription(filePath, checklist, language);
            console.log('   Analysis Voxtral: OK');
            return gptResult;
        }
        const gptResult = await analyzeDirectFromAudio(filePath, checklist, language);
        console.log('   Analysis Voxtral: OK');
        return gptResult;
    }
    if (process.env.AI_SERVICE == 'openai') {
        const gptResult = await analyzeWithGPT(filePath, checklist, language);
        console.log('   Analysis GPT: OK');
        return gptResult;
    }
    throw new Error('AI service not configured or recognized.');
}

module.exports = {
  analyzeAudio,
};
