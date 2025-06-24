require('dotenv').config();
const { getCampaigns, getChecklist, getAudios, getAudioPath } = require('./src/campaignManager');
const { transcribeAudio, analyzeWithGPT } = require('./src/openaiService');
const { saveResult, moveAudioToProcessed, handleFailedAudio } = require('./src/resultWriter');


// Procesar audios de una campaña
async function processCampaign(campaignName) {
  console.log(`\n--- Iniciando campaña: ${campaignName} ---`);
  let checklist;
  try {
    checklist = getChecklist(campaignName);
  } catch (err) {
    console.error(`Error al iniciar campaña ${campaignName}: ${err.message}`);
    return;
  }
  
  const audios = getAudios(campaignName);
  if (audios.length === 0) {
    console.log(`No se encontraron audios para la campaña ${campaignName}.`);
    return;
  }

  console.log(`Se procesarán ${audios.length} audios.`);

  for (const file of audios) {
    const filePath = getAudioPath(campaignName, file);
    console.log(`\n-> Procesando: ${file}`);
    try {
      const transcription = await transcribeAudio(filePath);
      console.log('   Transcripción: OK');
      
      const gptResult = await analyzeWithGPT(transcription, checklist);
      console.log('   Análisis GPT: OK');
      
      saveResult(campaignName, file, transcription, checklist, gptResult);
      moveAudioToProcessed(campaignName, file, filePath);
      
      console.log(`   ÉXITO: ${file} procesado correctamente.`);

    } catch (err) {
      console.error(`   ERROR al procesar ${file}: ${err.message}`);
      handleFailedAudio(campaignName, file, filePath, err);
    }
  }
}

// Procesar todas las campañas o una específica
async function main() {
  const campaignArg = process.argv[2];
  if (campaignArg) {
    await processCampaign(campaignArg);
  } else {
    const campaigns = getCampaigns();
    if (campaigns.length === 0) {
        console.log("No se encontraron campañas en la carpeta 'campaigns'.");
        return;
    }
    for (const campaignName of campaigns) {
      await processCampaign(campaignName);
    }
  }
  console.log("\n--- Todas las campañas han sido procesadas ---");
}

main(); 