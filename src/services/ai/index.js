require('dotenv').config();
const { analyzewithGPT } = require('./openai');
const { analyzeDirectFromAudio } = require('./voxtral');

async function analyzeAudio(filePath, checklist) {
    if (process.env.AI_SERVICE == 'voxtral') {
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
