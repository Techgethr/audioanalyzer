# AudioAnalyzer

## Índice
- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Modos de Uso](#modos-de-uso)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplo de checklist.txt](#ejemplo-de-checklisttxt)
- [Requisitos](#requisitos)
- [Uso como AWS Lambda con S3](#uso-como-aws-lambda-con-s3)
- [English Version](#english-version)

# Descripción

App en Node.js para analizar audios de campañas de call center y verificar si cumplen con requisitos definidos (intenciones), usando transcripción automática de OpenAI Whisper y análisis semántico con GPT.

## Características
- Soporte para múltiples campañas, cada una con su propio checklist y audios.
- **Dos modos de ejecución**: única (procesa y termina) o continua (vigila nuevos audios).
- Transcribe audios usando la API de OpenAI Whisper.
- Analiza la transcripción con GPT para verificar intenciones.
- **Recuperación ante fallos**: Mueve los audios problemáticos a una carpeta `failed` para revisión manual, sin detener el proceso.
- Estructura modular y escalable.

## Estructura del Proyecto

```
audioanalyzer/
├── index.js
├── src/
│   ├── campaignManager.js
│   ├── openaiService.js
│   └── resultWriter.js
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
- **processed/**: Guarda los audios procesados y sus resultados. Incluye una subcarpeta `failed/` para los audios que no se pudieron procesar.

## Configuración

1. **Clona el repositorio e instala dependencias:**
   ```bash
   git clone <repo-url>
   cd audioanalyzer
   npm install
   ```

2. **Configura tu clave de OpenAI:**
   - Crea un archivo `.env` con el siguiente contenido:
     ```
     OPENAI_API_KEY=tu_api_key_aqui
     OPENAI_MODEL_AUDIO=whisper-1
     OPENAI_MODEL_TEXT=gpt-3.5-turbo
     ```

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
Saludo inicial
Presentación de la empresa
Solicitud de número de cliente
Despedida cordial
```

## Requisitos
- Node.js >= 16
- Cuenta y API Key de OpenAI con acceso a Whisper y GPT

## Uso como AWS Lambda con S3

Ahora este proyecto puede ejecutarse como función Lambda, procesando automáticamente archivos de audio subidos a un bucket S3.

### Estructura esperada en S3
- Los audios deben subirse a: `campaigns/[nombre_campaña]/audios/[archivo]`
- El checklist debe estar en: `campaigns/[nombre_campaña]/checklist.txt`
- Los resultados y archivos procesados se guardarán en: `processed/[nombre_campaña]/`

### Pasos para desplegar:
1. Empaqueta el código (incluyendo `node_modules`) en un zip.
2. Sube el zip como función Lambda.
3. Configura la variable de entorno `OPENAI_API_KEY` y los modelos si es necesario.
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
- [Usage Modes](#usage-modes)
- [Error Handling](#error-handling)
- [Example checklist.txt](#example-checklisttxt)
- [Requirements](#requirements)
- [AWS Lambda Usage with S3](#aws-lambda-usage-with-s3)

# Description

Node.js app to analyze call center campaign audios and check if they meet defined requirements (intentions), using OpenAI Whisper for automatic transcription and GPT for semantic analysis.

## Features
- Support for multiple campaigns, each with its own checklist and audios.
- **Two execution modes**: single run (processes and exits) or continuous (watches for new audios).
- Transcribes audios using the OpenAI Whisper API.
- Analyzes the transcription with GPT to verify intentions.
- **Failure recovery**: Moves problematic audios to a `failed` folder for manual review, without stopping the process.
- Modular and scalable structure.

## Project Structure

```
audioanalyzer/
├── index.js
├── src/
│   ├── campaignManager.js
│   ├── openaiService.js
│   └── resultWriter.js
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

2. **Set up your OpenAI key:**
   - Create a `.env` file with the following content:
     ```
     OPENAI_API_KEY=your_api_key_here
     OPENAI_MODEL_AUDIO=whisper-1
     OPENAI_MODEL_TEXT=gpt-3.5-turbo
     ```

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
Initial greeting
Company introduction
Request for customer number
Polite farewell
```

## Requirements
- Node.js >= 16
- OpenAI account and API Key with access to Whisper and GPT

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