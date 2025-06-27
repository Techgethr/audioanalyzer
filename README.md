# AudioAnalyzer

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