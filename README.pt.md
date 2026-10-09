# DSH Live Voice

[English (principal)](README.md) | **Português (Brasil)**

Esta é a versão em português. O [README em inglês](README.md) é a referência principal do projeto.

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![Tested DSH](https://img.shields.io/badge/Tested_DSH-v0.2.1--alpha.1-5c5cff?logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.1)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

**Converse com seu assistente de IA, ouça as respostas e leve o contexto das reuniões para a conversa — sem precisar voltar ao teclado a todo momento.**

O DSH Live Voice é um plugin de voz para o DeepSeek Harness (DSH), com prioridade para processamento local, reconhecimento de fala (STT), síntese de voz (TTS) e transcrição de reuniões em tempo real.

*Feito no Brasil 🇧🇷 e testado diariamente com português brasileiro no macOS.*

**Testado e funcionando com o DeepSeek Harness v0.2.1-alpha.1.** A versão testada está registrada no campo `dshTestedVersion` do [manifesto do plugin principal](packages/live-voice/package.json).

## O que você pode fazer?

- **Trabalhar por voz:** dite um pedido, discuta código ou documentos e ouça a resposta do assistente sem perder o foco no trabalho.
- **Fazer perguntas durante reuniões:** capture o áudio compartilhado junto com seu microfone, revise a transcrição e envie o contexto relevante ao assistente enquanto a discussão ainda acontece.
- **Manter o controle:** edite antes de enviar, escolha envio manual ou automático do microfone e pause, retome ou interrompa as respostas faladas.
- **Escolher como usar a voz:** use mecanismos locais quando houver suporte ou configure um serviço HTTP. Priorizar voz local não significa que o DSH ou seu provedor de IA funcionem totalmente offline.

## ⚡ Comece aqui

Instale no perfil web do DSH:

```sh
npx dsh plugin add --profile web dsh-live-voice
```

Na próxima inicialização do DSH, abra **Configurações → Live Voice**.

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
- **O áudio compartilhado da reunião nunca se envia sozinho nem executa comandos de voz.** A transcrição do microfone mantém seu comportamento de envio configurado; escolha envio manual se quiser revisar todo o contexto antes.

A disponibilidade de áudio depende do navegador, sistema operacional e superfície compartilhada. **Não é uma integração nativa com Google Meet ou Teams.** Capturar a reunião e compartilhar a voz do assistente de volta para a chamada exigem configurações separadas. Use fones para reduzir realimentação de áudio e obtenha o consentimento adequado dos participantes antes de capturar uma reunião. A transcrição e as respostas da IA têm latência de processamento: “tempo real” não significa instantâneo nem precisão garantida.

## ✨ Recursos em resumo

- 🎙️ **Ditado por voz:** acrescenta a fala reconhecida ao fim da mensagem, sem substituir suas edições manuais.
- 👐 **Conversa sem teclado:** mantém o diálogo por voz ativo entre sessões de chat.
- ❓ **Perguntas estruturadas por voz:** lê as perguntas do DSH e envia sua resposta falada.
- ⌨️ **Pressione para falar, opcional:** habilite nas configurações, segure `Control` em qualquer lugar da página e solte para colocar a mensagem na fila após o atraso de envio configurado. Desativado por padrão.
- 🎧 **Comportamento adequado à saída de áudio:** escuta controlada ao usar alto-falantes e interrupção com microfone aberto ao usar fones.
- 🗣️ **Comandos falados:** controle envio, silêncio, limpeza e interrupção da leitura com suas frases configuradas. **Ignorando** descarta o ditado do microfone sem encerrar a captura nem desabilitar interrupções por fala. Interrupções automáticas retomam após silêncio estável; pausas manuais aguardam Retomar.
- ⭐ **Barra de fala dedicada:** acompanhe legendas aproximadas com rolagem e destaque, navegue entre trechos e pause, retome ou pare a leitura. O contador mostra o trecho atual e o total. As legendas mostram o texto enviado à síntese, sem prometer sincronização palavra por palavra.
- 🧹 **Leitura adaptada ao Markdown:** remove formatação, anuncia links sem ler URLs inteiras, encurta caminhos e referências de linha, lê listas de tarefas e tabelas e substitui blocos longos de código por um aviso traduzido. Preserva avisos personalizados.
- ⚡ **Ritmo ajustável:** envio automático após 600 ms, 800 ms ou 1–6 segundos (4 segundos por padrão); resposta do assistente sem atraso adicional por padrão, ou com atraso de 1–4 segundos. Reconhecimento e síntese ainda contribuem para a latência.
- 🛠️ **Live Voice Debugger opcional:** instale `dsh-live-voice-debugger` separadamente para inspecionar estado e filas na aba Developer das configurações. O plugin principal funciona sem ele.
- 🏠 **Opções de voz locais:** use mecanismos como Qwen ou Whisper quando houver suporte. Reconhecimento do navegador e serviços HTTP configurados têm seus próprios requisitos de processamento; nem toda configuração mantém o áudio na sua máquina.
- 🌐 **Áudio do host em conexões remotas:** Qwen e macOS Say sintetizam no host do DSH, que entrega áudio compacto ao navegador para reprodução em conexões remotas ou de rede local.

## 🎯 Qual mecanismo de reconhecimento escolher?

| Cenário | Recomendação | RAM | Por quê |
| --- | --- | --- | --- |
| 🇧🇷 **Português no macOS** | **Qwen3 ASR (API HTTP)** | ~1,5 GB | Melhor precisão no uso diário do mantenedor; consumo de RAM informado por ele. Whisper é a segunda opção. |
| 🇺🇸 **Inglês no macOS** | **SpeechRecognition do navegador** | ~0 GB | API do macOS/navegador, rápida e sem RAM adicional. |
| 🪟 **Windows** | **Qwen3 ASR** ou **Whisper HTTP** | ~2–3 GB | Ponto de partida recomendado; reconhecimento do navegador varia no Windows. |
| 🌐 **Multilíngue / outros** | **Whisper HTTP (auto)** | ~2 GB | Detecção automática de idioma em dezenas de línguas. |

Consulte [Como escolher um mecanismo de reconhecimento](docs/CHOOSING-AN-ENGINE.md) para requisitos dos modelos e configuração dos serviços.

## 🌍 Idiomas da interface

A interface do plugin está traduzida para **inglês, português brasileiro, espanhol, francês, hindi e chinês**. Essa lista se refere à interface, não aos idiomas reconhecidos ou falados pelos mecanismos de voz.

## 📚 Documentação

Os guias técnicos abaixo estão em inglês:

- ⚙️ [Configuração e fluxo de conversa](docs/CONFIGURATION.md) — configurações, alto-falantes versus fones, pausas e serviços externos.
- 🧠 [Escolha de mecanismo de reconhecimento](docs/CHOOSING-AN-ENGINE.md) — comparação entre navegador, Qwen3 ASR e Whisper, requisitos de RAM e compatibilidade.
- 📖 [A história do projeto](HISTORY.md) — a motivação humana por trás da coordenação entre escutar e falar.
- 🆕 [Novidades por versão em português](CHANGELOG.pt.md) · [Changelog principal em inglês](CHANGELOG.md).

## 🛠️ Organização do workspace (contribuidores)

Este monorepo pnpm contém dois plugins instaláveis de forma independente:

- `packages/live-voice`: plugin principal, com código, testes, manifesto e bundles próprios.
- `packages/live-voice-debugger`: debugger opcional, com código, testes e manifesto próprios.

Execute `pnpm install --frozen-lockfile`, depois `pnpm build` ou `pnpm test` na raiz. Para compilar apenas um plugin, use `pnpm --filter dsh-live-voice build` ou `pnpm --filter dsh-live-voice-debugger build`. A documentação da raiz cobre ambos. O changelog em inglês da raiz é o histórico principal; a versão em português é sua tradução. Links locais existentes do DSH precisam apontar para os novos diretórios dos pacotes.

## 🤝 Agradecimentos e comunidade

Escutar e falar devem funcionar juntos. Muito obrigado a [GooDAnDReaDY](https://github.com/GooDAnDReaDY) pelo [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) e a [Alan2Z](https://github.com/Alan2Z) pelo [dsh-speak](https://github.com/Alan2Z/dsh-speak), que inspiraram este coordenador unificado. [Leia a história completa](HISTORY.md).

Uso o DSH Live Voice por pelo menos 8 horas todos os dias. Feedback, ideias e contribuições são bem-vindos:

- [Abra uma issue](https://github.com/victorwads/dsh-live-voice/issues)
- [Envie um pull request](https://github.com/victorwads/dsh-live-voice/pulls)

## 📄 Licença

[Apache-2.0](LICENSE).
