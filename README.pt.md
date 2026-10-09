# DSH Live Voice - Você e sua equipe

[English](README.md) | **Português (Brasil)** | [简体中文](README.zh-CN.md)

Esta é a versão em português. O [README em inglês](README.md) é a referência principal do projeto.

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![Tested DSH](https://img.shields.io/badge/Tested_DSH-v0.2.1--alpha.2-5c5cff?logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

**Converse com seu assistente de IA, ouça as respostas e leve o contexto das reuniões para a conversa — sem precisar voltar ao teclado a todo momento.**

O DSH Live Voice é um plugin de voz para o DeepSeek Harness (DSH), com prioridade para processamento local, reconhecimento de fala (STT), síntese de voz (TTS) e transcrição de reuniões em tempo real.

*Feito no Brasil 🇧🇷 e testado diariamente com português brasileiro no macOS.*

**Testado e funcionando com o DeepSeek Harness v0.2.1-alpha.2.** A versão testada está registrada no campo `dshTestedVersion` do [manifesto do plugin principal](packages/live-voice/package.json).

---

## ⚡ Comece aqui

Instale no perfil web do DSH:

```sh
npx dsh plugin add --profile web dsh-live-voice
```

Na próxima inicialização do DSH, abra **Configurações → Live Voice**.

Interface traduzida: 🇺🇸 inglês · 🇧🇷 português brasileiro · 🇪🇸 espanhol · 🇫🇷 francês · 🇮🇳 hindi · 🇨🇳 chinês. Isso se refere à interface, não aos idiomas de reconhecimento ou síntese de voz.

## O que você pode fazer?

- **Trabalhar por voz:** dite um pedido, discuta código ou documentos e ouça a resposta do assistente sem perder o foco no trabalho.
- **Trazer seu assistente de IA para a reunião:** no Google Meet ou Teams, compartilhe sua janela do DSH com áudio para que a equipe acompanhe e ouça as respostas do assistente. Capture o áudio da reunião, revise e envie o contexto relevante e peça ajuda para responder uma pergunta, comparar propostas com o código do projeto ou resumir decisões — ali, no meio da discussão. Compartilhar o áudio de reprodução do assistente exige configuração separada no aplicativo de reunião e depende do suporte do navegador e do sistema; não é uma integração nativa com Meet ou Teams.
- **Manter o controle:** edite antes de enviar, escolha envio manual ou automático do microfone e pause, retome ou interrompa as respostas faladas. **Ignorando** descarta o ditado do microfone sem encerrar a captura nem desabilitar interrupções por fala. Interrupções automáticas retomam após silêncio estável; pausas manuais aguardam Retomar.
- **Escolher como usar a voz:** use mecanismos locais quando houver suporte ou configure um serviço HTTP. Priorizar voz local não significa que o DSH ou seu provedor de IA funcionem totalmente offline.

---

## ✨ Recursos em resumo

- 🎙️ **Ditado por voz:** acrescenta a fala reconhecida ao fim da mensagem, sem substituir suas edições manuais.
- 👐 **Conversa sem teclado:** mantém o diálogo por voz ativo entre sessões de chat.
- ❓ **Perguntas estruturadas por voz:** lê as perguntas do DSH e envia sua resposta falada.
- ⌨️ **Pressione para falar, opcional:** habilite nas configurações, segure `Control` em qualquer lugar da página e solte para colocar a mensagem na fila após o atraso de envio configurado. Desativado por padrão.
- 🎧 **Comportamento adequado à saída de áudio:** escuta controlada ao usar alto-falantes e interrupção com microfone aberto ao usar fones.
- 🗣️ **Comandos falados:** controle envio, silêncio, limpeza e interrupção da leitura com suas frases configuradas.
- ⭐ **Barra de fala dedicada:** acompanhe legendas aproximadas com rolagem e destaque, navegue entre trechos e pause, retome ou pare a leitura. O contador mostra o trecho atual e o total. As legendas mostram o texto enviado à síntese, sem prometer sincronização palavra por palavra.
- 🧹 **Leitura adaptada ao Markdown:** remove formatação, anuncia links sem ler URLs inteiras, encurta caminhos e referências de linha, lê listas de tarefas e tabelas e substitui blocos longos de código por um aviso traduzido. Preserva avisos personalizados.
- ⚡ **Ritmo ajustável:** envio automático após 600 ms, 800 ms ou 1–6 segundos (4 segundos por padrão); resposta do assistente sem atraso adicional por padrão, ou com atraso de 1–4 segundos. Reconhecimento e síntese ainda contribuem para a latência.
- 🛠️ **Live Voice Debugger opcional:** instale `dsh-live-voice-debugger` separadamente para inspecionar estado e filas na aba Developer das configurações. O plugin principal funciona sem ele.
- 🏠 **Opções de voz locais:** use mecanismos como Qwen ou Whisper quando houver suporte. Reconhecimento do navegador e serviços HTTP configurados têm seus próprios requisitos de processamento; nem toda configuração mantém o áudio na sua máquina.
- 🌐 **Seu assistente de voz do DSH, até pelo celular:** acesse seu DSH pela rede de casa ou mesmo estando fora de casa e continue falando com ele (STT) e ouvindo as respostas (TTS) pelo navegador do celular. Com os mecanismos executados no host, o processamento de voz fica no computador do DSH, enquanto o celular captura sua fala e reproduz as respostas — sem precisar instalar modelos locais no telefone. *Eu uso Cloudflare Tunnel com autenticação para acessar meu DSH fora de casa.* Use HTTPS e acesso autenticado; a captura do microfone depende do suporte e da permissão do navegador, inclusive na rede de casa.

## 🧑‍💻 Modo reunião — Transcrição de reuniões em tempo real e perguntas à IA

Mantenha uma transcrição editável enquanto a reunião acontece e faça perguntas ao assistente do DSH sobre a discussão, sem precisar recontar tudo depois. Use em revisões de código, discussões de projeto ou na análise conjunta de uma planilha.

### Da conversa à resposta

1. Selecione **Qwen HTTP** ou **Whisper HTTP** como reconhecimento de fala nas configurações do Live Voice.
2. Clique no ícone de áudio compartilhado ao lado do microfone do campo de mensagem e habilite o áudio na janela de compartilhamento do navegador. Ative também seu microfone para incluir suas próprias falas.
3. Revise a transcrição, acrescente uma pergunta e envie o contexto relevante ao DSH. Por exemplo: *“Quais decisões tomamos até agora?”*, *“Ajude a responder este ponto”* ou *“Compare esta proposta com o código do projeto.”* A resposta depende da transcrição enviada e do código, planilha ou documentos disponibilizados ao agente.
4. Leia ou ouça a resposta enquanto a reunião continua. Para os outros participantes ouvirem, configure separadamente o aplicativo de reunião para compartilhar o áudio de reprodução do assistente.

### Você controla o que é capturado e enviado

- O áudio compartilhado e o microfone têm controles separados e podem ser desligados independentemente. Comandos de voz e respostas faladas continuam disponíveis.
- Com as duas fontes ativas, mudanças de fonte introduzem `Me:` ou `Them:`; trechos consecutivos seguem em novas linhas. Essas marcações distinguem **fontes de áudio, não cada participante da reunião**.
- O botão de relógio **Timestamp**, desativado por padrão, pode acrescentar `[YYYY/MM/DD HH:MM:SS]` aos novos blocos de fonte. Usa a hora local do início do trecho, não a conclusão do reconhecimento, e não reescreve texto anterior.
- As barras do microfone e do áudio compartilhado são espelhadas: o ícone inicial alterna **Ouvindo / Ignorando**, com controles independentes de comandos exatos, timestamps e Manual / Fila / Guiar. Ambas têm a mesma contagem regressiva e cancelamento. Ignorar não encerra a captura; pare o compartilhamento pelo botão de áudio compartilhado no campo de mensagem. Comandos habilitados e envio automático seguem os controles de cada fonte; revise os comandos antes de habilitá-los para participantes.

A disponibilidade de áudio depende do navegador, sistema operacional e superfície compartilhada. **Não é uma integração nativa com Google Meet ou Teams.** Capturar a reunião e compartilhar a voz do assistente de volta para a chamada exigem configurações separadas. Use fones para reduzir realimentação de áudio e obtenha o consentimento adequado dos participantes antes de capturar uma reunião. A transcrição e as respostas da IA têm latência de processamento: “tempo real” não significa instantâneo nem precisão garantida.

## Documentação

Os guias técnicos abaixo estão em inglês:

- [Configuração e fluxo de conversa](docs/CONFIGURATION.md) — configurações, alto-falantes versus fones, pausas e serviços externos.
- [Escolha de mecanismo de reconhecimento](docs/CHOOSING-AN-ENGINE.md) — comparação entre navegador, Qwen3 ASR e Whisper, requisitos de RAM e compatibilidade.
- [A história do projeto](HISTORY.md) — a motivação humana por trás da coordenação entre escutar e falar.
- [Novidades por versão](CHANGELOG.md) — histórico principal em inglês.

---

## Organização do workspace (contribuidores)

Este monorepo pnpm contém dois plugins instaláveis de forma independente:

- `packages/live-voice`: plugin principal, com código, testes, manifesto e bundles próprios.
- `packages/live-voice-debugger`: debugger opcional, com código, testes e manifesto próprios.

Execute `pnpm install --frozen-lockfile`, depois `pnpm build` ou `pnpm test` na raiz. Para compilar apenas um plugin, use `pnpm --filter dsh-live-voice build` ou `pnpm --filter dsh-live-voice-debugger build`. A documentação da raiz cobre ambos. O changelog em inglês da raiz é o histórico principal. Os READMEs dos pacotes apontam para esse histórico. Links locais existentes do DSH precisam apontar para os novos diretórios dos pacotes.

## 🤝 Agradecimentos e comunidade

Escutar e falar devem funcionar juntos. Muito obrigado a [GooDAnDReaDY](https://github.com/GooDAnDReaDY) pelo [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) e a [Alan2Z](https://github.com/Alan2Z) pelo [dsh-speak](https://github.com/Alan2Z/dsh-speak), que inspiraram este coordenador unificado. [Leia a história completa](HISTORY.md).

Uso o DSH Live Voice por pelo menos 8 horas todos os dias. Feedback, ideias e contribuições são bem-vindos:

- [Abra uma issue](https://github.com/victorwads/dsh-live-voice/issues)
- [Envie um pull request](https://github.com/victorwads/dsh-live-voice/pulls)

---

real-time meeting transcription, live meeting transcription, AI questions during meetings, meeting assistant, meeting Q&A, shared audio capture, speech-to-text, text-to-speech, local-first voice assistant, DeepSeek Harness plugin.
transcrição de reuniões em tempo real, transcrição ao vivo, perguntas à IA durante reuniões, assistente de reuniões, perguntas e respostas sobre reuniões, captura de áudio compartilhado, reconhecimento de fala, síntese de voz, assistente de voz com prioridade local, plugin para DeepSeek Harness.
实时会议转写、实时语音转文字、会议中向 AI 提问、AI 会议助手、会议问答、共享音频采集、语音识别、语音合成、本地优先语音助手、DeepSeek Harness 插件。

Licença [Apache-2.0](LICENSE)
