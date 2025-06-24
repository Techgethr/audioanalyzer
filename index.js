require('dotenv').config();
const path = require('path');
const chokidar = require('chokidar');
const { getCampaigns, getChecklist, getAudios, getAudioPath } = require('./src/campaignManager');
const { transcribeAudio, analyzeWithGPT } = require('./src/openaiService');
const { saveResult, moveAudioToProcessed, handleFailedAudio } = require('./src/resultWriter');
const fs = require('fs');

async function processAudioFile(campaignName, file, checklist) {
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

async function runOnce(campaignArg) {
  const campaignsToProcess = campaignArg ? [campaignArg] : getCampaigns();
  
  if (campaignsToProcess.length === 0) {
    console.log(campaignArg ? `No se encontró la campaña '${campaignArg}'.` : "No se encontraron campañas.");
    return;
  }

  for (const campaignName of campaignsToProcess) {
    console.log(`\n--- Iniciando campaña: ${campaignName} ---`);
    let checklist;
    try {
      checklist = getChecklist(campaignName);
    } catch (err) {
      console.error(`Error al iniciar campaña ${campaignName}: ${err.message}`);
      continue;
    }
    
    const audios = getAudios(campaignName);
    if (audios.length === 0) {
      console.log(`No se encontraron audios para la campaña ${campaignName}.`);
      continue;
    }

    console.log(`Se procesarán ${audios.length} audios.`);
    for (const file of audios) {
      await processAudioFile(campaignName, file, checklist);
    }
  }
  console.log("\n--- Todas las campañas han sido procesadas ---");
}

function runWatcher(campaignArg) {
    let watchPath;
    if (campaignArg) {
        // Vigilar solo una campaña específica
        const audiosDir = path.join(__dirname, 'campaigns', campaignArg, 'audios');
        if (!fs.existsSync(audiosDir)) {
            console.log(`La carpeta '${audiosDir}' no existe. Creándola...`);
            fs.mkdirSync(audiosDir, { recursive: true });
        }
        watchPath = audiosDir;
        console.log(`Modo de vigilancia activado SOLO para la campaña '${campaignArg}'. Esperando nuevos audios en ${watchPath} ...`);
    } else {
        // Vigilar todas las campañas
        const campaignsDir = path.join(__dirname, 'campaigns');
        if (!fs.existsSync(campaignsDir)) {
            console.log("La carpeta 'campaigns' no existe. Creándola...");
            fs.mkdirSync(campaignsDir);
        }
        watchPath = campaignsDir;
        console.log('Modo de vigilancia activado. Esperando nuevos audios en campaigns/[campaign]/audios/ ...');
    }

    const watcher = chokidar.watch(watchPath, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    });

    watcher.on('add', async (filePath) => {
        const absolutePath = path.resolve(filePath);
        let campaignName, file;
        if (campaignArg) {
            // Solo una campaña
            campaignName = campaignArg;
            file = path.basename(filePath);
        } else {
            // Todas las campañas
            const campaignsDir = path.join(__dirname, 'campaigns');
            const relativePath = path.relative(campaignsDir, absolutePath);
            const parts = relativePath.split(path.sep);
            if (parts.length !== 3 || parts[1] !== 'audios') {
                return;
            }
            campaignName = parts[0];
            file = parts[2];
        }
        console.log(`\n-> Nuevo audio detectado: ${file} en campaña ${campaignName}`);
        try {
            const checklist = getChecklist(campaignName);
            await processAudioFile(campaignName, file, checklist);
        } catch(err) {
            console.error(`Error al procesar nuevo audio en modo vigilancia: ${err.message}`);
            handleFailedAudio(campaignName, file, absolutePath, err);
        }
    });
    
    watcher.on('error', error => console.error(`Error en el vigilante: ${error}`));
}

function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');
  const campaignArg = args.find(arg => !arg.startsWith('--'));

  if (watchMode) {
    runWatcher(campaignArg);
  } else {
    runOnce(campaignArg);
  }
}

main(); 