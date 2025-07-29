# Audio Analyzer

## Índice
- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Base de datos](#base-de-datos)
- [Modos de Uso](#modos-de-uso)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplo de checklist.txt](#ejemplo-de-checklisttxt)
- [Requisitos](#requisitos)
- [Uso como AWS Lambda con S3](#uso-como-aws-lambda-con-s3)
- [English Version](#english-version)

# Descripción

App en Node.js para analizar audios de conversaciones para distintas campañas (como soporte, ventas, etc.) y verificar si cumplen con requisitos definidos, como seguimiento de scripts, tono, y mucho más, usando análisis y servicios de AI. 

## Características
- Soporte para múltiples campañas, cada una con su propio checklist y audios.
- **Dos modos de ejecución**: única (procesa y termina) o continua (vigila nuevos audios).
- Transcribe audios usando distintos modelos (OpenAI con Whisper o Mistral con Voxtral)
- Analiza audios de detalle y justificación (seguimiento de un script predefinido de conversación, análisis emocional y del tono, calidad del audio, y resumen de cumplimiento)
- Inserta los resultados de manera estructura en una base de datos para su posterior análisis. 
- **Recuperación ante fallos**: Mueve los audios problemáticos a una carpeta `failed` para revisión manual, sin detener el proceso.
- Estructura modular y escalable.

## Estructura del Proyecto

```
audioanalyzer/
├── index.js
├── src/
│   ├── campaignManager.js
│   ├── promptManager.js
│   ├── resultWriter.js
│   └── services
│       └── ai
│       └── database
├── package.json
├── .env
├── README.md
├── campaigns/
│   └── [nombre_campaña]/
│       ├── checklist.txt
│       └── audios/
└── processed/
    └── [nombre_campaña]/
        ├── [audio_procesado]
        ├── [resultado.txt]
        └── failed/
            ├── [audio_fallido]
            └── [error.log]
```

- **src/**: Lógica del sistema, modularizada.
- **campaigns/**: Contiene las carpetas de cada campaña, con su `checklist.txt` y carpeta `audios/`.
- **processed/**: Guarda los audios procesados y sus resultados en caso de no usar base de datos. Incluye una subcarpeta `failed/` para los audios que no se pudieron procesar.

## Configuración

1. **Clona el repositorio e instala dependencias:**
   ```bash
   git clone <repo-url>
   cd audioanalyzer
   npm install
   ```

2. **Configura tus claves:**
   - Crea un archivo `.env` con el siguiente contenido:
     ```
     AI_SERVICE=openai o voxtral

     # Si usas OpenAI
     OPENAI_API_KEY=tu_api_key_aqui
     OPENAI_MODEL_AUDIO=whisper-1
     OPENAI_MODEL_TEXT=gpt-3.5-turbo

     # Si usas Voxtral
     MISTRAL_API_KEY=tu_mistral_api_key
     MISTRAL_MODEL_AUDIO=voxtral_model
     MISTRAL_ENDPOINT=https://api.mistral.ai/v1
     # Si quieres hacer transcripción previamente al análisis con Mistral, configura las siguientes variables
     MISTRAL_INCLUDE_TRANSCRIPTION=true or false
     MISTRAL_MODEL_TEXT=

     # Si usas base de datos (sino, solo se guardan los resultados en el archivo de texto)
     DB_ENGINE=supabase

     # Supabase Configuration
     SUPABASE_URL=
     SUPABASE_ANON_KEY=
     SUPABASE_TABLE_NAME=
     ```

## Base de datos

Actualmente se soporta solo Supabase como base de datos.

Para más detalles sobre cómo usar la base de datos y configurar otros motores, consulta el [Readme específico](./src/services/database/README.md)

## Modos de Uso

Existen dos modos para ejecutar la aplicación.

### 1. Ejecución Única
Procesa todos los audios pendientes una sola vez y luego termina.

- **Procesar todas las campañas:**
  ```bash
  npm start
  ```
- **Procesar solo una campaña específica:**
  ```bash
  npm start [nombre_de_la_campaña]
  ```

### 2. Modo de Vigilancia Continua
El script se queda activo y procesa automáticamente cualquier nuevo audio que se añada a las carpetas `campaigns/*/audios/`.

- **Activar el modo de vigilancia:**
  ```bash
  npm start -- --watch
  ```
  *(El `--` es importante para pasar el flag al script a través de npm).*

## Manejo de Errores
Si un audio no se puede procesar (por un error de red, de la API, etc.), el sistema es robusto:
- El audio problemático se mueve a `processed/[nombre_campaña]/failed/`.
- Se crea un archivo `.log` junto al audio con los detalles del error.
- El script continúa procesando los demás audios sin interrupción.
Esto permite una re-ejecución segura en cualquier momento para procesar los audios que quedaron pendientes.

## Ejemplo de checklist.txt
```
es
Saludo inicial
Presentación de la empresa
Solicitud de número de cliente
Despedida cordial
```

**La primera línea del checklist debe indicar el idioma para el análisis (es o en)**

## Requisitos
- Node.js >= 16
- Cuenta y API Key de OpenAI con acceso a Whisper y GPT
- O cuenta y API Key de Mistral para usar con el modelo Voxtral en lugar de OpenAI.

## Uso como AWS Lambda con S3

Ahora este proyecto puede ejecutarse como función Lambda, procesando automáticamente archivos de audio subidos a un bucket S3.

### Estructura esperada en S3
- Los audios deben subirse a: `campaigns/[nombre_campaña]/audios/[archivo]`
- El checklist debe estar en: `campaigns/[nombre_campaña]/checklist.txt`
- Los resultados y archivos procesados se guardarán en: `processed/[nombre_campaña]/`

### Pasos para desplegar:
1. Empaqueta el código (incluyendo `node_modules`) en un zip.
2. Sube el zip como función Lambda.
3. Configura las variables de entorno y los modelos si es necesario.
4. Crea un trigger de tipo S3 para la función Lambda:
   - Evento: `PUT`
   - Prefijo: `campaigns/`
   - Sufijo: (vacío o restringido a extensiones de audio)
5. Asegúrate de que la Lambda tenga permisos para leer y escribir en el bucket S3.

### Notas
- El procesamiento y guardado de resultados ahora es completamente en S3 y `/tmp` (directorio temporal de Lambda).
- El modo watcher y procesamiento local siguen disponibles para uso fuera de Lambda.

# English Version

## Index
- [Description](#description)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Database](#database)
- [Usage Modes](#usage-modes)
- [Error Handling](#error-handling)
- [Example checklist.txt](#example-checklisttxt)
- [Requirements](#requirements)
- [AWS Lambda Usage with S3](#aws-lambda-usage-with-s3)

# Description

Node.js app for analyzing conversation audio for various campaigns (such as support, sales, etc.) and verifying whether it meets defined requirements, such as script tracking, tone, and more, using analytics and AI services.

## Features
- Support for multiple campaigns, each with its own checklist and audios.
- **Two execution modes**: single run (processes and exits) or continuous (watches for new audios).
- Transcribe audio using different models (OpenAI with Whisper or Mistral with Voxtral)
- Analyze audio for detail and justification (following a predefined conversation script, emotional and tone analysis, audio quality, and compliance summary)
- Inserts the results in a structured manner into a database for further analysis.
- **Failure recovery**: Moves problematic audios to a `failed` folder for manual review, without stopping the process.
- Modular and scalable structure.

## Project Structure

```
audioanalyzer/
├── index.js
├── src/
│   ├── campaignManager.js
│   ├── promptManager.js
│   ├── resultWriter.js
│   └── services
│       └── ai
│       └── database
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
- **campaigns/**: Contains each campaign's folder, with its `checklist.txt` and `audios/` folder.
- **processed/**: Stores processed audios and their results. Includes a `failed/` subfolder for audios that couldn't be processed.

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
     AI_SERVICE=openai or voxtral

     OPENAI_API_KEY=your_api_key_here
     OPENAI_MODEL_AUDIO=whisper-1
     OPENAI_MODEL_TEXT=gpt-3.5-turbo

     # IF Voxtral is used
     MISTRAL_API_KEY=tu_mistral_api_key
     MISTRAL_MODEL_AUDIO=voxtral_model
     MISTRAL_ENDPOINT=https://api.mistral.ai/v1
     # If you want to transcribe before analyzing with Mistral, configure the following variables
     MISTRAL_INCLUDE_TRANSCRIPTION=true or false
     MISTRAL_MODEL_TEXT=

     # If you want to use a database (otherwise, results are only saved in the text file)
     DB_ENGINE=supabase

     # Supabase Configuration
     SUPABASE_URL=
     SUPABASE_ANON_KEY=
     SUPABASE_TABLE_NAME=
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

## Example checklist.txt
```
en
Initial greeting
Company introduction
Request for customer number
Polite farewell
```

**The first line of the checklist should indicate the language for the analysis (es or en)**

## Requirements
- Node.js >= 16
- OpenAI account and API Key with access to Whisper and GPT
- Or Mistral account and API Key to use Voxtral to analyze the audio instead of OpenAI.

## AWS Lambda Usage with S3

This project can now run as a Lambda function, automatically processing audio files uploaded to an S3 bucket.

### Expected S3 Structure
- Audios should be uploaded to: `campaigns/[campaign_name]/audios/[file]`
- The checklist should be at: `campaigns/[campaign_name]/checklist.txt`
- Results and processed files will be saved in: `processed/[campaign_name]/`

### Deployment Steps:
1. Package the code (including `node_modules`) into a zip file.
2. Upload the zip as a Lambda function.
3. Set the environment variable `OPENAI_API_KEY` and models if needed.
4. Create an S3 trigger for the Lambda function:
   - Event: `PUT`
   - Prefix: `campaigns/`
   - Suffix: (empty or restricted to audio extensions)
5. Ensure the Lambda has permissions to read and write to the S3 bucket.

### Notes
- Processing and saving results is now fully in S3 and `/tmp` (Lambda's temp directory).
- Watcher mode and local processing remain available for use outside Lambda.