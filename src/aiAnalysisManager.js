require('dotenv').config();
const transcriber = require("./services/transcriber/index")
const analyzer = require('./services/analyzer/index');

async function analyzeAudio(filePath, doChecklist, dontChecklist, language) {

    const transcription = await transcriber.getTranscriber().transcribe(filePath);

    const analysisResult = await analyzer.getAnalyzer().analyze(filePath, transcription, { doChecklist, dontChecklist, language });

    return analysisResult;
}

module.exports = {
  analyzeAudio,
};
