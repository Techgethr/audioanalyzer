# Sonaly

## Index
- [Demo](#demo)
- [Description](#description)
- [Features](#features)
- [Available models](#available-models)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Database](#database)
- [Usage Modes](#usage-modes)
- [Error Handling](#error-handling)
- [Checklist](#checklist)
- [Requirements](#requirements)
- [AWS Lambda Usage with S3](#aws-lambda-usage-with-s3)
- [To Do](#to-do)

## Demo

Check how works in this demo: [YouTube](https://youtu.be/ySX8JlW-0g8).

[![Demo](https://img.youtube.com/vi/ySX8JlW-0g8/0.jpg)](https://youtu.be/ySX8JlW-0g8)


# Description

App for analyzing conversation audio for various campaigns (such as support, sales, etc.) and verifying whether it meets defined requirements, such as script tracking (checklist), comments or phrases that should not be used, tone, audio quality, and more, using analytics and AI services.

## Features
- Support for multiple campaigns, each with its own checklist and audios.
- **Two execution modes**: single run (processes and exits) or continuous (watches for new audios).
- Transcribe audio using different models (OpenAI Whisper, Mistral Voxtral or any model compatible with OpenAI SDK)
- Analyze audio for detail and justification (following a predefined conversation script, emotional and tone analysis, audio quality, and compliance summary).
- Process using different AI models or services (for example: use OpenAI Whisper for transcription and Mistral for anonymizer and analysis).
- Inserts the results in a structured manner into a database for further analysis.
- **Data protection**: Does not include personal information (PII) or sensitive data (e.g., credit card numbers, social security numbers, etc.) in the analysis and hides this information in the JSON response (use [SENSITIVE] to hide it). For this, it uses AI after the transcription to send the anonymized text for the analysis.
- **Language support**: Supports multiple languages (Spanish, English, French, Portuguese, German, Italian, Dutch, Hindi).
- **Failure recovery**: Moves problematic audios to a `failed` folder for manual review, without stopping the process.
- Modular and scalable structure.

## Available models

- **OpenAI** and any OpenAI SDK compatible model: For transcription and analysis.
- **Whisper**: For transcription.
- **Any OpenAI SDK compatible model**: For transcription and analysis.
- **Any Whisper compatible model**: For transcription using OpenAI SDK.
- **Mistral**:  For transcription and analysis.
- **Any Mistral API compatible model**: For transcription and analysis.
- **Huggingface**: For transcription and analysis, with any available provider.

## Project Structure

```
audioanalyzer/
├── index.js
├── src/
│   ├── aiAnalysisManager.js
│   ├── campaignManager.js
│   ├── promptManager.js
│   ├── resultWriter.js
│   └── services
│       └── ai
│       └── analyzer
│       └── anonymizer
│       └── database
│       └── transcriber
├── package.json
├── .env
├── README.md
├── campaigns/
│   └── [campaign_name]/
│       ├── checklist.txt
│       └── audios/
└── processed/
    └── [campaign_name]/
        ├── [processed_audio]
        ├── [result.txt]
        └── failed/
            ├── [failed_audio]
            └── [error.log]
```

- **src/**: System logic, modularized.
- **campaigns/**: Contains each campaign's folder, with its `checklist.txt` (if using local no-db mode) and `audios/` folder.
- **processed/**: Stores processed audios and their results (if using local no-db mode). Includes a `failed/` subfolder for audios that couldn't be processed.

## Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd audioanalyzer
   npm install
   ```

2. **Set up your keys:**
   - Create a `.env` file with the following content:
     ```
     AI_TRANSCRIBER_SERVICE=openai or mistral or huggingface
     AI_ANALYZER_SERVICE=openai or mistral or huggingface
     AI_ANONYMIZER_SERVICE=openai or mistral or huggingface

     ANONYMIZE_TRANSCRIPTION=true or false

     # If OpenAI is used
     OPENAI_API_KEY=tu_api_key_aqui
     OPENAI_BASE_URL= (if nothing it will use the default from OpenAI)
     OPENAI_MODEL=

     # If Whisper is used (in other service than OpenAI)
     WHISPER_BASE_URL= (if nothing it will use the default from OpenAI)
     WHISPER_MODEL=whisper-1
     WHISPER_API_KEY= (it could be the same as OPENAI_API_KEY)

     # IF Mistral is used
     MISTRAL_API_KEY=tu_mistral_api_key
     MISTRAL_AUDIO_MODEL=voxtral_model
     # The text model is used for anonymizing the transcription
     MISTRAL_TEXT_MODEL=mistral-model
     MISTRAL_ENDPOINT=https://api.mistral.ai/v1

     # If Huggingface is used
     # Huggingface configuration
     HUGGINGFACE_API_KEY=
     HUGGINGFACE_PROVIDER_AUDIO=
     HUGGINGFACE_PROVIDER_TEXT=
     HUGGINGFACE_AUDIO_MODEL=
     HUGGINGFACE_TEXT_MODEL=

     # If you want to use a database (otherwise, if empty, results are only saved in the text file)
     DB_ENGINE=supabase

     # Supabase Configuration
     SUPABASE_URL=
     SUPABASE_ANON_KEY=
     SUPABASE_CAMPAIGN_TABLE_NAME=
     SUPABASE_RESULTS_TABLE_NAME=
     ```

## Database

Currently, only Supabase is supported as a database.

For more details on how to use the database and configure other engines, see the [specific README](./src/services/database/README.md)

## Usage Modes

There are two ways to run the application.

### 1. Single Run
Processes all pending audios once and then exits.

- **Process all campaigns:**
  ```bash
  npm start
  ```
- **Process only a specific campaign:**
  ```bash
  npm start [campaign_name]
  ```

### 2. Continuous Watch Mode
The script stays active and automatically processes any new audio added to the `campaigns/*/audios/` folders.

- **Activate watch mode:**
  ```bash
  npm start -- --watch
  ```
  *(The `--` is important to pass the flag to the script through npm).*

## Error Handling
If an audio cannot be processed (due to network error, API error, etc.), the system is robust:
- The problematic audio is moved to `processed/[campaign_name]/failed/`.
- A `.log` file is created next to the audio with error details.
- The script continues processing other audios without interruption.
This allows safe re-execution at any time to process pending audios.

## Checklist
If DB_ENGINE is empty, the checklist.txt will be used to check the do and do not lists to analyze the audio.

If DB_ENGINE is not empty, the checklist needs to be in the database (_campaign_ table).

To select the language, use the following codes:
- _es_ for Spanish
- _en_ for English
- _fr_ for French
- _pt_ for Portuguese
- _de_ for German
- _it_ for Italian
- _nl_ for Dutch
- _hi_ for Hindi

Checklist.txt format:

```
es
# DO
Initial greeting
Company introduction
Request for customer number
Polite farewell

# DONT
Ask for password
```

**The first line of the checklist (if using checklist.txt) should indicate the language for the analysis (es, en, fr, pt, de, it, nl, hi)**

## Requirements
- Node.js >= 16
- OpenAI account and API Key with access to Whisper and GPT
- Or Mistral account and API Key to use Voxtral to analyze the audio instead of OpenAI.
- Or any OpenAI compatible API to use as transcriber and analyzer.

## AWS Lambda Usage with S3

This project can now run as a Lambda function, automatically processing audio files uploaded to an S3 bucket.

### Expected S3 Structure
- Audios should be uploaded to: `campaigns/[campaign_name]/audios/[file]`
- The checklist should be at: `campaigns/[campaign_name]/checklist.txt`
- Results and processed files will be saved in: `processed/[campaign_name]/`

### Deployment Steps:
1. Package the code (including `node_modules`) into a zip file.
2. Upload the zip as a Lambda function.
3. Set the environment variable `AI_TRANSCRIBER_SERVICE` and `AI_ANALYZER_SERVICE` to `openai` or `mistral`.
4. Set the environment variable `OPENAI_API_KEY` or `MISTRAL_API_KEY` and other variables needed for the service.
5. Create an S3 trigger for the Lambda function:
   - Event: `PUT`
   - Prefix: `campaigns/`
   - Suffix: (empty or restricted to audio extensions)
6. Ensure the Lambda has permissions to read and write to the S3 bucket.

### Notes
- Processing and saving results is now fully in S3 and `/tmp` (Lambda's temp directory).
- Watcher mode and local processing remain available for use outside Lambda.

## To Do
- [x] Decoupling of AI services between transcriber and analyzer.
- [x] Automatic anonymization of sensitive data (PII, credit cards, etc.) using AI and LLM.
- [x] Integration with more AI engines and Huggingface SDK.
- [ ] Integration with more database engines.
- [ ] Integration with Cloud providers (Azure, AWS, Google Cloud, and others).
- [ ] Calculate costs incurred for each audio and at campaign level.
- [ ] Web app to manage campaigns, and results.
- [ ] Dashboard with interactive visualizations of the analyses.
- [ ] Batch processing
- [ ] REST API so that other systems can use the analysis.
- [ ] Administration panel for user management and billing.
- [ ] Product usage analytics.
- [ ] Customization of analysis according to the sector (education, healthcare, call centers, etc.).
- [ ] Identification of best practices and model agents.
- [ ] Integration with CRMs and ticketing systems (Salesforce, Zendesk, HubSpot).
- [ ] Automatic alerts to supervisors in case of critical situations (upset customer, potential termination, etc.).
