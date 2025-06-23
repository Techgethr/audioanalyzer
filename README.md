# AudioAnalyzer

App en Node.js para analizar audios de campañas de call center y verificar si cumplen con un script definido, usando transcripción automática de OpenAI Whisper.

## Características
- Soporte para múltiples campañas, cada una con su propio script y audios.
- Transcribe audios usando la API de OpenAI.
- Verifica si las frases del script están presentes en la transcripción.
- Muestra resultados en consola y los guarda en archivos de texto junto a los audios procesados.

## Estructura del Proyecto

```
audioanalyzer/
├── index.js
├── package.json
├── .env
├── .gitignore
├── README.md
├── campaigns/
│   └── campaign1/
│       ├── script.txt
│       └── audios/
└── processed/
    └── campaign1/
        ├── audio1.mp3
        ├── audio1.txt
        └── ...
```

- **campaigns/**: Carpeta donde se crean subcarpetas para cada campaña.
  - Cada campaña debe tener su propio `script.txt` y una subcarpeta `audios/` con los archivos de audio a analizar.
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
     ```

4. **Crea campañas:**
   - Dentro de la carpeta `campaigns/`, crea una subcarpeta para cada campaña (ej: `campaign1`).
   - Dentro de cada campaña, agrega un archivo `script.txt` (una frase por línea) y una subcarpeta `audios/` con los archivos de audio (`.mp3`, `.wav`, `.m4a`, `.mp4`).

   Ejemplo:
   ```
   campaigns/
     campaign1/
       script.txt
       audios/
         llamada1.mp3
         llamada2.wav
     campaign2/
       script.txt
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

## Notas
- El script busca frases exactas (no fuzzy matching).
- Los audios procesados se mueven automáticamente a la carpeta `processed/<campaign>/`.
- Puedes agregar tantas campañas como necesites, cada una con su propio script y audios.

## Requisitos
- Node.js >= 16
- Cuenta y API Key de OpenAI con acceso a Whisper