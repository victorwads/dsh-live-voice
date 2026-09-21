import type { LiveVoiceTranslation } from './base.js';

const fr: LiveVoiceTranslation = {
  'dsh-live-voice.commons.connection.contactingHost': 'Connexion à l’hôte DSH…',
  'dsh-live-voice.commons.connection.endpoint': 'URL du point d’accès',
  'dsh-live-voice.commons.connection.healthEndpoint': 'URL ou chemin de vérification de l’état',
  'dsh-live-voice.commons.connection.reload': 'Recharger les paramètres enregistrés',
  'dsh-live-voice.commons.connection.test': 'Tester la connexion',
  'dsh-live-voice.commons.connection.timeout': 'Délai d’expiration des requêtes (ms)',
  'dsh-live-voice.commons.connection.title': 'Paramètres de connexion',
  'dsh-live-voice.commons.connection.unsaved': 'Modifications non enregistrées',
  'dsh-live-voice.commons.controls.title': 'Contrôles vocaux',
  'dsh-live-voice.commons.conversation.end': 'Terminer la conversation vocale',
  'dsh-live-voice.commons.conversation.idle': 'Conversation inactive',
  'dsh-live-voice.commons.conversation.start': 'Démarrer une conversation vocale',
  'dsh-live-voice.commons.delivery.queueBadge': 'FILE',
  'dsh-live-voice.commons.device.numberedLabel': '{device} {number}',
  'dsh-live-voice.commons.dismiss': 'Fermer',
  'dsh-live-voice.commons.dismissError': 'Masquer l’erreur vocale',
  'dsh-live-voice.commons.engine.failure': '{engine} : {reason}',
  'dsh-live-voice.commons.input.ignoring': 'entrée ignorée',
  'dsh-live-voice.commons.input.ignoringBadge': 'ENTRÉE IGNORÉE',
  'dsh-live-voice.commons.input.listening': 'à l’écoute',
  'dsh-live-voice.commons.input.listeningBadge': 'À L’ÉCOUTE',
  'dsh-live-voice.commons.manual': 'manuel',
  'dsh-live-voice.commons.off': 'désactivé',
  'dsh-live-voice.commons.on': 'activé',
  'dsh-live-voice.commons.pluginName': 'Live Voice',
  'dsh-live-voice.commons.queue': 'file d’attente',
  'dsh-live-voice.commons.repository.starLabel': 'Soutenez-nous avec une étoile sur GitHub',
  'dsh-live-voice.commons.repository.starLink': 'Attribuer une étoile à DSH Live Voice sur GitHub',
  'dsh-live-voice.commons.seconds': '{seconds} secondes',
  'dsh-live-voice.commons.send': 'ENVOYER',
  'dsh-live-voice.commons.status.ready': 'Fonctions vocales prêtes',
  'dsh-live-voice.commons.systemDefault': 'Valeur par défaut du système',
  'dsh-live-voice.commons.toggle.offBadge': 'DÉSACTIVÉ',
  'dsh-live-voice.commons.unknownLanguage': 'langue inconnue',
  'dsh-live-voice.commons.update.label': 'Mise à jour disponible',
  'dsh-live-voice.commons.update.link':
    'Mise à jour disponible : {version}. Ouvrir la page de cette version',
  'dsh-live-voice.commons.update.version': 'Mise à jour disponible : {version}',
  'dsh-live-voice.commons.version.compatibility': 'Compatible avec DSH v{version}',
  'dsh-live-voice.commons.version.compatibilityLink':
    'Compatible avec DSH v{version}. Ouvrir la page de cette version',
  'dsh-live-voice.commons.version.label': 'DSH Live Voice v{version}',
  'dsh-live-voice.commons.version.link': 'DSH Live Voice v{version}. Ouvrir la liste des versions',
  'dsh-live-voice.commons.version.title': 'Informations de version',
  'dsh-live-voice.recognition.autoSend.countdownHelp':
    'Le compte à rebours démarre après la reconnaissance définitive d’une phrase. Toute nouvelle parole ou modification l’annule.',
  'dsh-live-voice.recognition.browser.autoInstallPack':
    'Installer automatiquement ce pack linguistique du navigateur si nécessaire',
  'dsh-live-voice.recognition.browser.help':
    'Utilise l’API SpeechRecognition du navigateur. Il s’agit de l’option par défaut.',
  'dsh-live-voice.recognition.browser.label': 'SpeechRecognition du navigateur — Option par défaut',
  'dsh-live-voice.recognition.browser.localProcessing':
    'Effectuer la reconnaissance localement sur cet appareil',
  'dsh-live-voice.recognition.browser.microphoneHelp':
    'SpeechRecognition peut utiliser le microphone par défaut du navigateur ou du système plutôt que celui sélectionné ici.',
  'dsh-live-voice.recognition.browser.remoteServiceWarning':
    'La reconnaissance via le service du navigateur est activée. Le navigateur peut envoyer le son du microphone à son service de reconnaissance.',
  'dsh-live-voice.recognition.commands.clear': 'Vider la zone de rédaction',
  'dsh-live-voice.recognition.commands.enabled':
    'Activer les commandes vocales par correspondance exacte',
  'dsh-live-voice.recognition.commands.mute':
    'Suspendre la saisie vocale dans la zone de rédaction',
  'dsh-live-voice.recognition.commands.queue': 'Mettre en file d’attente',
  'dsh-live-voice.recognition.commands.resume':
    'Reprendre la saisie vocale dans la zone de rédaction',
  'dsh-live-voice.recognition.commands.send': 'Envoyer à l’agent en cours d’exécution',
  'dsh-live-voice.recognition.commands.stopSpeech': 'Arrêter la lecture vocale de l’assistant',
  'dsh-live-voice.recognition.commands.title': 'Commandes vocales',
  'dsh-live-voice.recognition.dictation.cancel': 'Annuler la dictée',
  'dsh-live-voice.recognition.engine.label': 'Moteur de reconnaissance',
  'dsh-live-voice.recognition.headphoneMode.help':
    'Le microphone ouvert continue d’écouter pendant la lecture des réponses. Lorsque votre voix est détectée, la lecture se met en pause et ne reprend que lorsque vous le décidez.',
  'dsh-live-voice.recognition.headphoneMode.label': 'Casque — microphone ouvert',
  'dsh-live-voice.recognition.holdToTalk.enabled': 'Maintenir Ctrl pour parler',
  'dsh-live-voice.recognition.holdToTalk.help':
    'Lorsqu’une zone de rédaction est ouverte, maintenez Ctrl n’importe où sur la page pour capturer votre voix. Relâchez la touche pour traiter la transcription en attente, attendre le délai d’envoi configuré, mettre le message en file d’attente et arrêter la capture vocale. Appuyez sur Échap tout en maintenant Ctrl pour annuler.',
  'dsh-live-voice.recognition.language.automatic': 'Automatique — détecter la langue',
  'dsh-live-voice.recognition.language.label': 'Langue de reconnaissance',
  'dsh-live-voice.recognition.manualSend.help':
    'Le texte reconnu reste dans la zone de rédaction jusqu’à ce que vous utilisiez le bouton d’envoi habituel de DSH.',
  'dsh-live-voice.recognition.maxUtterance.help':
    'Si vous parlez sans pause, un nouveau segment de transcription commence après cette durée. Valeur par défaut : 60 secondes.',
  'dsh-live-voice.recognition.maxUtterance.label': 'Durée maximale de parole continue (secondes)',
  'dsh-live-voice.recognition.microphone.checking':
    'Vérification de la disponibilité du microphone',
  'dsh-live-voice.recognition.microphone.device': 'Périphérique d’entrée',
  'dsh-live-voice.recognition.microphone.failure': 'Microphone : {reason}',
  'dsh-live-voice.recognition.microphone.ignore':
    'Ignorer la saisie vocale dans la zone de rédaction',
  'dsh-live-voice.recognition.microphone.inputStatus': 'Entrée du microphone : {state}',
  'dsh-live-voice.recognition.microphone.label': 'Microphone',
  'dsh-live-voice.recognition.microphone.permissionHelp':
    'L’autorisation d’utiliser le microphone ne sera demandée que lorsque vous démarrerez une dictée ou une conversation vocale.',
  'dsh-live-voice.recognition.microphone.resume': 'Reprendre l’écoute',
  'dsh-live-voice.recognition.microphone.starting': 'Démarrage du microphone…',
  'dsh-live-voice.recognition.microphone.takeControl': 'Prendre le contrôle du microphone',
  'dsh-live-voice.recognition.minimumWords.enabled':
    'Ignorer les segments définitifs de transcription trop courts',
  'dsh-live-voice.recognition.minimumWords.help':
    'Les segments définitifs contenant moins de mots sont ignorés avant d’atteindre la zone de rédaction ou l’envoi automatique.',
  'dsh-live-voice.recognition.minimumWords.label': 'Nombre minimal de mots par segment définitif',
  'dsh-live-voice.recognition.mode.label': 'Mode d’écoute',
  'dsh-live-voice.recognition.planned.parakeet': 'NVIDIA Parakeet — Bientôt disponible',
  'dsh-live-voice.recognition.planned.sherpa': 'sherpa-onnx en continu — Bientôt disponible',
  'dsh-live-voice.recognition.planned.vote': 'Bientôt disponible — votez dans les tickets du dépôt',
  'dsh-live-voice.recognition.planned.voxtral': 'Voxtral Realtime — Bientôt disponible',
  'dsh-live-voice.recognition.planned.webGpu':
    'Inférence WebGPU dans le navigateur — Bientôt disponible',
  'dsh-live-voice.recognition.presets.long.description':
    'Attend pendant les pauses de réflexion plus longues.',
  'dsh-live-voice.recognition.presets.long.label': 'Longue',
  'dsh-live-voice.recognition.presets.natural.description':
    'Autorise des pauses normales entre les phrases.',
  'dsh-live-voice.recognition.presets.natural.label': 'Naturelle',
  'dsh-live-voice.recognition.presets.short.description':
    'Envoie rapidement après une courte pause.',
  'dsh-live-voice.recognition.presets.short.label': 'Courte',
  'dsh-live-voice.recognition.providerSettings.help':
    'Les paramètres du fournisseur dépendent du moteur de reconnaissance sélectionné.',
  'dsh-live-voice.recognition.qwen.captureHelp':
    'Le son est découpé en énoncés complets au format WAV, puis envoyé via DSH avec authentification au modèle Qwen3 ASR exécuté localement sur l’hôte.',
  'dsh-live-voice.recognition.qwen.connectionSuccess':
    'Connexion réussie. Qwen ASR et TTS sont tous deux chargés. Les modifications non enregistrées n’ont pas été appliquées.',
  'dsh-live-voice.recognition.qwen.endpointHelp':
    'API HTTP à l’URL configurée sur l’hôte DSH (par défaut : http://127.0.0.1:8080/inference). Le son passe par la route de transcription authentifiée de l’hôte DSH.',
  'dsh-live-voice.recognition.qwen.hostHelp':
    'Paramètres communs à tout l’hôte pour le serveur Qwen3 ASR + TTS. Saisissez une URL de base HTTP ou HTTPS accessible depuis l’hôte DSH. Le navigateur y accède via les routes authentifiées de DSH.',
  'dsh-live-voice.recognition.qwen.label': 'Qwen3 ASR — API HTTP',
  'dsh-live-voice.recognition.silenceDetection.duration': 'Pause avant l’envoi : {milliseconds} ms',
  'dsh-live-voice.recognition.silenceDetection.help':
    'Détermine la durée de pause nécessaire avant que la parole capturée soit envoyée pour reconnaissance.',
  'dsh-live-voice.recognition.silenceDetection.label': 'Détection du silence',
  'dsh-live-voice.recognition.silenceDetection.pauseLabel': 'Pause avant l’envoi',
  'dsh-live-voice.recognition.silenceDetection.title': 'Paramètres de détection du silence',
  'dsh-live-voice.recognition.speakerMode.help':
    'L’écoute contrôlée libère le microphone pendant la lecture des réponses pour éviter que le son des haut-parleurs soit reconnu. Utilisez « Prendre le contrôle du microphone » pour interrompre la lecture.',
  'dsh-live-voice.recognition.speakerMode.label': 'Haut-parleurs — écoute contrôlée',
  'dsh-live-voice.recognition.status.answer': 'Reconnaissance de la réponse…',
  'dsh-live-voice.recognition.status.awaitingAnswer': 'Écoute de votre réponse…',
  'dsh-live-voice.recognition.status.listening': 'Écoute — en attente de parole',
  'dsh-live-voice.recognition.status.processing': 'Reconnaissance vocale…',
  'dsh-live-voice.recognition.status.unavailable': 'Reconnaissance vocale indisponible',
  'dsh-live-voice.recognition.voiceCommands.help':
    'Séparez les expressions par des virgules. La comparaison ignore la casse, les accents, la ponctuation et les espaces superflus. Le segment définitif entier doit correspondre.',
  'dsh-live-voice.recognition.whisper.captureHelp':
    'Le son est découpé en énoncés complets au format WAV, transmis via DSH avec authentification, puis traité par le serveur HTTP whisper.cpp sur l’interface de bouclage.',
  'dsh-live-voice.recognition.whisper.connectionSuccess':
    'Connexion réussie. Le point d’accès de vérification de l’état a répondu ; la transcription n’a pas été testée. Les modifications non enregistrées n’ont pas été appliquées.',
  'dsh-live-voice.recognition.whisper.endpointHelp':
    'API HTTP à l’URL de base configurée (par défaut : http://127.0.0.1:8080/). Compatible avec POST /v1/audio/transcriptions.',
  'dsh-live-voice.recognition.whisper.healthFailed':
    'La vérification de l’état de Whisper a échoué.',
  'dsh-live-voice.recognition.whisper.label': 'Whisper — API HTTP',
  'dsh-live-voice.recognition.whisper.requestFailed':
    'La requête relative aux paramètres de Whisper a échoué.',
  'dsh-live-voice.recognition.whisper.restartRequired':
    'Les routes de configuration de Whisper ne sont pas chargées. Un redémarrage normal du serveur DSH est nécessaire pour charger les routes mises à jour du plugin ; actualiser cette page ne suffit pas.',
  'dsh-live-voice.recognition.whisper.save': 'Enregistrer les paramètres de Whisper',
  'dsh-live-voice.recognition.whisper.saved':
    'Enregistré sur l’hôte DSH. Les requêtes de transcription actives sur l’hôte ont été annulées.',
  'dsh-live-voice.recognition.whisper.signInRequired':
    'Connectez-vous à DSH pour gérer les paramètres de Whisper.',
  'dsh-live-voice.settings.autoSend.cancel': 'Annuler l’envoi automatique',
  'dsh-live-voice.settings.autoSend.countdown': 'Envoi dans {remaining}…',
  'dsh-live-voice.settings.autoSend.delay': 'Envoyer après le silence',
  'dsh-live-voice.settings.close': 'Fermer les paramètres vocaux',
  'dsh-live-voice.settings.delivery.label': 'Mode d’envoi',
  'dsh-live-voice.settings.delivery.manualLabel': 'Désactivé — vérifier et envoyer manuellement',
  'dsh-live-voice.settings.delivery.queueLabel':
    'File d’attente — ajout automatique après un silence',
  'dsh-live-voice.settings.delivery.status': 'Envoi automatique : {mode}',
  'dsh-live-voice.settings.delivery.steerDescription': 'envoyer à l’agent en cours d’exécution',
  'dsh-live-voice.settings.delivery.steerLabel':
    'Réorienter — envoyer automatiquement à l’agent en cours d’exécution',
  'dsh-live-voice.settings.delivery.toggle': 'Mode d’envoi automatique',
  'dsh-live-voice.settings.engine.refresh': 'Actualiser les moteurs disponibles',
  'dsh-live-voice.settings.filters.title': 'Filtrage',
  'dsh-live-voice.settings.tabs.conversation': 'Conversation',
  'dsh-live-voice.settings.tabs.recognition': 'Reconnaissance vocale',
  'dsh-live-voice.settings.tabs.speak': 'Synthèse vocale',
  'dsh-live-voice.settings.title': 'Paramètres de Live Voice',
  'dsh-live-voice.settings.whisper.hostHelp':
    'Paramètres communs à tout l’hôte. Seules les URL HTTP sans authentification sur l’interface de bouclage (localhost, 127.0.0.1, [::1]) sont autorisées. Le bouclage désigne l’hôte DSH, pas ce navigateur. Toutes les vérifications d’état et requêtes audio passent par le serveur avec authentification.',
  'dsh-live-voice.speak.agentContext.enabled': 'Activer le contexte vocal de l’agent',
  'dsh-live-voice.speak.agentContext.enabledHelp': 'Lorsqu’il est activé, le contexte ci-dessous indique à l’agent que ses réponses seront lues à voix haute.',
  'dsh-live-voice.speak.agentContext.help': 'Cette instruction en anglais est envoyée à l’agent seulement pendant une conversation vocale active avec la parole automatique de l’assistant activée.',
  'dsh-live-voice.speak.agentContext.label': 'Contexte vocal de l’agent',
  'dsh-live-voice.speak.agentContext.restore': 'Restaurer la valeur par défaut',
  'dsh-live-voice.speak.autoPlayback.enabled':
    'Lire automatiquement les nouveaux messages de l’assistant',
  'dsh-live-voice.speak.autoPlayback.help':
    'Pendant une conversation vocale, les phrases de l’assistant sont lues automatiquement. La lecture attend pendant que vous parlez.',
  'dsh-live-voice.speak.autoPlayback.label': 'Lecture automatique de l’assistant',
  'dsh-live-voice.speak.autoPlayback.remainingOne':
    'Lecture automatique de l’assistant : {state} — {count} segment vocal restant',
  'dsh-live-voice.speak.autoPlayback.remainingOther':
    'Lecture automatique de l’assistant : {state} — {count} segments vocaux restants',
  'dsh-live-voice.speak.autoPlayback.status': 'Lecture automatique de l’assistant : {state}',
  'dsh-live-voice.speak.browser.automaticVoice': 'Voix locale automatique',
  'dsh-live-voice.speak.browser.label': 'Synthèse vocale du navigateur — son sur cet appareil',
  'dsh-live-voice.speak.browser.name': 'Synthèse vocale du navigateur',
  'dsh-live-voice.speak.browser.outputHelp':
    'La synthèse vocale du navigateur peut ignorer le périphérique de sortie sélectionné ; cette API du navigateur utilise normalement celui défini par défaut sur le système.',
  'dsh-live-voice.speak.browser.voice': 'Voix locale du navigateur',
  'dsh-live-voice.speak.engine.label': 'Moteur de synthèse vocale',
  'dsh-live-voice.speak.engine.playbackHelp':
    'Qwen et macOS say synthétisent sur l’hôte DSH ; l’audio AAC/M4A compact est lu dans ce navigateur. La synthèse vocale du navigateur est générée et lue sur cet appareil.',
  'dsh-live-voice.speak.filters.code.enabled':
    'Filtrer les blocs de code Markdown avant la lecture vocale',
  'dsh-live-voice.speak.filters.code.maxLines': 'Nombre maximal de lignes des blocs de code à lire',
  'dsh-live-voice.speak.filters.code.notice': 'Consultez le code dans notre conversation',
  'dsh-live-voice.speak.filters.code.replacement':
    'Phrase de remplacement pour les blocs de code plus longs',
  'dsh-live-voice.speak.interruption.disabledHelp':
    'L’envoi d’un autre message n’arrête pas la lecture vocale de l’assistant que vous écoutez déjà.',
  'dsh-live-voice.speak.interruption.enabled':
    'Arrêter la lecture vocale de l’assistant lorsque j’envoie un message',
  'dsh-live-voice.speak.interruption.enabledHelp':
    'L’envoi d’un nouveau message utilisateur, y compris à l’agent en cours d’exécution, arrête la lecture vocale de l’assistant, qu’elle soit en cours ou en pause.',
  'dsh-live-voice.speak.macos.label': 'macOS say — son sur l’hôte',
  'dsh-live-voice.speak.macos.name': 'macOS say',
  'dsh-live-voice.speak.macos.outputHelp':
    'macOS say utilise la sortie sélectionnée sur l’hôte DSH.',
  'dsh-live-voice.speak.output.checking': 'Vérification de la sortie vocale…',
  'dsh-live-voice.speak.output.device': 'Périphérique de sortie',
  'dsh-live-voice.speak.output.fallbackName': 'Sortie audio',
  'dsh-live-voice.speak.output.stopTest': 'Arrêter le test vocal',
  'dsh-live-voice.speak.output.test': 'Tester la sortie vocale sélectionnée',
  'dsh-live-voice.speak.output.testPhrase':
    'DSH Live Voice. La sortie vocale sélectionnée fonctionne.',
  'dsh-live-voice.speak.output.testing': 'Test vocal en cours…',
  'dsh-live-voice.speak.playback.message': 'Lire le message à voix haute',
  'dsh-live-voice.speak.playback.pause': 'Mettre la lecture en pause',
  'dsh-live-voice.speak.playback.resume': 'Reprendre la lecture',
  'dsh-live-voice.speak.playback.stop': 'Arrêter la lecture',
  'dsh-live-voice.speak.playback.stopAll': 'Arrêter toute lecture',
  'dsh-live-voice.speak.qwen.connection': 'Connexion au serveur Qwen',
  'dsh-live-voice.speak.qwen.endpoint': 'URL de base de l’API Qwen',
  'dsh-live-voice.speak.qwen.healthFailed': 'La vérification de l’état de Qwen a échoué.',
  'dsh-live-voice.speak.qwen.label': 'Qwen3 TTS — serveur MLX local',
  'dsh-live-voice.speak.qwen.name': 'Qwen3 local',
  'dsh-live-voice.speak.qwen.requestFailed': 'La requête relative aux paramètres de Qwen a échoué.',
  'dsh-live-voice.speak.qwen.restartRequired':
    'Les routes de configuration de Qwen ne sont pas chargées. Un redémarrage normal du serveur DSH est nécessaire pour charger les routes mises à jour du plugin ; actualiser cette page ne suffit pas.',
  'dsh-live-voice.speak.qwen.save': 'Enregistrer les paramètres de Qwen',
  'dsh-live-voice.speak.qwen.saved':
    'Enregistré sur l’hôte DSH. Les requêtes Qwen actives ont été annulées.',
  'dsh-live-voice.speak.qwen.signInRequired':
    'Connectez-vous à DSH pour gérer les paramètres de Qwen.',
  'dsh-live-voice.speak.qwen.test': 'Tester le serveur Qwen',
  'dsh-live-voice.speak.qwen.voice': 'Voix Qwen',
  'dsh-live-voice.speak.qwen.voiceHelp':
    'Aiden est utilisé par défaut. Ces voix prédéfinies ne sont pas des voix natives du portugais brésilien.',
  'dsh-live-voice.speak.qwen.voices.aiden': 'Aiden — homme, anglais américain',
  'dsh-live-voice.speak.qwen.voices.dylan': 'Dylan — homme, chinois de Pékin',
  'dsh-live-voice.speak.qwen.voices.eric': 'Eric — homme, chinois du Sichuan',
  'dsh-live-voice.speak.qwen.voices.onoAnna': 'Ono Anna — femme, japonais',
  'dsh-live-voice.speak.qwen.voices.ryan': 'Ryan — homme, anglais',
  'dsh-live-voice.speak.qwen.voices.serena': 'Serena — femme, chinois',
  'dsh-live-voice.speak.qwen.voices.sohee': 'Sohee — femme, coréen',
  'dsh-live-voice.speak.qwen.voices.uncleFu': 'Uncle Fu — homme, chinois',
  'dsh-live-voice.speak.qwen.voices.vivian': 'Vivian — femme, chinois',
  'dsh-live-voice.speak.rate.help': 'Vitesse relative : 1 correspond à la vitesse normale.',
  'dsh-live-voice.speak.rate.label': 'Débit de parole',
  'dsh-live-voice.speak.responseDelay.help':
    'Après que vous avez cessé de parler, la lecture automatique de l’assistant attend cette durée de silence continu. Si vous reparlez, l’attente recommence.',
  'dsh-live-voice.speak.responseDelay.label': 'Délai de réponse de l’assistant',
  'dsh-live-voice.speak.segmentGap.help': 'Attend ce nombre de millisecondes entre des segments vocaux consécutifs. La valeur par défaut est 200 ms.',
  'dsh-live-voice.speak.segmentGap.label': 'Pause entre les segments vocaux',
  'dsh-live-voice.speak.status.paused': 'Lecture en pause',
  'dsh-live-voice.speak.status.playing': 'Lecture en cours',
};

export default Object.freeze(fr);
