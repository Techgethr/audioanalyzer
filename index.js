require('dotenv').config();
const { getCampaigns, getChecklist, getAudios, getAudioPath } = require('./src/campaignManager');
const { transcribeAudio, analyzeWithGPT } = require('./src/openaiService');
const { saveResult, moveAudioToProcessed } = require('./src/resultWriter');


// Procesar audios de una campaña
async function processCampaign(campaignName) {
  let checklist;
  try {
    checklist = getChecklist(campaignName);
  } catch (err) {
    console.error(err.message);
    return;
  }
  const audios = getAudios(campaignName);
  if (audios.length === 0) {
    console.log(`No hay archivos de audio en la campaña ${campaignName}`);
    return;
  }
  for (const file of audios) {
    const filePath = getAudioPath(campaignName, file);
    console.log(`\n[${campaignName}] Analizando: ${file}`);
    const transcription = await transcribeAudio(filePath);
    if (!transcription) continue;
    console.log('Transcripción:', transcription.slice(0, 200) + (transcription.length > 200 ? '...' : ''));
    const gptResult = await analyzeWithGPT(transcription, checklist);
    console.log('Resultado del análisis GPT:');
    console.log(gptResult);
    saveResult(campaignName, file, transcription, checklist, gptResult);
    moveAudioToProcessed(campaignName, file, filePath);
  }
}

// Procesar todas las campañas o una específica
async function main() {
  const campaignArg = process.argv[2];
  if (campaignArg) {
    await processCampaign(campaignArg);
  } else {
    const campaigns = getCampaigns();
    for (const campaignName of campaigns) {
      await processCampaign(campaignName);
    }
  }
}

main(); 