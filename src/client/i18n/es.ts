import type { LiveVoiceTranslation } from './base.js';

const es: LiveVoiceTranslation = {
  'dsh-live-voice.commons.connection.contactingHost': 'Conectando con el host de DSH…',
  'dsh-live-voice.commons.connection.endpoint': 'URL del punto de acceso',
  'dsh-live-voice.commons.connection.healthEndpoint': 'URL o ruta de comprobación de estado',
  'dsh-live-voice.commons.connection.reload': 'Volver a cargar la configuración guardada',
  'dsh-live-voice.commons.connection.test': 'Probar conexión',
  'dsh-live-voice.commons.connection.timeout': 'Tiempo de espera de las solicitudes (ms)',
  'dsh-live-voice.commons.connection.title': 'Configuración de conexión',
  'dsh-live-voice.commons.connection.unsaved': 'Cambios sin guardar',
  'dsh-live-voice.commons.controls.title': 'Controles de voz',
  'dsh-live-voice.commons.conversation.end': 'Terminar conversación por voz',
  'dsh-live-voice.commons.conversation.idle': 'Conversación inactiva',
  'dsh-live-voice.commons.conversation.start': 'Iniciar conversación por voz',
  'dsh-live-voice.commons.delivery.queueBadge': 'COLA',
  'dsh-live-voice.commons.device.numberedLabel': '{device} {number}',
  'dsh-live-voice.commons.dismiss': 'Descartar',
  'dsh-live-voice.commons.dismissError': 'Descartar error de voz',
  'dsh-live-voice.commons.engine.failure': '{engine}: {reason}',
  'dsh-live-voice.commons.input.ignoring': 'ignorando',
  'dsh-live-voice.commons.input.ignoringBadge': 'IGNORANDO',
  'dsh-live-voice.commons.input.listening': 'escuchando',
  'dsh-live-voice.commons.input.listeningBadge': 'ESCUCHANDO',
  'dsh-live-voice.commons.manual': 'manual',
  'dsh-live-voice.commons.off': 'desactivado',
  'dsh-live-voice.commons.on': 'activado',
  'dsh-live-voice.commons.pluginName': 'Live Voice',
  'dsh-live-voice.commons.queue': 'cola',
  'dsh-live-voice.commons.repository.starLabel': 'Danos una estrella en GitHub',
  'dsh-live-voice.commons.repository.starLink': 'Dar una estrella a DSH Live Voice en GitHub',
  'dsh-live-voice.commons.seconds': '{seconds} segundos',
  'dsh-live-voice.commons.send': 'ENVIAR',
  'dsh-live-voice.commons.status.ready': 'Funciones de voz listas',
  'dsh-live-voice.commons.systemDefault': 'Predeterminado del sistema',
  'dsh-live-voice.commons.toggle.offBadge': 'DESACTIVADO',
  'dsh-live-voice.commons.unknownLanguage': 'idioma desconocido',
  'dsh-live-voice.commons.update.label': 'Actualización disponible',
  'dsh-live-voice.commons.update.link':
    'Actualización disponible: {version}. Abrir la página de esta versión',
  'dsh-live-voice.commons.update.version': 'Actualización disponible: {version}',
  'dsh-live-voice.commons.version.compatibility': 'Compatible con DSH v{version}',
  'dsh-live-voice.commons.version.compatibilityLink':
    'Compatible con DSH v{version}. Abrir la página de esta versión',
  'dsh-live-voice.commons.version.label': 'DSH Live Voice v{version}',
  'dsh-live-voice.commons.version.link': 'DSH Live Voice v{version}. Abrir la lista de versiones',
  'dsh-live-voice.commons.version.title': 'Información de versión',
  'dsh-live-voice.recognition.autoSend.countdownHelp':
    'La cuenta atrás comienza tras el reconocimiento definitivo de una frase. Hablar de nuevo o editar el texto la cancela.',
  'dsh-live-voice.recognition.browser.autoInstallPack':
    'Instalar automáticamente este paquete de idioma del navegador cuando sea necesario',
  'dsh-live-voice.recognition.browser.help':
    'Utiliza la API SpeechRecognition del navegador. Esta es la opción predeterminada.',
  'dsh-live-voice.recognition.browser.label':
    'SpeechRecognition del navegador — Opción predeterminada',
  'dsh-live-voice.recognition.browser.localProcessing':
    'Procesar el reconocimiento localmente en este dispositivo',
  'dsh-live-voice.recognition.browser.microphoneHelp':
    'SpeechRecognition puede utilizar el micrófono predeterminado del navegador o del sistema en lugar del seleccionado aquí.',
  'dsh-live-voice.recognition.browser.remoteServiceWarning':
    'El reconocimiento mediante el servicio del navegador está activado. El navegador puede enviar el audio del micrófono a su servicio de reconocimiento.',
  'dsh-live-voice.recognition.commands.clear': 'Vaciar el cuadro de mensaje',
  'dsh-live-voice.recognition.commands.enabled': 'Activar comandos de voz con coincidencia exacta',
  'dsh-live-voice.recognition.commands.mute': 'Suspender la entrada de voz en el cuadro de mensaje',
  'dsh-live-voice.recognition.commands.queue': 'Añadir a la cola',
  'dsh-live-voice.recognition.commands.resume':
    'Reanudar la entrada de voz en el cuadro de mensaje',
  'dsh-live-voice.recognition.commands.send': 'Enviar al agente en ejecución',
  'dsh-live-voice.recognition.commands.stopSpeech': 'Detener la lectura en voz alta del asistente',
  'dsh-live-voice.recognition.commands.title': 'Comandos de voz',
  'dsh-live-voice.recognition.dictation.cancel': 'Cancelar dictado',
  'dsh-live-voice.recognition.engine.label': 'Motor de reconocimiento',
  'dsh-live-voice.recognition.headphoneMode.help':
    'El micrófono abierto sigue escuchando mientras se reproducen las respuestas. Al detectar tu voz, la reproducción se pausa y solo se reanuda cuando tú lo decides.',
  'dsh-live-voice.recognition.headphoneMode.label': 'Auriculares — micrófono abierto',
  'dsh-live-voice.recognition.holdToTalk.enabled': 'Mantener Control pulsado para hablar',
  'dsh-live-voice.recognition.holdToTalk.help':
    'Con un cuadro de mensaje abierto, mantén Control pulsado en cualquier parte de la página para capturar tu voz. Al soltarlo, se procesa la transcripción pendiente, se espera el retraso de envío configurado, se añade el mensaje a la cola y se cierra la captura de voz. Pulsa Escape mientras mantienes Control para cancelar.',
  'dsh-live-voice.recognition.language.automatic': 'Automático — detectar idioma',
  'dsh-live-voice.recognition.language.label': 'Idioma de reconocimiento',
  'dsh-live-voice.recognition.manualSend.help':
    'El texto reconocido permanece en el cuadro de mensaje hasta que utilices el botón de envío habitual de DSH.',
  'dsh-live-voice.recognition.maxUtterance.help':
    'Si hablas sin hacer pausas, se inicia un nuevo fragmento de transcripción tras este intervalo. Valor predeterminado: 60 segundos.',
  'dsh-live-voice.recognition.maxUtterance.label': 'Duración máxima del habla continua (segundos)',
  'dsh-live-voice.recognition.microphone.checking': 'Comprobando la disponibilidad del micrófono',
  'dsh-live-voice.recognition.microphone.device': 'Dispositivo de entrada',
  'dsh-live-voice.recognition.microphone.failure': 'Micrófono: {reason}',
  'dsh-live-voice.recognition.microphone.ignore':
    'Ignorar la entrada de voz en el cuadro de mensaje',
  'dsh-live-voice.recognition.microphone.inputStatus': 'Entrada del micrófono: {state}',
  'dsh-live-voice.recognition.microphone.label': 'Micrófono',
  'dsh-live-voice.recognition.microphone.permissionHelp':
    'Solo se solicitará permiso para usar el micrófono cuando inicies un dictado o una conversación por voz.',
  'dsh-live-voice.recognition.microphone.resume': 'Reanudar escucha',
  'dsh-live-voice.recognition.microphone.starting': 'Iniciando micrófono…',
  'dsh-live-voice.recognition.microphone.takeControl': 'Tomar el control del micrófono',
  'dsh-live-voice.recognition.minimumWords.enabled':
    'Ignorar los fragmentos definitivos de transcripción demasiado cortos',
  'dsh-live-voice.recognition.minimumWords.help':
    'Los fragmentos definitivos con menos palabras se descartan antes de llegar al cuadro de mensaje o al envío automático.',
  'dsh-live-voice.recognition.minimumWords.label': 'Mínimo de palabras por fragmento definitivo',
  'dsh-live-voice.recognition.mode.label': 'Modo de escucha',
  'dsh-live-voice.recognition.planned.parakeet': 'NVIDIA Parakeet — Próximamente',
  'dsh-live-voice.recognition.planned.sherpa': 'sherpa-onnx en continuo — Próximamente',
  'dsh-live-voice.recognition.planned.vote':
    'Próximamente — vota en las incidencias del repositorio',
  'dsh-live-voice.recognition.planned.voxtral': 'Voxtral Realtime — Próximamente',
  'dsh-live-voice.recognition.planned.webGpu': 'Inferencia WebGPU en el navegador — Próximamente',
  'dsh-live-voice.recognition.presets.long.description':
    'Espera durante pausas de reflexión más largas.',
  'dsh-live-voice.recognition.presets.long.label': 'Larga',
  'dsh-live-voice.recognition.presets.natural.description': 'Permite pausas normales entre frases.',
  'dsh-live-voice.recognition.presets.natural.label': 'Natural',
  'dsh-live-voice.recognition.presets.short.description':
    'Envía rápidamente después de una pausa corta.',
  'dsh-live-voice.recognition.presets.short.label': 'Corta',
  'dsh-live-voice.recognition.providerSettings.help':
    'La configuración del proveedor cambia según el motor de reconocimiento seleccionado.',
  'dsh-live-voice.recognition.qwen.captureHelp':
    'El audio se divide en enunciados completos en formato WAV y se envía a través de DSH con autenticación al modelo Qwen3 ASR ejecutado localmente en el host.',
  'dsh-live-voice.recognition.qwen.connectionSuccess':
    'Conexión correcta. Qwen ASR y TTS están cargados. Los cambios sin guardar no se han aplicado.',
  'dsh-live-voice.recognition.qwen.endpointHelp':
    'API HTTP en la URL configurada en el host de DSH (predeterminada: http://127.0.0.1:8080/inference). El audio utiliza la ruta de transcripción autenticada del host de DSH.',
  'dsh-live-voice.recognition.qwen.hostHelp':
    'Configuración para todo el host del servidor Qwen3 ASR + TTS. Introduce una URL base HTTP o HTTPS accesible desde el host de DSH. El navegador accede a ella mediante las rutas autenticadas de DSH.',
  'dsh-live-voice.recognition.qwen.label': 'Qwen3 ASR — API HTTP',
  'dsh-live-voice.recognition.silenceDetection.duration':
    'Pausa antes de enviar: {milliseconds} ms',
  'dsh-live-voice.recognition.silenceDetection.help':
    'Determina cuánto debe durar una pausa antes de enviar la voz capturada para su reconocimiento.',
  'dsh-live-voice.recognition.silenceDetection.label': 'Detección de silencio',
  'dsh-live-voice.recognition.silenceDetection.pauseLabel': 'Pausa antes de enviar',
  'dsh-live-voice.recognition.silenceDetection.title': 'Configuración de detección de silencio',
  'dsh-live-voice.recognition.speakerMode.help':
    'La escucha controlada libera el micrófono mientras se reproducen las respuestas para evitar que se reconozca el audio de los altavoces. Usa «Tomar el control del micrófono» para interrumpir la reproducción.',
  'dsh-live-voice.recognition.speakerMode.label': 'Altavoces — escucha controlada',
  'dsh-live-voice.recognition.status.answer': 'Reconociendo respuesta…',
  'dsh-live-voice.recognition.status.awaitingAnswer': 'Escuchando tu respuesta…',
  'dsh-live-voice.recognition.status.listening': 'Escuchando — esperando voz',
  'dsh-live-voice.recognition.status.processing': 'Reconociendo voz…',
  'dsh-live-voice.recognition.status.unavailable': 'Reconocimiento de voz no disponible',
  'dsh-live-voice.recognition.voiceCommands.help':
    'Separa las frases con comas. La comparación ignora mayúsculas, acentos, puntuación y espacios adicionales. Debe coincidir todo el fragmento definitivo.',
  'dsh-live-voice.recognition.whisper.captureHelp':
    'El audio se divide en enunciados completos en formato WAV, se envía a través de DSH con autenticación y se procesa mediante el servidor HTTP de whisper.cpp en la interfaz de bucle local.',
  'dsh-live-voice.recognition.whisper.connectionSuccess':
    'Conexión correcta. El punto de acceso de comprobación de estado ha respondido; no se ha probado la transcripción. Los cambios sin guardar no se han aplicado.',
  'dsh-live-voice.recognition.whisper.endpointHelp':
    'API HTTP en la URL base configurada (predeterminada: http://127.0.0.1:8080/). Compatible con POST /v1/audio/transcriptions.',
  'dsh-live-voice.recognition.whisper.healthFailed':
    'Ha fallado la comprobación de estado de Whisper.',
  'dsh-live-voice.recognition.whisper.label': 'Whisper — API HTTP',
  'dsh-live-voice.recognition.whisper.requestFailed':
    'Ha fallado la solicitud de configuración de Whisper.',
  'dsh-live-voice.recognition.whisper.restartRequired':
    'Las rutas de configuración de Whisper no están cargadas. Es necesario reiniciar normalmente el servidor DSH para cargar las rutas actualizadas del complemento; no basta con actualizar esta página.',
  'dsh-live-voice.recognition.whisper.save': 'Guardar la configuración de Whisper',
  'dsh-live-voice.recognition.whisper.saved':
    'Guardado en el host de DSH. Se han cancelado las solicitudes de transcripción activas del host.',
  'dsh-live-voice.recognition.whisper.signInRequired':
    'Inicia sesión en DSH para gestionar la configuración de Whisper.',
  'dsh-live-voice.settings.autoSend.cancel': 'Cancelar envío automático',
  'dsh-live-voice.settings.autoSend.countdown': 'Enviando en {remaining}…',
  'dsh-live-voice.settings.autoSend.delay': 'Enviar después del silencio',
  'dsh-live-voice.settings.close': 'Cerrar configuración de voz',
  'dsh-live-voice.settings.delivery.label': 'Modo de envío',
  'dsh-live-voice.settings.delivery.manualLabel': 'Desactivado — revisar y enviar manualmente',
  'dsh-live-voice.settings.delivery.queueLabel': 'Cola — añadir automáticamente tras un silencio',
  'dsh-live-voice.settings.delivery.status': 'Envío automático: {mode}',
  'dsh-live-voice.settings.delivery.steerDescription': 'enviar al agente en ejecución',
  'dsh-live-voice.settings.delivery.steerLabel':
    'Redirigir — enviar automáticamente al agente en ejecución',
  'dsh-live-voice.settings.delivery.toggle': 'Modo de envío automático',
  'dsh-live-voice.settings.engine.refresh': 'Actualizar los motores disponibles',
  'dsh-live-voice.settings.filters.title': 'Filtrado',
  'dsh-live-voice.settings.tabs.conversation': 'Conversación',
  'dsh-live-voice.settings.tabs.recognition': 'Reconocimiento de voz',
  'dsh-live-voice.settings.tabs.speak': 'Síntesis de voz',
  'dsh-live-voice.settings.title': 'Configuración de Live Voice',
  'dsh-live-voice.settings.whisper.hostHelp':
    'Configuración para todo el host. Solo se permiten URL HTTP sin autenticación en la interfaz de bucle local (localhost, 127.0.0.1, [::1]). El bucle local se refiere al host de DSH, no a este navegador. Todas las comprobaciones de estado y solicitudes de audio pasan por el servidor con autenticación.',
  'dsh-live-voice.speak.agentContext.enabled': 'Activar el contexto de voz del agente',
  'dsh-live-voice.speak.agentContext.enabledHelp': 'Cuando está activado, el contexto siguiente informa al agente que sus respuestas se leerán en voz alta.',
  'dsh-live-voice.speak.agentContext.help': 'Esta instrucción en inglés se envía al agente solo durante una conversación de voz activa con habla automática del asistente activada.',
  'dsh-live-voice.speak.agentContext.label': 'Contexto de voz del agente',
  'dsh-live-voice.speak.agentContext.restore': 'Restaurar predeterminado',
  'dsh-live-voice.speak.autoPlayback.enabled':
    'Leer automáticamente los nuevos mensajes del asistente en voz alta',
  'dsh-live-voice.speak.autoPlayback.help':
    'Durante una conversación por voz, las frases del asistente se leen automáticamente. La reproducción espera mientras hablas.',
  'dsh-live-voice.speak.autoPlayback.label': 'Lectura automática del asistente',
  'dsh-live-voice.speak.autoPlayback.remainingOne':
    'Lectura automática del asistente: {state} — queda {count} segmento de voz',
  'dsh-live-voice.speak.autoPlayback.remainingOther':
    'Lectura automática del asistente: {state} — quedan {count} segmentos de voz',
  'dsh-live-voice.speak.autoPlayback.status': 'Lectura automática del asistente: {state}',
  'dsh-live-voice.speak.browser.automaticVoice': 'Voz local automática',
  'dsh-live-voice.speak.browser.label': 'Síntesis de voz del navegador — audio en este dispositivo',
  'dsh-live-voice.speak.browser.name': 'Síntesis de voz del navegador',
  'dsh-live-voice.speak.browser.outputHelp':
    'La síntesis de voz del navegador puede ignorar el dispositivo de salida seleccionado; esta API del navegador normalmente utiliza el predeterminado del sistema.',
  'dsh-live-voice.speak.browser.voice': 'Voz local del navegador',
  'dsh-live-voice.speak.engine.label': 'Motor de síntesis de voz',
  'dsh-live-voice.speak.engine.playbackHelp':
    'Qwen y macOS say sintetizan en el host de DSH; el audio AAC/M4A compacto se reproduce en este navegador. La voz del navegador se sintetiza y reproduce en este dispositivo.',
  'dsh-live-voice.speak.filters.code.enabled':
    'Filtrar los bloques de código Markdown antes de leer en voz alta',
  'dsh-live-voice.speak.filters.code.maxLines':
    'Máximo de líneas de los bloques de código que se leerán',
  'dsh-live-voice.speak.filters.code.notice': 'Mira el código en nuestra conversación',
  'dsh-live-voice.speak.filters.code.replacement':
    'Frase de reemplazo para los bloques de código más largos',
  'dsh-live-voice.speak.interruption.disabledHelp':
    'Enviar otro mensaje no detiene el audio del asistente que ya estás escuchando.',
  'dsh-live-voice.speak.interruption.enabled':
    'Detener la lectura en voz alta del asistente cuando envíe un mensaje',
  'dsh-live-voice.speak.interruption.enabledHelp':
    'Enviar un nuevo mensaje de usuario, incluso al agente en ejecución, detiene la lectura en voz alta del asistente, tanto si está reproduciéndose como si está en pausa.',
  'dsh-live-voice.speak.macos.label': 'macOS say — audio en el host',
  'dsh-live-voice.speak.macos.name': 'macOS say',
  'dsh-live-voice.speak.macos.outputHelp':
    'macOS say utiliza la salida seleccionada en el host de DSH.',
  'dsh-live-voice.speak.output.checking': 'Comprobando la salida de voz…',
  'dsh-live-voice.speak.output.device': 'Dispositivo de salida',
  'dsh-live-voice.speak.output.fallbackName': 'Salida de audio',
  'dsh-live-voice.speak.output.stopTest': 'Detener la prueba de voz',
  'dsh-live-voice.speak.output.test': 'Probar la salida de voz seleccionada',
  'dsh-live-voice.speak.output.testPhrase':
    'DSH Live Voice. La salida de voz seleccionada funciona.',
  'dsh-live-voice.speak.output.testing': 'Probando la voz…',
  'dsh-live-voice.speak.playback.message': 'Leer el mensaje en voz alta',
  'dsh-live-voice.speak.playback.pause': 'Pausar la lectura en voz alta',
  'dsh-live-voice.speak.playback.resume': 'Reanudar la lectura en voz alta',
  'dsh-live-voice.speak.playback.stop': 'Detener la lectura en voz alta',
  'dsh-live-voice.speak.playback.stopAll': 'Detener toda la lectura en voz alta',
  'dsh-live-voice.speak.qwen.connection': 'Conexión al servidor Qwen',
  'dsh-live-voice.speak.qwen.endpoint': 'URL base de la API de Qwen',
  'dsh-live-voice.speak.qwen.healthFailed': 'Ha fallado la comprobación de estado de Qwen.',
  'dsh-live-voice.speak.qwen.label': 'Qwen3 TTS — servidor MLX local',
  'dsh-live-voice.speak.qwen.name': 'Qwen3 local',
  'dsh-live-voice.speak.qwen.requestFailed': 'Ha fallado la solicitud de configuración de Qwen.',
  'dsh-live-voice.speak.qwen.restartRequired':
    'Las rutas de configuración de Qwen no están cargadas. Es necesario reiniciar normalmente el servidor DSH para cargar las rutas actualizadas del complemento; no basta con actualizar esta página.',
  'dsh-live-voice.speak.qwen.save': 'Guardar la configuración de Qwen',
  'dsh-live-voice.speak.qwen.saved':
    'Guardado en el host de DSH. Se han cancelado las solicitudes activas de Qwen.',
  'dsh-live-voice.speak.qwen.signInRequired':
    'Inicia sesión en DSH para gestionar la configuración de Qwen.',
  'dsh-live-voice.speak.qwen.test': 'Probar el servidor Qwen',
  'dsh-live-voice.speak.qwen.voice': 'Voz de Qwen',
  'dsh-live-voice.speak.qwen.voiceHelp':
    'Aiden se utiliza de forma predeterminada. Estas voces predefinidas no son voces nativas de portugués brasileño.',
  'dsh-live-voice.speak.qwen.voices.aiden': 'Aiden — masculino, inglés estadounidense',
  'dsh-live-voice.speak.qwen.voices.dylan': 'Dylan — masculino, chino de Pekín',
  'dsh-live-voice.speak.qwen.voices.eric': 'Eric — masculino, chino de Sichuan',
  'dsh-live-voice.speak.qwen.voices.onoAnna': 'Ono Anna — femenino, japonés',
  'dsh-live-voice.speak.qwen.voices.ryan': 'Ryan — masculino, inglés',
  'dsh-live-voice.speak.qwen.voices.serena': 'Serena — femenino, chino',
  'dsh-live-voice.speak.qwen.voices.sohee': 'Sohee — femenino, coreano',
  'dsh-live-voice.speak.qwen.voices.uncleFu': 'Uncle Fu — masculino, chino',
  'dsh-live-voice.speak.qwen.voices.vivian': 'Vivian — femenino, chino',
  'dsh-live-voice.speak.rate.help': 'Velocidad relativa: 1 es la velocidad normal.',
  'dsh-live-voice.speak.rate.label': 'Velocidad de habla',
  'dsh-live-voice.speak.responseDelay.help':
    'Cuando dejas de hablar, la reproducción automática del asistente espera este intervalo de silencio continuo. Si vuelves a hablar, la espera se reinicia.',
  'dsh-live-voice.speak.responseDelay.label': 'Demora de respuesta del asistente',
  'dsh-live-voice.speak.segmentGap.help': 'Espera esta cantidad de milisegundos entre segmentos hablados consecutivos. El valor predeterminado es 200 ms.',
  'dsh-live-voice.speak.segmentGap.label': 'Pausa entre segmentos de voz',
  'dsh-live-voice.speak.status.paused': 'Lectura en pausa',
  'dsh-live-voice.speak.status.playing': 'Hablando',
};

export default Object.freeze(es);
