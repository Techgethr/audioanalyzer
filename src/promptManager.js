

function getSystemMessage(language) {
    var systemMessage = "";
    if(language == "es") {
        systemMessage = "Eres un asistente que evalúa distintos aspectos de calidad en una conversación.";
    }
    if(language == "en") {
        systemMessage = "You are an assistant who evaluates different aspects of quality in a conversation.";
    }
    return systemMessage;
}

function getPrompt(language, checklist, transcription) {
    var prompt = "";
    const includeTranscription = transcription && transcription.trim() != "" && transcription != undefined && transcription != null;
    var promptStart = "";
    if(language == "es") {
        promptStart = includeTranscription ? `Dada la siguiente transcripción de una llamada: "${transcription}"`: "Dado este audio de una llamada";
        prompt = `${promptStart}, realiza los siguientes análisis:

            1. **Checklist de contenido**  
            Responde SÍ o NO para cada uno de los siguientes puntos que deberían estar presentes en el audio. Justifica brevemente tu respuesta en cada ítem:  
            Checklist:  
            ${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}

            Formato de respuesta:  
            1. SÍ/NO – Justificación  
            2. SÍ/NO – Justificación  
            ...

            2. **Análisis emocional**  
            Detecta si hay presencia de emociones relevantes (ej: enojo, felicidad, frustración) en alguno de los participantes.  
            Ejemplo de respuesta:  
            - Emoción predominante: [nombre de emoción]  
            - Justificación: [detalle de tono, velocidad, palabras clave]

            3. **Evaluación del tono comunicacional**  
            ¿El tono de voz fue profesional, empático y adecuado para el contexto?  
            Ejemplo:  
            - Tono profesional: SÍ/NO – Justificación  
            - Tono empático: SÍ/NO – Justificación

            4. **Calidad técnica del audio**  
            Evalúa si el audio está libre de interferencias, ecos o ruidos externos.  
            Ejemplo:  
            - Calidad técnica adecuada: SÍ/NO – Justificación

            5. **Resumen de cumplimiento**  
            Entrega una puntuación general del cumplimiento de los estándares esperados en la conversación, basada en los puntos anteriores.

            Responde de forma estructurada y clara.`;
    }
    if(language == "en") {
        promptStart = includeTranscription ? `Given the following call transcript: "${transcription}"`: "Given this call audio";
        prompt = `${promptStart}, perform the following analyses:

            1. **Content Checklist**
            Answer YES or NO for each of the following points that should be present in the audio. Briefly justify your answer for each item:
            Checklist:
            ${checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}

            Answer Format:
            1. YES/NO – Justification
            2. YES/NO – Justification
            ...

            2. **Emotional Analysis**
            Detect if any of the participants exhibit relevant emotions (e.g., anger, happiness, frustration).

            Example Response:
            - Predominant emotion: [name of emotion]
            - Justification: [details of tone, speed, keywords]

            3. **Communication Tone Assessment**
            Was the tone of voice professional, empathetic, and appropriate for the context?
            Example:
            - Professional tone: YES/NO – Justification
            - Empathetic tone: YES/NO – Justification

            4. **Technical audio quality**
            Evaluate whether the audio is free of interference, echoes, or external noise.
            Example:
            - Adequate technical quality: YES/NO – Justification

            5. **Compliance summary**
            Provide an overall score for compliance with the expected standards in the conversation, based on the previous points.

            Respond in a structured and clear manner.`;
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
