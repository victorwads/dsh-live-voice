import type { LiveVoiceTranslation } from './base.js';

const ptBR: LiveVoiceTranslation = {
  'dsh-live-voice.commons.connection.contactingHost': 'Conectando ao host DSH…',
  'dsh-live-voice.commons.connection.endpoint': 'URL do endpoint',
  'dsh-live-voice.commons.connection.healthEndpoint':
    'URL ou caminho de verificação de integridade',
  'dsh-live-voice.commons.connection.reload': 'Recarregar configurações salvas',
  'dsh-live-voice.commons.connection.test': 'Testar conexão',
  'dsh-live-voice.commons.connection.timeout': 'Tempo limite da requisição (ms)',
  'dsh-live-voice.commons.connection.title': 'Configurações de conexão',
  'dsh-live-voice.commons.connection.unsaved': 'Alterações não salvas',
  'dsh-live-voice.commons.controls.title': 'Controles de voz',
  'dsh-live-voice.commons.conversation.end': 'Encerrar conversa por voz',
  'dsh-live-voice.commons.conversation.idle': 'Conversa inativa',
  'dsh-live-voice.commons.conversation.start': 'Iniciar conversa por voz',
  'dsh-live-voice.commons.delivery.queueBadge': 'FILA',
  'dsh-live-voice.commons.device.numberedLabel': '{device} {number}',
  'dsh-live-voice.commons.dismiss': 'Dispensar',
  'dsh-live-voice.commons.dismissError': 'Dispensar erro de voz',
  'dsh-live-voice.commons.engine.failure': '{engine}: {reason}',
  'dsh-live-voice.commons.input.ignoring': 'ignorando',
  'dsh-live-voice.commons.input.ignoringBadge': 'IGNORANDO',
  'dsh-live-voice.commons.input.listening': 'escutando',
  'dsh-live-voice.commons.input.listeningBadge': 'ESCUTANDO',
  'dsh-live-voice.commons.manual': 'manual',
  'dsh-live-voice.commons.off': 'desativado',
  'dsh-live-voice.commons.on': 'ativada',
  'dsh-live-voice.commons.pluginName': 'Live Voice',
  'dsh-live-voice.commons.queue': 'fila',
  'dsh-live-voice.commons.repository.starLabel': 'Dê uma estrela no GitHub',
  'dsh-live-voice.commons.repository.starLink': 'Dar estrela ao DSH Live Voice no GitHub',
  'dsh-live-voice.commons.seconds': '{seconds} segundos',
  'dsh-live-voice.commons.send': 'ENVIAR',
  'dsh-live-voice.commons.status.ready': 'Voz pronta',
  'dsh-live-voice.commons.systemDefault': 'Padrão do sistema',
  'dsh-live-voice.commons.toggle.offBadge': 'DESATIVADO',
  'dsh-live-voice.commons.unknownLanguage': 'idioma desconhecido',
  'dsh-live-voice.commons.update.label': 'Atualização disponível',
  'dsh-live-voice.commons.update.link': 'Atualização disponível: {version}. Abrir lançamento',
  'dsh-live-voice.commons.update.version': 'Atualização disponível: {version}',
  'dsh-live-voice.commons.version.compatibility': 'Compatível com DSH v{version}',
  'dsh-live-voice.commons.version.compatibilityLink':
    'Compatível com DSH v{version}. Abrir lançamento',
  'dsh-live-voice.commons.version.label': 'DSH Live Voice v{version}',
  'dsh-live-voice.commons.version.link': 'DSH Live Voice v{version}. Abrir versões',
  'dsh-live-voice.commons.version.title': 'Informações da versão',
  'dsh-live-voice.recognition.autoSend.countdownHelp':
    'A contagem regressiva inicia após a frase final reconhecida. Nova fala ou edições cancelam o envio.',
  'dsh-live-voice.recognition.browser.autoInstallPack':
    'Instalar automaticamente este pacote de idioma do navegador quando necessário',
  'dsh-live-voice.recognition.browser.help':
    'Usa a API SpeechRecognition do navegador. Esta é a opção padrão.',
  'dsh-live-voice.recognition.browser.label': 'SpeechRecognition do navegador — Opção padrão',
  'dsh-live-voice.recognition.browser.localProcessing':
    'Processar reconhecimento localmente neste dispositivo',
  'dsh-live-voice.recognition.browser.microphoneHelp':
    'O SpeechRecognition do navegador pode usar o microfone padrão do sistema ou do navegador em vez desta seleção.',
  'dsh-live-voice.recognition.browser.remoteServiceWarning':
    'O reconhecimento pelo serviço do navegador está ativado. O navegador pode enviar o áudio do microfone para o serviço remoto.',
  'dsh-live-voice.recognition.commands.clear': 'Limpar editor de mensagens',
  'dsh-live-voice.recognition.commands.enabled': 'Ativar comandos de voz exatos',
  'dsh-live-voice.recognition.commands.mute': 'Silenciar entrada do editor de mensagens',
  'dsh-live-voice.recognition.commands.queue': 'Adicionar à fila',
  'dsh-live-voice.recognition.commands.resume': 'Retomar entrada do editor de mensagens',
  'dsh-live-voice.recognition.commands.send': 'Enviar ao agente em execução',
  'dsh-live-voice.recognition.commands.stopSpeech': 'Parar fala do assistente',
  'dsh-live-voice.recognition.commands.title': 'Comandos de voz',
  'dsh-live-voice.recognition.dictation.cancel': 'Cancelar ditado',
  'dsh-live-voice.recognition.engine.label': 'Mecanismo de reconhecimento',
  'dsh-live-voice.recognition.headphoneMode.help':
    'O microfone aberto continua ouvindo enquanto as respostas são reproduzidas. Ao detectar sua fala, a reprodução pausa e só continua quando você escolher.',
  'dsh-live-voice.recognition.headphoneMode.label': 'Fones de ouvido — microfone aberto',
  'dsh-live-voice.recognition.holdToTalk.enabled': 'Segure Control para falar',
  'dsh-live-voice.recognition.holdToTalk.help':
    'Com o editor aberto, segure Control em qualquer lugar da página para capturar a fala. Solte para concluir as transcrições pendentes, aguardar o atraso configurado, enfileirar a mensagem e encerrar a captura. Pressione Escape enquanto segura para cancelar.',
  'dsh-live-voice.recognition.language.automatic': 'Automático — detectar idioma',
  'dsh-live-voice.recognition.language.label': 'Idioma de reconhecimento',
  'dsh-live-voice.recognition.manualSend.help':
    'O texto reconhecido permanece no editor até que você use o botão normal de envio do DSH.',
  'dsh-live-voice.recognition.maxUtterance.help':
    'Se a fala nunca pausar, inicia um novo trecho de transcrição após esta duração. Padrão: 60 segundos.',
  'dsh-live-voice.recognition.maxUtterance.label': 'Fala contínua máxima (segundos)',
  'dsh-live-voice.recognition.microphone.checking': 'Verificando disponibilidade do microfone',
  'dsh-live-voice.recognition.microphone.device': 'Dispositivo de entrada',
  'dsh-live-voice.recognition.microphone.failure': 'Microfone: {reason}',
  'dsh-live-voice.recognition.microphone.ignore': 'Ignorar entrada do editor de mensagens',
  'dsh-live-voice.recognition.microphone.inputStatus': 'Entrada do microfone: {state}',
  'dsh-live-voice.recognition.microphone.label': 'Microfone',
  'dsh-live-voice.recognition.microphone.permissionHelp':
    'A permissão do microfone será solicitada apenas quando você iniciar a ditado ou uma conversa por voz.',
  'dsh-live-voice.recognition.microphone.resume': 'Retomar escuta',
  'dsh-live-voice.recognition.microphone.starting': 'Iniciando microfone…',
  'dsh-live-voice.recognition.microphone.takeControl': 'Assumir microfone',
  'dsh-live-voice.recognition.minimumWords.enabled': 'Ignorar trechos curtos de transcrição final',
  'dsh-live-voice.recognition.minimumWords.help':
    'Trechos finais com menos palavras são ignorados antes de chegarem ao editor ou ao envio automático.',
  'dsh-live-voice.recognition.minimumWords.label': 'Mínimo de palavras por trecho final',
  'dsh-live-voice.recognition.mode.label': 'Modo de escuta',
  'dsh-live-voice.recognition.planned.parakeet': 'NVIDIA Parakeet — Em breve',
  'dsh-live-voice.recognition.planned.sherpa': 'sherpa-onnx Streaming — Em breve',
  'dsh-live-voice.recognition.planned.vote': 'Em breve — vote nas issues do repositório',
  'dsh-live-voice.recognition.planned.voxtral': 'Voxtral Realtime — Em breve',
  'dsh-live-voice.recognition.planned.webGpu': 'Inferência WebGPU no navegador — Em breve',
  'dsh-live-voice.recognition.presets.long.description':
    'Aguarda durante pausas de pensamento mais longas.',
  'dsh-live-voice.recognition.presets.long.label': 'Longa',
  'dsh-live-voice.recognition.presets.natural.description': 'Permite pausas normais entre frases.',
  'dsh-live-voice.recognition.presets.natural.label': 'Natural',
  'dsh-live-voice.recognition.presets.short.description': 'Envia rapidamente após uma pausa curta.',
  'dsh-live-voice.recognition.presets.short.label': 'Curta',
  'dsh-live-voice.recognition.providerSettings.help':
    'As configurações do provedor mudam com o mecanismo de reconhecimento selecionado.',
  'dsh-live-voice.recognition.qwen.captureHelp':
    'O áudio é segmentado em trechos completos de fala em WAV e enviado pelo DSH autenticado para o modelo Qwen3 ASR local do host.',
  'dsh-live-voice.recognition.qwen.connectionSuccess':
    'Conexão bem-sucedida. O Qwen ASR e TTS estão carregados. Edições não salvas não foram aplicadas.',
  'dsh-live-voice.recognition.qwen.endpointHelp':
    'API HTTP na URL configurada do host DSH (padrão: http://127.0.0.1:8080/inference). O áudio usa a rota de transcrição autenticada do host DSH.',
  'dsh-live-voice.recognition.qwen.hostHelp':
    'Configurações de todo o host para o servidor Qwen3 ASR + TTS. Insira qualquer URL base HTTP ou HTTPS acessível a partir do host DSH. O navegador acessa através de rotas autenticadas do DSH.',
  'dsh-live-voice.recognition.qwen.label': 'Qwen3 ASR — API HTTP',
  'dsh-live-voice.recognition.silenceDetection.duration':
    'Pausa antes de enviar: {milliseconds} ms',
  'dsh-live-voice.recognition.silenceDetection.help':
    'Controla a duração mínima da pausa antes de enviar a fala capturada para reconhecimento.',
  'dsh-live-voice.recognition.silenceDetection.label': 'Detecção de silêncio',
  'dsh-live-voice.recognition.silenceDetection.pauseLabel': 'Pausa antes de enviar',
  'dsh-live-voice.recognition.silenceDetection.title': 'Configurações de detecção de silêncio',
  'dsh-live-voice.recognition.speakerMode.help':
    'A escuta controlada libera o microfone enquanto as respostas são reproduzidas, evitando que o som dos alto-falantes seja reconhecido. Use "Assumir microfone" para interromper.',
  'dsh-live-voice.recognition.speakerMode.label': 'Alto-falantes — escuta controlada',
  'dsh-live-voice.recognition.status.answer': 'Reconhecendo resposta…',
  'dsh-live-voice.recognition.status.awaitingAnswer': 'Ouvindo sua resposta…',
  'dsh-live-voice.recognition.status.listening': 'Ouvindo — aguardando fala',
  'dsh-live-voice.recognition.status.processing': 'Reconhecendo fala…',
  'dsh-live-voice.recognition.status.unavailable': 'Reconhecimento de voz indisponível',
  'dsh-live-voice.recognition.voiceCommands.help':
    'Separe as frases por vírgulas. A correspondência ignora maiúsculas, acentos, pontuação e espaços extras. Todo o trecho final deve coincidir.',
  'dsh-live-voice.recognition.whisper.captureHelp':
    'O áudio é segmentado em trechos completos de fala em WAV, enviado através do DSH autenticado e processado pelo whisper.cpp HTTP em loopback.',
  'dsh-live-voice.recognition.whisper.connectionSuccess':
    'Conexão bem-sucedida. O endpoint de verificação respondeu; a transcrição não foi testada. Edições não salvas não foram aplicadas.',
  'dsh-live-voice.recognition.whisper.endpointHelp':
    'API HTTP na URL base configurada (padrão: http://127.0.0.1:8080/). Compatível com POST /v1/audio/transcriptions.',
  'dsh-live-voice.recognition.whisper.healthFailed':
    'Falha na verificação de integridade do Whisper.',
  'dsh-live-voice.recognition.whisper.label': 'Whisper — API HTTP',
  'dsh-live-voice.recognition.whisper.requestFailed':
    'Falha na requisição de configurações do Whisper.',
  'dsh-live-voice.recognition.whisper.restartRequired':
    'As rotas de configuração do Whisper não estão carregadas. É necessário reiniciar o servidor DSH normalmente para carregar rotas atualizadas do plugin; atualizar apenas esta página não é suficiente.',
  'dsh-live-voice.recognition.whisper.save': 'Salvar configurações do Whisper',
  'dsh-live-voice.recognition.whisper.saved':
    'Salvo no host DSH. Requisições ativas de transcrição do host foram canceladas.',
  'dsh-live-voice.recognition.whisper.signInRequired':
    'Faça login no DSH para gerenciar as configurações do Whisper.',
  'dsh-live-voice.settings.autoSend.cancel': 'Cancelar envio automático',
  'dsh-live-voice.settings.autoSend.countdown': 'Enviando em {remaining}…',
  'dsh-live-voice.settings.autoSend.delay': 'Enviar após o silêncio',
  'dsh-live-voice.settings.close': 'Fechar configurações de voz',
  'dsh-live-voice.settings.delivery.label': 'Modo de envio',
  'dsh-live-voice.settings.delivery.manualLabel': 'Desativado — revisar e enviar manualmente',
  'dsh-live-voice.settings.delivery.queueLabel': 'Fila — adicionar automaticamente após o silêncio',
  'dsh-live-voice.settings.delivery.status': 'Entrega automática: {mode}',
  'dsh-live-voice.settings.delivery.steerDescription': 'enviar ao agente em execução',
  'dsh-live-voice.settings.delivery.steerLabel':
    'Enviar — encaminhar automaticamente ao agente em execução',
  'dsh-live-voice.settings.delivery.toggle': 'Modo de entrega automática',
  'dsh-live-voice.settings.engine.refresh': 'Atualizar mecanismos disponíveis',
  'dsh-live-voice.settings.filters.title': 'Filtragem',
  'dsh-live-voice.settings.tabs.conversation': 'Conversa',
  'dsh-live-voice.settings.tabs.recognition': 'Reconhecimento de voz',
  'dsh-live-voice.settings.tabs.speak': 'Fala',
  'dsh-live-voice.settings.title': 'Configurações do Live Voice',
  'dsh-live-voice.settings.whisper.hostHelp':
    'Configurações para todo o host. Apenas URLs HTTP loopback não autenticadas (localhost, 127.0.0.1, [::1]) são permitidas. Loopback refere-se ao host DSH, não a este navegador. Todas as verificações de integridade e requisições de áudio passam pelo backend autenticado.',
  'dsh-live-voice.speak.agentContext.enabled': 'Ativar contexto de voz do agente',
  'dsh-live-voice.speak.agentContext.enabledHelp':
    'Quando ativado, o contexto abaixo informa ao agente que suas respostas serão faladas em voz alta.',
  'dsh-live-voice.speak.agentContext.help':
    'Esta instrução em inglês é enviada ao agente somente durante uma conversa por voz ativa com fala automática do assistente ativada.',
  'dsh-live-voice.speak.agentContext.label': 'Contexto de voz do agente',
  'dsh-live-voice.speak.agentContext.restore': 'Restaurar padrão',
  'dsh-live-voice.speak.autoPlayback.enabled':
    'Falar automaticamente novas mensagens do assistente',
  'dsh-live-voice.speak.autoPlayback.help':
    'Durante uma conversa por voz, as frases do assistente são anunciadas automaticamente. A reprodução aguarda enquanto você fala.',
  'dsh-live-voice.speak.autoPlayback.label': 'Fala automática do assistente',
  'dsh-live-voice.speak.autoPlayback.remainingOne':
    'Fala automática do assistente: {state} — resta {count} segmento de fala',
  'dsh-live-voice.speak.autoPlayback.remainingOther':
    'Fala automática do assistente: {state} — restam {count} segmentos de fala',
  'dsh-live-voice.speak.autoPlayback.status': 'Fala automática do assistente: {state}',
  'dsh-live-voice.speak.browser.automaticVoice': 'Voz local automática',
  'dsh-live-voice.speak.browser.label': 'Fala do navegador — áudio neste dispositivo',
  'dsh-live-voice.speak.browser.name': 'Fala do navegador',
  'dsh-live-voice.speak.browser.outputHelp':
    'A síntese de fala do navegador pode ignorar o dispositivo de saída selecionado; esta API normalmente segue o padrão do sistema.',
  'dsh-live-voice.speak.browser.voice': 'Voz local do navegador',
  'dsh-live-voice.speak.engine.label': 'Mecanismo de fala',
  'dsh-live-voice.speak.engine.playbackHelp':
    'Qwen e macOS say sintetizam no host do DSH; o áudio AAC/M4A compacto é reproduzido neste navegador. A fala do navegador é sintetizada e reproduzida neste dispositivo.',
  'dsh-live-voice.speak.filters.code.enabled': 'Filtrar blocos de código Markdown antes de falar',
  'dsh-live-voice.speak.filters.code.maxLines':
    'Ler blocos de código até esta quantidade de linhas',
  'dsh-live-voice.speak.filters.code.notice': 'Veja o código na nossa conversa',
  'dsh-live-voice.speak.filters.code.replacement': 'Frase substituta para blocos de código maiores',
  'dsh-live-voice.speak.interruption.disabledHelp':
    'Enviar outra mensagem não interrompe o áudio do assistente que você já está ouvindo.',
  'dsh-live-voice.speak.interruption.enabled':
    'Parar fala do assistente quando eu enviar uma mensagem',
  'dsh-live-voice.speak.interruption.enabledHelp':
    'Enviar ou direcionar uma nova mensagem interrompe a fala atual ou pausada do assistente.',
  'dsh-live-voice.speak.macos.label': 'macOS say — áudio no host',
  'dsh-live-voice.speak.macos.name': 'macOS say',
  'dsh-live-voice.speak.macos.outputHelp': 'O macOS say usa a saída selecionada no host DSH.',
  'dsh-live-voice.speak.output.checking': 'Verificando saída de fala…',
  'dsh-live-voice.speak.output.device': 'Dispositivo de saída',
  'dsh-live-voice.speak.output.fallbackName': 'Saída de áudio',
  'dsh-live-voice.speak.output.stopTest': 'Parar teste de fala',
  'dsh-live-voice.speak.output.test': 'Testar saída de fala selecionada',
  'dsh-live-voice.speak.output.testPhrase':
    'DSH Live Voice. A saída de fala selecionada está funcionando.',
  'dsh-live-voice.speak.output.testing': 'Testando fala…',
  'dsh-live-voice.speak.playback.message': 'Falar mensagem',
  'dsh-live-voice.speak.playback.next': 'Pular para o próximo trecho de fala',
  'dsh-live-voice.speak.playback.pause': 'Pausar fala',
  'dsh-live-voice.speak.playback.resume': 'Retomar fala',
  'dsh-live-voice.speak.playback.stop': 'Parar de falar',
  'dsh-live-voice.speak.playback.stopAll': 'Parar toda a fala',
  'dsh-live-voice.speak.qwen.connection': 'Conexão com servidor Qwen',
  'dsh-live-voice.speak.qwen.endpoint': 'URL base da API Qwen',
  'dsh-live-voice.speak.qwen.healthFailed': 'Falha na verificação de integridade do Qwen.',
  'dsh-live-voice.speak.qwen.label': 'Qwen3 TTS — servidor MLX local',
  'dsh-live-voice.speak.qwen.name': 'Qwen3 local',
  'dsh-live-voice.speak.qwen.requestFailed': 'Falha na requisição de configurações do Qwen.',
  'dsh-live-voice.speak.qwen.restartRequired':
    'As rotas de configuração do Qwen não estão carregadas. É necessário reiniciar o servidor DSH normalmente para carregar rotas atualizadas do plugin; atualizar apenas esta página não é suficiente.',
  'dsh-live-voice.speak.qwen.save': 'Salvar configurações do Qwen',
  'dsh-live-voice.speak.qwen.saved':
    'Salvo no host DSH. Requisições ativas do Qwen foram canceladas.',
  'dsh-live-voice.speak.qwen.signInRequired':
    'Faça login no DSH para gerenciar as configurações do Qwen.',
  'dsh-live-voice.speak.qwen.test': 'Testar servidor Qwen',
  'dsh-live-voice.speak.qwen.voice': 'Voz Qwen',
  'dsh-live-voice.speak.qwen.voiceHelp':
    'Aiden é usado por padrão. Estas vozes predefinidas não são vozes nativas em Português do Brasil.',
  'dsh-live-voice.speak.qwen.voices.aiden': 'Aiden — masculino, inglês americano',
  'dsh-live-voice.speak.qwen.voices.dylan': 'Dylan — masculino, chinês de Pequim',
  'dsh-live-voice.speak.qwen.voices.eric': 'Eric — masculino, chinês de Sichuan',
  'dsh-live-voice.speak.qwen.voices.onoAnna': 'Ono Anna — feminino, japonês',
  'dsh-live-voice.speak.qwen.voices.ryan': 'Ryan — masculino, inglês',
  'dsh-live-voice.speak.qwen.voices.serena': 'Serena — feminino, chinês',
  'dsh-live-voice.speak.qwen.voices.sohee': 'Sohee — feminino, coreano',
  'dsh-live-voice.speak.qwen.voices.uncleFu': 'Uncle Fu — masculino, chinês',
  'dsh-live-voice.speak.qwen.voices.vivian': 'Vivian — feminino, chinês',
  'dsh-live-voice.speak.rate.help': 'A velocidade relativa 1 é normal.',
  'dsh-live-voice.speak.rate.label': 'Velocidade da fala',
  'dsh-live-voice.speak.responseDelay.help':
    'Depois que você parar de falar, a reprodução automática do assistente aguardará esse tempo de silêncio contínuo. Falar novamente reinicia a contagem.',
  'dsh-live-voice.speak.responseDelay.label': 'Atraso da resposta do assistente',
  'dsh-live-voice.speak.segmentGap.help':
    'Aguarde esta quantidade de milissegundos entre trechos falados consecutivos. O padrão é 400 ms.',
  'dsh-live-voice.speak.segmentGap.label': 'Pausa entre trechos de fala',
  'dsh-live-voice.speak.status.paused': 'Fala pausada',
  'dsh-live-voice.speak.status.playing': 'Falando',
};

export default Object.freeze(ptBR);
