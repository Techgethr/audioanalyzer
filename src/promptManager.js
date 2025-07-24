

function getSystemMessage(language) {
    var systemMessage = "";
    if(language == "es") {
        systemMessage = "Eres un asistente que evalúa llamadas de call center.";
    }
    if(language == "en") {
        systemMessage = "You are an assistant who evaluates call center calls.";
    }
    return systemMessage;
}

function getPrompt(language, checklist, transcription) {
    var prompt = "";
    const includeTranscription = transcription && transcription.trim() != "" && transcription != undefined && transcription != null;

    if(language == "es") {
        prompt = includeTranscription ? 
            `Dada la siguiente transcripción de una llamada, responde SÍ o NO 
            para cada uno de los siguientes puntos, y justifica brevemente tu 
            respuesta:\n\nChecklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\n
            Transcripción:\n${transcription}\n\nResponde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...` 
            : 
            `Dado este audio de una llamada, responde SÍ o NO para cada uno de 
            los siguientes puntos que deberían estar presentes en el audio, si están, 
            es SÍ, de lo contrario es NO, y justifica brevemente tu respuesta:\n\n
            Checklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\n
            Responde en el formato:\n1. SÍ/NO - Justificación\n2. SÍ/NO - Justificación\n...`;
    }
    if(language == "en") {
        prompt = includeTranscription ? 
            `Given the following call transcript, answer YES or NO to each 
            of the following points, and briefly justify your answer:\n\n
            Checklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\n
            Transcription:\n${transcription}\n\nPlease respond in the format:\n1. YES/NO - Justification\n2. YES/NO - Justification\n...` 
            : 
            `Given this audio recording of a call, answer YES or NO for each 
            of the following points that should be present in the audio. 
            If present, it is YES, otherwise it is NO, and briefly justify your answer.:\n\n
            Checklist:\n${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}\n\n
            Please respond in the format:\n1. YES/NO - Justification\n2. YES/NO - Justification\n...`;
    }

    return prompt;
}


function getInstructions(language, checklist, transcription) {
    if(language == "" || language == undefined || language == null) {
        language = "es";
    }
    const systemMessage = getSystemMessage(language);
    const prompt = getPrompt(language, checklist, transcription);

    return {prompt: prompt, systemMessage: systemMessage };
}

module.exports = {
  getInstructions
};
