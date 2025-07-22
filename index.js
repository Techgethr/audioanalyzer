require('dotenv').config();
const path = require('path');
const chokidar = require('chokidar');
const { getCampaigns, getChecklist, getAudios, getAudioPath } = require('./src/campaignManager');
const { transcribeAudio, analyzeWithGPT } = require('./src/services/ai/openai');
const { analyzeAudio } = require('./src/services/ai/voxtral');
const { saveResult, moveAudioToProcessed, handleFailedAudio } = require('./src/resultWriter');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


async function processAudioFile(campaignName, file, checklist) {
  const filePath = getAudioPath(campaignName, file);
  console.log(`\n-> Procesando: ${file}`);
  try {
    if (process.env.AI_SERVICE === 'voxtral') {
      const gptResult = await analyzeAudio(filePath, checklist);
      console.log('   Análisis Voxtral: OK');
      saveResult(campaignName, file, null, checklist, gptResult);
      moveAudioToProcessed(campaignName, file, filePath);
      console.log(`   ÉXITO: ${file} procesado correctamente.`);
    }
    if (process.env.AI_SERVICE === 'openai') {
      const transcription = await transcribeAudio(filePath);
      console.log('   Transcripción: OK');
        
      const gptResult = await analyzeWithGPT(transcription, checklist);
      console.log('   Análisis GPT: OK');
        
      saveResult(campaignName, file, transcription, checklist, gptResult);
      moveAudioToProcessed(campaignName, file, filePath);
        
      console.log(`   ÉXITO: ${file} procesado correctamente.`);
    }
    
    

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

// Handler para AWS Lambda
exports.handler = async (event) => {
  // Asume que el evento es de tipo S3 Put
  const record = event.Records && event.Records[0];
  if (!record) {
    console.error('No S3 record found in event');
    return { statusCode: 400, body: 'No S3 record found' };
  }

  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  // Se espera que la estructura sea campaigns/[campaign]/audios/[file]
  const parts = key.split('/');
  if (parts.length !== 4 || parts[0] !== 'campaigns' || parts[2] !== 'audios') {
    console.error('S3 object key does not match expected structure: campaigns/[campaign]/audios/[file]');
    return { statusCode: 400, body: 'Invalid S3 object key structure' };
  }
  const campaignName = parts[1];
  const file = parts[3];

  // Descargar el archivo de S3 a /tmp (Lambda)
  const tmpFilePath = `/tmp/${file}`;
  try {
    const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const fs = require('fs');
    fs.writeFileSync(tmpFilePath, s3Object.Body);
  } catch (err) {
    console.error('Error downloading file from S3:', err);
    return { statusCode: 500, body: 'Error downloading file from S3' };
  }

  // Obtener checklist
  let checklist;
  try {
    // Descargar checklist.txt de S3
    const checklistKey = `campaigns/${campaignName}/checklist.txt`;
    const checklistObj = await s3.getObject({ Bucket: bucket, Key: checklistKey }).promise();
    checklist = checklistObj.Body.toString('utf-8').split('\n').map(l => l.trim()).filter(Boolean);
  } catch (err) {
    console.error('Error downloading checklist.txt from S3:', err);
    return { statusCode: 500, body: 'Error downloading checklist.txt from S3' };
  }

  // Procesar el archivo de audio
  try {
    const transcription = await transcribeAudio(tmpFilePath);
    const gptResult = await analyzeWithGPT(transcription, checklist);

    // Guardar resultado en S3 (en processed/)
    const resultText = [
      `Archivo: ${file}`,
      `Campaña: ${campaignName}`,
      '',
      'Transcripción:',
      transcription,
      '',
      'Checklist:',
      ...checklist.map((c, i) => `${i+1}. ${c}`),
      '',
      'Resultado del análisis GPT:',
      gptResult,
      ''
    ].join('\n');
    const resultKey = `processed/${campaignName}/${file.replace(/\.[^/.]+$/, '.txt')}`;
    await s3.putObject({
      Bucket: bucket,
      Key: resultKey,
      Body: resultText,
      ContentType: 'text/plain'
    }).promise();

    // Mover el audio procesado a processed/
    const processedAudioKey = `processed/${campaignName}/${file}`;
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: processedAudioKey
    }).promise();
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();

    return { statusCode: 200, body: 'Audio procesado correctamente' };
  } catch (err) {
    console.error('Error procesando audio:', err);
    // Guardar log de error en S3
    const failedKey = `processed/${campaignName}/failed/${file.replace(/\.[^/.]+$/, '.log')}`;
    const errorText = `Failed to process ${file} for campaign ${campaignName}.\nError: ${err.stack || err.message}\nTimestamp: ${new Date().toISOString()}`;
    await s3.putObject({
      Bucket: bucket,
      Key: failedKey,
      Body: errorText,
      ContentType: 'text/plain'
    }).promise();
    // Mover el audio a failed
    const failedAudioKey = `processed/${campaignName}/failed/${file}`;
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: failedAudioKey
    }).promise();
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return { statusCode: 500, body: 'Error procesando audio' };
  }
};

main(); 