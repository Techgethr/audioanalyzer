# AudioAnalyzer

App en Node.js para analizar audios de campañas de call center y verificar si cumplen con requisitos definidos (intenciones), usando transcripción automática de OpenAI Whisper y análisis semántico con GPT.

## Características
- Soporte para múltiples campañas, cada una con su propio checklist y audios.
- Transcribe audios usando la API de OpenAI Whisper.
- Analiza la transcripción con GPT para verificar intenciones (no frases exactas).
- Muestra resultados en consola y los guarda en archivos de texto junto a los audios procesados.
- Estructura modular y escalable.

## Estructura del Proyecto

```
audioanalyzer/
├── index.js                # Punto de entrada
├── src/
│   ├── campaignManager.js  # Manejo de campañas y checklist
│   ├── openaiService.js    # Interacción con OpenAI (Whisper y GPT)
│   └── resultWriter.js     # Guardado de resultados y movimiento de archivos
├── package.json
├── .env
├── .gitignore
├── README.md
├── campaigns/
│   └── campaign1/
│       ├── checklist.txt   # Requisitos/intenciones a verificar (uno por línea)
│       └── audios/
│           └── llamada1.mp3
└── processed/
    └── campaign1/
        ├── llamada1.mp3
        └── llamada1.txt    # Resultado del análisis
```

- **src/**: Lógica del sistema, modularizada.
- **campaigns/**: Carpeta donde se crean subcarpetas para cada campaña.
  - Cada campaña debe tener su propio `checklist.txt` (una intención por línea) y una subcarpeta `audios/` con los archivos de audio a analizar.
- **processed/**: Aquí se guardan los audios procesados y los archivos de resultados por campaña.

## Configuración

1. **Clona el repositorio y entra a la carpeta:**
   ```bash
   git clone <repo-url>
   cd audioanalyzer
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura tu clave de OpenAI:**
   - Crea un archivo `.env` con el siguiente contenido:
     ```
     OPENAI_API_KEY=tu_api_key_aqui
     OPENAI_MODEL_AUDIO=whisper-1 (u otro modelo)
     OPENAI_MODEL_TEXT=gpt-3.5-turbo (u otro modelo)
     ```

4. **Crea campañas:**
   - Dentro de la carpeta `campaigns/`, crea una subcarpeta para cada campaña (ej: `campaign1`).
   - Dentro de cada campaña, agrega un archivo `checklist.txt` (una intención por línea, por ejemplo: "Saludo inicial", "Solicitud de número de cliente", etc.) y una subcarpeta `audios/` con los archivos de audio (`.mp3`, `.wav`, `.m4a`, `.mp4`).

   Ejemplo:
   ```
   campaigns/
     campaign1/
       checklist.txt
       audios/
         llamada1.mp3
         llamada2.wav
     campaign2/
       checklist.txt
       audios/
         llamada3.mp3
   ```

## Uso

### Procesar todas las campañas
```bash
npm start
```

### Procesar solo una campaña específica
```bash
npm start campaign1
```

- Los resultados se mostrarán en consola y se guardarán en la carpeta `processed/<campaign>/` como archivos `.txt` con el mismo nombre que el audio.

## Ejemplo de checklist.txt
```
Saludo inicial
Presentación de la empresa
Solicitud de número de cliente
Despedida cordial
```

## Notas
- El análisis es semántico: el checklist define intenciones, no frases exactas.
- Los audios procesados se mueven automáticamente a la carpeta `processed/<campaign>/`.
- Puedes agregar tantas campañas como necesites, cada una con su propio checklist y audios.
- El sistema es modular y fácil de extender (puedes agregar más módulos en `src/` según tus necesidades).

## Requisitos
- Node.js >= 16
- Cuenta y API Key de OpenAI con acceso a Whisper y GPT