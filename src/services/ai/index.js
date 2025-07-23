require('dotenv').config();
const { analyzewithGPT } = require('./openai');
const { analyzeDirectFromAudio, analyzeWithTranscription } = require('./voxtral');

async function analyzeAudio(filePath, checklist) {
    if (process.env.AI_SERVICE == 'voxtral') {
        if(process.env.MISTRAL_INCLUDE_TRANSCRIPTION === 'true') {
            const gptResult = await analyzeWithTranscription(filePath, checklist);
            console.log('   Análisis Voxtral: OK');
            return gptResult;
        }
        const gptResult = await analyzeDirectFromAudio(filePath, checklist);
        console.log('   Análisis Voxtral: OK');
        return gptResult;
    }
    if (process.env.AI_SERVICE == 'openai') {
        const gptResult = await analyzewithGPT(filePath, checklist);
        console.log('   Análisis GPT: OK');
        return gptResult;
    }
    throw new Error('AI service not configured or recognized.');
}

module.exports = {
  analyzeAudio,
};
