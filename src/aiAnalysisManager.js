require('dotenv').config();
const transcriber = require("./services/transcriber/index")
const analyzer = require('./services/analyzer/index');
const anonymizer = require('./services/anonymizer/index');

async function analyzeAudio(filePath, doChecklist, dontChecklist, language) {

    const transcription = await transcriber.getTranscriber().transcribe(filePath);

    const anonymizedText = await anonymizer.getAnonymizer().anonymizeText(transcription);

    const analysisResult = await analyzer.getAnalyzer().analyze(filePath, anonymizedText, { doChecklist, dontChecklist, language });

    return analysisResult;
}

module.exports = {
  analyzeAudio,
};
