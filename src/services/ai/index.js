require('dotenv').config();
const { analyzeWithGPT } = require('./openai');
const { analyzeDirectFromAudio, analyzeWithTranscription } = require('./voxtral');

async function analyzeAudio(filePath, doChecklist, dontChecklist, language) {
    if (process.env.AI_SERVICE == 'voxtral') {
        if(process.env.MISTRAL_INCLUDE_TRANSCRIPTION === 'true') {
            const gptResult = await analyzeWithTranscription(filePath, doChecklist, dontChecklist, language);
            console.log('   Analysis Voxtral: OK');
            return gptResult;
        }
        const gptResult = await analyzeDirectFromAudio(filePath, doChecklist, dontChecklist, language);
        console.log('   Analysis Voxtral: OK');
        return gptResult;
    }
    if (process.env.AI_SERVICE == 'openai') {
        const gptResult = await analyzeWithGPT(filePath, doChecklist, dontChecklist, language);
        console.log('   Analysis GPT: OK');
        return gptResult;
    }
    throw new Error('AI service not configured or recognized.');
}

module.exports = {
  analyzeAudio,
};
