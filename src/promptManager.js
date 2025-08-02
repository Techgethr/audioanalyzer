

function getSystemMessage() {
    var systemMessage = `You are an assistant who evaluates different aspects of quality in a conversation. Your tasks are:
            1. Analyze the content of the conversation based on a checklist.
            2. Identify emotional tones and relevant emotions in the participants.
            3. Assess the communication tone for professionalism and empathy.
            4. Evaluate the technical quality of the audio.
            5. Provide a detailed breakdown of strengths and areas for improvement.
            6. Provide an overall compliance score based on the previous analyses.
            `;
    return systemMessage;
}

function getLanguage(language) {
    var languageSelection = "";
    if(language == "en") {
        languageSelection = "English";
    }
    if(language == "es") {
        languageSelection = "Spanish";
    }
    if(language == "fr") {
        languageSelection = "French";
    }
    if(language == "pt") {
        languageSelection = "Portuguese";
    }
    if(language == "de") {
        languageSelection = "German";
    }
    if(language == "it") {
        languageSelection = "Italian";
    }
    if(language == "nl") {
        languageSelection = "Dutch";
    }
    if(language == "hi") {
        languageSelection = "Hindi";
    }
    if(language == "") {
        throw new Error("Invalid language");
    }
    return languageSelection;
}

function getPrompt(language, doChecklist, dontChecklist, transcription) {
    const includeTranscription = transcription && transcription.trim() != "" && transcription != undefined && transcription != null;
    var languageSelection = getLanguage(language);
    var promptStart = includeTranscription ? `Given the following call transcript: "${transcription} of a conversation"`: "Given this call audio of a conversation";
    
    var prompt = `${promptStart}, and the following checklist of content that should be present in the conversation:
            ${doChecklist.map((c, i) => `${i+1}. ${c}`).join('\n')}. 
            
            And the following checklist of content that should not be present in the conversation:
            ${dontChecklist.map((c, i) => `${i+1}. ${c}`).join('\n')}. 
            
            Perform the following analyses:

            1. Checklist compliance: Check if each of the following points that is present in the audio. Briefly justify your answer for each item.

            2. Emotional Analysis: Detect if any of the participants exhibit relevant emotions (e.g., anger, happiness, frustration).

            3. Communication Tone Assessment: Was the tone of voice professional, empathetic, and appropriate for the context?

            4. Technical audio quality: Evaluate whether the audio is free of interference, echoes, or external noise.

            5. Compliance summary: Provide an overall score for compliance with the expected standards in the conversation, based on the previous points.

            DON'T overanalyze; only respond to what is present in the ${includeTranscription ?"transcription":"audio"}.
            If something is not present in the ${includeTranscription ?"transcription":"audio"}, then don't say it is. 
            If you analyze a transcript, the audio quality analysis does not apply.
            If you detect any personal information (PII) or any sensitive information (e.g., credit card numbers, social security numbers, etc.), do not include it in the analysis and hide it in the JSON response (use [SENSITIVE] to hide it).

            Submit your answers and justifications in ${languageSelection}.
            
            Please provide your analysis in the following JSON format:
            {
                "complianceScore": number, // Score from 0-10 based on the standard communication scoring system
                "overallFeedback": string,   // 2-5 sentence of the compliance summary
                "emotionalAnalysis": {       // Analysis of emotional tones
                    "predominantEmotion": string, // Name of the predominant emotion
                    "justification": string // Justification of the emotional analysis
                },
                "communicationTone": {       // Assessment of communication tone 
                    "professionalTone": boolean, // Whether the tone was professional (true or false)
                    "empatheticTone": boolean,   // Whether the tone was empathetic (true or false)
                    "appropriateTone": boolean,   // Whether the tone was appropriate (true or false)
                    "justification": string       // Justification for the tone assessment
                },
                "technicalQuality": {         // Assessment of technical audio quality (if possible)
                    "adequateQuality": boolean, // Whether the audio quality was adequate (true or false)
                    "justification": string      // Justification for the technical quality assessment
                },
                "doChecklistResults": {         // Results of the content checklist
                    "1": { property:string, "result": boolean, "justification": string }, // Property of the checklist, result and justification for each checklist item
                    "2": { property:string, "result": boolean, "justification": string },
                    // ...
                },
                "dontChecklistResults": {         // Results of the content checklist
                    "1": { property:string, "result": boolean, "justification": string }, // Property of the checklist, result and justification for each checklist item
                    "2": { property:string, "result": boolean, "justification": string },
                    // ...
                },
                "strengths": [string],       // List of communication strengths demonstrated (if existing)
                "improvementAreas": [string] // List of areas where communication could be improved (if existing)
            }`;

    return prompt;
}


function getInstructions(language, doChecklist, dontChecklist, transcription) {
    if(language == "" || language == undefined || language == null) {
        language = "es";
    }
    const systemMessage = getSystemMessage();
    const prompt = getPrompt(language, doChecklist, dontChecklist, transcription);

    return {prompt: prompt, systemMessage: systemMessage };
}

module.exports = {
  getInstructions
};
