# Histórico de alterações

[English — CHANGELOG.md](CHANGELOG.md) é a fonte canônica. Este documento é uma tradução para português brasileiro, não um histórico de versões independente.

Todas as alterações relevantes do DSH Live Voice estão documentadas neste arquivo.

[Visão geral em português](README.pt.md) · [Product overview in English](README.md)

## [Next] - Não lançado

### Correções de bugs

- Coordena a fala da reunião com a atividade do microfone: bloqueia a fila durante fala, pausa para participantes confirmados nos modos Alto-falantes ou Fones e solicita exclusão do próprio áudio/aba, com filtro de transcrição repetida. Áudio misturado do sistema não permite garantir separação de eco.

- Mantém a captura de áudio compartilhado da reunião ao trocar de chat, encaminha novas transcrições apenas ao compositor ativo e libera a captura ao parar explicitamente, encerrar o compartilhamento no navegador ou desativar o plugin.

- Evita a leitura automática do histórico ao trocar de chat: usa o primeiro snapshot preenchido como base e ignora histórico carregado posteriormente, preservando novas respostas em streaming.

### Interface e acessibilidade

- Traduz o nome visível do Live Voice nos cinco catálogos de interface não ingleses e no depurador opcional, preservando os identificadores dos pacotes e o nome em inglês. Traduz o rótulo acessível do link para dar uma estrela no GitHub, em vez de fixá-lo em inglês.

### Documentação

- Adiciona traduções do README e do changelog para português brasileiro com links recíprocos; mantém o inglês como histórico canônico de versões.
- Reorganiza os READMEs da raiz e do pacote com foco nos fluxos de voz e casos de uso em reuniões, esclarece os requisitos de compartilhamento de áudio e os limites da abordagem local-first e adiciona termos de busca em inglês, português brasileiro e chinês simplificado.
- Atualiza as orientações para contribuidores para manter as traduções alinhadas e a documentação pública centrada nos benefícios.

### Validação

- Adiciona regressões de DOM para seleção do reconhecimento Browser e configuração do processamento local, nomes de produto e rótulos acessíveis traduzidos e traduções do depurador. Recompila os dois bundles de cliente a partir dos fontes atuais.
- Inclui as alterações de configurações do macOS Say, reprodução de falas mantidas, diagnósticos e versões dos pacotes sincronizadas em 0.4.1, documentadas na seção 0.4.1 abaixo.

### Correções de bugs

- Mantém o reconhecimento de voz do navegador selecionável quando Qwen/Whisper está indisponível ou o reconhecimento local não é compatível. Não usa a capacidade do motor de reconhecimento atual para desativar a opção Browser; permite selecionar o navegador para ajustar o processamento local, preservando as verificações de disponibilidade antes da captura.

## [0.4.1] - 2026-10-07

### Alterações da versão

Escolha e edite a voz do macOS Say diretamente nas Configurações. Ao mudar a voz ou o mecanismo de fala, respostas reproduzidas novamente passam a usar sua escolha atual, em vez de uma anterior. Os dois pacotes de plugins recebem juntos a versão 0.4.1.

### Alterações de configuração

- Exibe a preferência de voz existente quando macOS say está selecionado. Permite editar o nome exato da voz disponível no host ou limpar o campo para usar a voz padrão do macOS; preserva as preferências salvas até que sejam explicitamente editadas.
- Adiciona orientações de voz traduzidas nos seis idiomas da interface, incluindo o comando de Terminal para listar as vozes do host. Salva as edições quando o campo perde o foco, de forma consistente com as demais configurações de texto.

### Correções de bugs

- Determina o mecanismo de saída atual ao reproduzir falas mantidas, em vez de reutilizar o mecanismo armazenado no item de reprodução anterior.
- Descarta e gera novamente o áudio preparado quando o mecanismo, a voz, o idioma, a velocidade ou o dispositivo de saída muda. Impede que a conclusão de preparações desatualizadas substitua áudios mais recentes.

### Verificações de compilação e lançamento

- Adiciona testes de regressão das Configurações para roteamento HTTP do macOS say, edições explícitas da voz, limpeza da voz e relato de erros sem recorrer silenciosamente ao navegador; adiciona regressões de reprodução de falas mantidas para mudanças de mecanismo de saída e voz.
- Expõe os mecanismos de fala configurados e ativos e o endpoint ativo do host nos diagnósticos somente leitura, sem registrar o conteúdo da fala.

## [0.4.0] - 2026-10-07

### Alterações da versão

Leve seu assistente de IA para a reunião: capture o áudio compartilhado junto com sua voz, revise a transcrição e envie contexto com perguntas enquanto a discussão continua. Uma nova barra de fala ajuda a acompanhar respostas com legendas aproximadas ao vivo, navegar entre trechos e pausar ou retomar a reprodução. As respostas começam a ser faladas mais cedo e o Markdown fica mais fácil de ouvir. A versão também melhora o envio de mensagens e a recuperação do microfone, oferece timestamps opcionais e um debugger instalável separadamente e ajusta os padrões de conversa. O áudio compartilhado da reunião não é enviado automaticamente. Os dois pacotes recebem juntos a versão 0.4.0; as mudanças de compilação para contribuidores estão listadas separadamente abaixo.

### Recursos

- ⭐⭐ **Modo Reunião** — leve seu agente DSH para a conversa, não apenas para o trabalho que você faz depois da reunião.
  - Capture sua voz e o áudio compartilhado dos outros participantes durante uma chamada, mantendo uma transcrição editável pronta para enviar ao agente sem precisar recontar a discussão.
  - Quando alguém fizer uma pergunta, envie o contexto relevante da reunião com um pedido como “Ajude-nos a responder este ponto”. O agente pode combinar essa discussão com o código do projeto, a planilha ou os documentos que você disponibilizou no DSH.
  - Deixe o agente responder em voz alta. Quando o aplicativo de reunião estiver configurado para compartilhar o áudio reproduzido pelo agente, todos poderão ouvir a resposta — abrindo espaço para uma conversa entre você, o agente e as outras pessoas na chamada.
  - Use em revisões de código, discussões de projeto ou no trabalho conjunto em uma planilha no Google Meet, Teams ou outro aplicativo de reunião, onde o navegador e o sistema operacional oferecerem suporte ao compartilhamento de áudio. A captura do áudio da reunião e o compartilhamento da voz do agente de volta para a chamada exigem configurações de compartilhamento separadas; não se trata de uma integração embutida com aplicativos de reunião.
  - Mantenha o controle do que chega ao agente: revise e edite a transcrição, diferencie suas contribuições da conversa compartilhada com `Me:`/`Them:` e inclua marcações de tempo se desejar. Inicie ou pare cada fonte de áudio de forma independente; o áudio compartilhado da reunião não se envia sozinho nem executa comandos de voz.
- Normaliza Markdown para fala usando o parser Marked: remove a formatação visual, anuncia links e imagens sem ler URLs completas, encurta caminhos de arquivos com referências de linha, lê listas de tarefas e cabeçalhos/linhas de tabelas e abrevia identificadores longos. Usa o mesmo texto normalizado na reprodução e nas legendas ao vivo, preservando o limite existente de linhas de blocos de código.
- ⭐ **Barra de fala dedicada com legendas ao vivo** — uma nova barra de 52px acima dos controles de reconhecimento.
  - Exibe legendas aproximadas em uma única linha com o excesso recortado, usando a temporização do áudio do host ou uma estimativa da síntese nativa que leva as pausas em conta; as legendas não são alinhadas palavra por palavra.
  - Posiciona os controles anterior/próximo em lados opostos do texto, com pausar/retomar, parar e um contador de segmento atual/total. Mantém a tomada de controle pelo microfone na barra de reconhecimento.
  - Exibe legendas com rolagem suave e um destaque móvel aproximado. Mostra a linha fina de progresso apenas durante o carregamento de áudio com progresso indeterminado, reservando seu espaço durante a reprodução para evitar mudanças no layout e respeitando as preferências de redução de movimento.
  - Divide os itens iniciais de fala na pontuação de fim de frase ou nos dois-pontos, nunca nas vírgulas, enquanto prepara os áudios seguintes em paralelo.
  - Mantém a barra visível entre segmentos e conserva o histórico agrupado por mensagem e o áudio preparado até que a reprodução termine ou seja parada.
- Adiciona o Live Voice Debugger como um pacote separado e opcional no mesmo repositório. Sua instalação adiciona uma aba Desenvolvedor nas Configurações do Live Voice; o plugin principal funciona sem o depurador e não inclui sua interface no próprio pacote.
- Abre o inspetor somente leitura em uma janela separada do navegador, com painéis de estado e eventos que rolam de forma independente, inspeção de filas, filtragem por módulo, pausa/retomada e limpeza de eventos e atualização selecionável de 1–20 Hz (10 Hz por padrão). Mantém o histórico de diagnóstico limitado e o conteúdo textual oculto, salvo quando explicitamente habilitado.
- Adiciona testes de regressão com adaptadores simulados e DOM para transições de estado, segmentação, ativação opcional, tratamento de popups, controles de eventos e frequência de atualização.

### Alterações de configuração

- Define o atraso da resposta do assistente como zero por padrão e oferece apenas as opções sem atraso ou de 1–4 segundos. Preserva valores salvos compatíveis e redefine valores não compatíveis para zero.

- Desativa por padrão a opção de manter Control pressionado para falar; mantém a opção disponível para ativação voluntária e preserva as preferências salvas.
- Oferece atrasos de envio automático de 600 ms, 800 ms e 1–6 segundos, com rótulos de duração traduzidos. Mantém 4 segundos como padrão e redefine atrasos salvos não compatíveis para esse padrão.

### Verificações de compilação e lançamento

- Mantém um único histórico de alterações na raiz do repositório, vinculado pelo README do pacote, em vez de manter um histórico de versões duplicado dentro do pacote.

- Reorganiza o repositório como um workspace pnpm com dois pacotes completos de plugins em `packages/live-voice` e `packages/live-voice-debugger`, cada um com código-fonte, testes, manifestos e bundles de execução separados. Atualiza compilações, caminhos de links locais, CI e caminhos de publicação para o monorepo.

- Mantém alinhadas as versões dos pacotes principal e depurador. Rejeita divergências durante as compilações, a CI e o fluxo de publicação. O depurador é um pacote público. O fluxo manual de publicação via OIDC permite publicar os dois pacotes ou apenas um deles; nenhum push dispara uma publicação.

### Correções de bugs

- Unifica o layout das barras de voz: fala/legendas ao vivo primeiro, reconhecimento de áudio compartilhado em segundo e microfone por último, com espaçamento uniforme de 2px. Move a alternância entre escutar/ignorar para a esquerda sem duplicá-la, mantém a posição na fila apenas na barra de fala e deixa a alternância de fala automática sempre disponível no editor de mensagens, entre o áudio compartilhado e o microfone. Estabiliza a animação da forma de onda nas atualizações de estado.
- Corrige o envio por voz que entrava na fila quando o DSH usa Steer para o Enter normal. Usa Enter sem modificadores para direcionar o agente e Ctrl+Enter para o modo oposto, em vez de presumir que a ação pública de envio segue a preferência de Enter enquanto o agente está ocupado.
- Corrige a reprodução manual de um turno que lia apenas a mensagem final do assistente. Lê todas as respostas visíveis do assistente no turno selecionado, na ordem das etapas, incluindo mensagens intermediárias e excluindo mensagens do usuário, raciocínio oculto e outros turnos.
- Recupera-se de `OverconstrainedError` ao abrir um microfone selecionado: limpa e persiste apenas a seleção do dispositivo de entrada e tenta novamente uma vez com o padrão do sistema. Preserva preferências não relacionadas, erros de permissão, cancelamento e seleções de dispositivo mais recentes.
- Corrige o envio nos modos Steer e Queue para ambas as políticas de Enter do DSH enquanto o agente está ocupado. Adiciona uma pergunta traduzida e persistida sobre o que Enter faz atualmente no DSH do usuário; a resposta controla o mapeamento entre Enter normal e Ctrl+Enter do Live Voice sem alterar as configurações do DSH. Mantém Queue como padrão de compatibilidade e aplica as mudanças no momento do envio a envios automáticos, comandos falados e ao gesto de manter a tecla pressionada para falar. Expõe esse enum não sensível no retrato existente das configurações do depurador sem habilitar a inspeção do conteúdo textual. Adiciona regressões de normalização, configurações montadas, gestos do editor de mensagens e depurador.
- Preserva o cursor de edição, a seleção nos sentidos direto/inverso, o foco e a posição de rolagem do editor de mensagens ao acrescentar o ditado final. Restaura a seleção depois que o DSH reconstrói os nós do editor e notifica sua ponte de seleção; Limpar explicitamente continua sendo uma ação separada.
- Mantém os comandos falados Enviar e Enfileirar como ações de envio pontuais. Eles não habilitam mais o envio automático, não alteram seu modo nem persistem uma preferência diferente de envio. O envio manual continua manual após um comando falado; os modos automáticos existentes permanecem inalterados.
- Adiciona regressões de envio por comando falado nos modos Manual, Queue e Steer, incluindo preferências inalteradas, ausência de gravações nas configurações e comportamento do ditado subsequente.

## [0.3.2] - 2026-10-06

### Alterações da versão

O controle por voz fica mais imediato: o novo perfil padrão Curto envia a fala capturada para reconhecimento após 500 ms de silêncio, reduzindo a espera antes da transcrição e da execução de comandos de voz. O mantenedor relata uma experiência perceptivelmente mais ágil no uso diário. Isso reduz o atraso de segmentação, não o tempo de inferência do modelo, e não representa uma alegação de maior precisão no reconhecimento. Natural, Longo e Personalizado continuam disponíveis para pausas maiores. Todas as preferências do Live Voice agora ficam no servidor DSH em vez do armazenamento do navegador, para que os navegadores conectados ao mesmo host carreguem a mesma configuração salva. As preferências antigas do navegador não são migradas intencionalmente; configure-as novamente uma vez após a atualização.

### Alterações

- Ajusta os perfis de detecção de silêncio para Curto (500 ms, agora o padrão), Natural (1000 ms) e Longo (2000 ms).
- Adiciona um perfil de silêncio Personalizado persistido, com entrada em milissegundos inteiros de 100 a 10.000 ms para captura Qwen e Whisper, traduzido para todos os idiomas de interface compatíveis.
- Move todas as preferências do Live Voice para persistência autenticada no servidor, incluindo mecanismos, idiomas, seleções de dispositivos, política de conversa, temporização de silêncio, atrasos de resposta/envio, filtros, comandos de voz e texto editável de contexto para respostas faladas.
- Salva as configurações normalizadas de forma atômica, com permissões de arquivo exclusivas do proprietário, e serializa atualizações parciais para preservar preferências não relacionadas durante salvamentos simultâneos.
- Remove do plugin as leituras e gravações no armazenamento do navegador; mantém os metadados de verificação de novas versões apenas em memória.
- Adiciona erros traduzidos de carregamento/salvamento no servidor nos seis idiomas da interface, sem recorrer ao armazenamento do navegador.
- Adiciona cobertura de regressão para persistência após recriação do armazenamento do host e entre clientes independentes, atualizações simultâneas, permissões de arquivo, requisições inválidas, armazenamento corrompido e preferências antigas do navegador ignoradas.

### Correções de bugs

- Faz o ditado apenas acrescentar texto: adiciona os trechos finais reconhecidos ao fim do editor de mensagens atual e mantém as hipóteses provisórias fora do texto. O texto existente e as edições manuais são preservados; Limpar explicitamente e o envio normal continuam sendo ações separadas.
- Aceita atualizações manuais do editor quando o React omite o eco exato de uma gravação anterior feita por voz, impedindo que trechos posteriores restaurem retratos desatualizados do rascunho. Silenciamento, cancelamento, comandos e frases curtas rejeitadas deixam de fazer gravações desnecessárias de todo o rascunho.
- Adiciona regressões com componentes montados para ecos de voz omitidos, substituição manual, publicações atrasadas e trechos finais que apenas acrescentam texto; documenta esse contrato do ciclo de vida.
- Preserva espaços, vírgulas, quebras de linha e entradas inacabadas durante a edição de comandos de voz e outras configurações. Normaliza e salva o texto apenas quando o campo perde o foco, não a cada tecla digitada.
- Centraliza campos de texto, áreas de texto e campos numéricos em um único componente compartilhado de campo de rascunho. Atualizações do componente pai e respostas atrasadas do servidor não sobrescrevem mais uma edição ativa; rascunhos numéricos inválidos restauram o valor salvo quando o campo perde o foco.
- Aplica o mesmo comportamento de salvar apenas ao perder o foco aos campos de conexão Qwen e Whisper e permite campos de comandos de voz vazios sem restaurar frases de fallback.
- Adiciona regressões para digitação sem normalização imediata, comandos separados por vírgulas, salvamento apenas ao perder o foco, atualizações tardias do componente pai, texto vazio, validação numérica e restauração de padrões.

### Notas de atualização

- As preferências antigas do navegador não são importadas. O primeiro carregamento sem preferências salvas no servidor usa os padrões; configure o Live Voice novamente. As configurações de conexão Qwen e Whisper já armazenadas no host permanecem inalteradas.
- Reinicie o servidor DSH após atualizar para carregar a nova rota de configurações e depois atualize o navegador. Atualizar apenas a página não é suficiente.
- As seleções de dispositivos também são compartilhadas, mas o dispositivo selecionado precisa existir e estar utilizável no navegador atual. As permissões do microfone e as instalações de pacotes de idioma do navegador continuam sendo recursos gerenciados pelo navegador.

**Histórico completo:** https://github.com/victorwads/dsh-live-voice/compare/v0.3.1...v0.3.2

## [0.3.1] - 2026-10-03

### Alterações da versão

Esta versão simplifica a interface das Configurações, permite uploads maiores para reconhecimento Qwen e confirma a compatibilidade com a versão atual testada do DSH.

### Alterações

- Agrupa as configurações principais de fala, reconhecimento e conversa em seções Geral recolhidas, com ícones nas abas e nos títulos das subseções.
- Inicia as configurações de detecção de silêncio recolhidas e mantém o status dos recursos de reconhecimento visível fora da seção Geral.
- Adiciona o rótulo da seção Geral a todos os idiomas de interface compatíveis e atualiza a cobertura de regressão de acessibilidade e de componentes montados.

### Documentação

- Divide as orientações para agentes e a documentação de arquitetura por aplicação, módulo de domínio e limites do sistema de design compartilhado.

### Correções de bugs

- Aumenta o limite padrão de upload de áudio para reconhecimento Qwen de 2 MB para 50 MB e adiciona cobertura de regressão para uploads maiores que 2 MB.
- Obtém o selo de versão instalada e o cenário de teste de versão mais recente a partir dos metadados do pacote, em vez de versões do plugin fixadas no código.

### Compatibilidade

- Confirma a compatibilidade testada com DeepSeek Harness **0.2.0-rc.2** e corrige o link da versão testada.

**Histórico completo:** https://github.com/victorwads/dsh-live-voice/compare/v0.3.0...v0.3.1

## [0.3.0] - 2026-09-24

### Alterações da versão

Esta versão adiciona tradução multilíngue integrada ao DSH, contexto de voz para o agente, reprodução mais fluida do áudio do host e uma base modular para o desenvolvimento futuro.

### Recursos

- Traduz a interface do plugin para inglês, português (Brasil), espanhol, francês, hindi e chinês por meio do serviço de idiomas do DSH. O idioma da interface continua independente do idioma de reconhecimento, do idioma de síntese e dos comandos de voz definidos pelo usuário.
- Adiciona um contexto configurável do Live Voice para respostas do agente, com escopo por sessão. Durante uma conversa por voz ativa com respostas faladas automáticas habilitadas, o agente recebe uma orientação editável de que sua resposta destinada ao usuário será lida em voz alta.
- Adiciona um editor em inglês para o contexto do Live Voice e a ação Restaurar padrão nas configurações de Fala; os rótulos e a ajuda da interface continuam traduzidos.
- Padroniza a fala gerada no host como áudio compacto AAC/M4A reproduzido no navegador: macOS `say` e Qwen sintetizam internamente em WAV, o host DSH transcodifica o áudio antes do transporte e até três segmentos seguintes são sintetizados antecipadamente para reduzir intervalos.
- Adiciona uma pausa configurável entre segmentos consecutivos de fala, com padrão de 400 ms para um ritmo mais natural.
- Adiciona o controle Próximo para a fala, que pula apenas o segmento atual, inicia imediatamente o próximo segmento da fila e preserva a fala já enfileirada e a que continua chegando por streaming.

### Correções de bugs

- Preserva espaços e edições em andamento nas configurações de texto até que o campo perca o foco e então normaliza e salva o valor.
- Faz o envio automático no modo Steer usar o gesto acelerado Ctrl/Cmd+Enter do editor de mensagens do DSH em vez da ação pública de envio normal, para que as mensagens sejam enviadas ao agente em execução em vez de entrarem silenciosamente em sua fila. Adiciona uma regressão de ciclo de vida para o gesto.
- Elimina sincronizações duplicadas do contexto de voz para que a requisição PUT seja disparada apenas quando os dados realmente mudarem, em vez de a cada atualização de estado do coordenador.
- Impede que a fala automática do assistente no modo alto-falante tome a vez do usuário. A reprodução passa a aguardar a conclusão de todas as transcrições pendentes no backend e do contador de envio automático e da tentativa de envio, evitando reconhecimento cancelado, transcrições descartadas e envio automático interrompido.
- Marca como consumido o histórico visível do assistente ao reiniciar a conversa por voz, para que respostas anteriores e textos recebidos por streaming enquanto o modo de voz estava desligado não sejam reproduzidos novamente.

### Alterações

- Migra os componentes de interface React para TSX e organiza a implementação em raízes de composição da aplicação, módulos de domínio e um sistema de design reutilizável.
- Adiciona um workspace de componentes Preview.js com cenários sintéticos das barras de voz e das Configurações para desenvolvimento isolado da interface.
- Altera a licença do projeto e os metadados do pacote de GPL-3.0-only para Apache-2.0.

### Documentação

- Adiciona guias específicos de configuração, seleção de mecanismos, arquitetura, revisão e ciclo de vida da voz.
- Atualiza o comando de início rápido para instalar o plugin no perfil web do DSH.

**Histórico completo:** https://github.com/victorwads/dsh-live-voice/compare/v0.2.3...v0.3.0

## [0.2.3] - 2026-09-21

### Alterações da versão

Esta versão torna as atualizações do plugin e as informações de versão testada visíveis nas Configurações e esclarece o planejamento dos mecanismos de reconhecimento.

### Recursos

- Adiciona uma notificação de atualização nas configurações do Live Voice quando uma versão mais recente está disponível no GitHub. A verificação ocorre no máximo uma vez a cada 24 horas e a ação abre a versão correspondente.
- Exibe a versão instalada do Live Voice e a versão testada do DSH no cabeçalho das configurações.
- Exibe Browser WebGPU Inference, sherpa-onnx Streaming, NVIDIA Parakeet e Voxtral Realtime como mecanismos de reconhecimento futuros e desabilitados.

### Alterações

- Renomeia as opções de mecanismos de reconhecimento para descrever a API utilizada: Browser SpeechRecognition, Qwen3 ASR HTTP API e Whisper HTTP API.
- Exibe a URL HTTP esperada ou a rota de transcrição do mecanismo de reconhecimento selecionado.

### Correções de bugs

- Evita requisições repetidas ao GitHub quando a API de versões está indisponível, armazenando em cache as verificações que falharam pelo mesmo intervalo de 24 horas.
- Trata corretamente tags de versão com `v` inicial e identificadores de pré-lançamento ao decidir se uma atualização é mais recente.
- Ignora URLs de versões inesperadas e usa a página de versões do repositório como fallback.

### Documentação

- Melhora a clareza do README e remove conteúdo duplicado.

**Histórico completo:** https://github.com/victorwads/dsh-live-voice/compare/v0.2.2...v0.2.3

## [0.2.2] - 2026-09-19

### Recursos

- Adiciona um gesto global opcional de pressionar Control para falar, que funciona enquanto um editor de mensagens está montado, mesmo com o modo de voz normal desligado. Ao soltar Control, conclui o processamento das transcrições enfileiradas, aguarda o atraso configurado de envio automático, enfileira o rascunho concluído uma única vez e encerra a captura; Escape cancela o gesto.

### Alterações

- Aumenta por padrão o trecho máximo de transcrição de fala contínua de 20 para 60 segundos no reconhecimento Whisper HTTP e Qwen HTTP. Adiciona uma configuração de Reconhecimento de fala que permite definir o limite de 10 a 300 segundos; falas sem interrupção são divididas e enviadas para transcrição apenas após a duração selecionada.

### Correções de bugs

- Serializa os segmentos de transcrição Whisper HTTP e Qwen HTTP por meio de uma fila FIFO por sessão, preservando a ordem de captura enquanto o microfone continua gravando.
- Adia o início do contador de envio automático enquanto há segmentos de transcrição na fila ou uma requisição ativa.
- Descarta os segmentos enfileirados e aborta a requisição ativa quando o reconhecimento para, além de zerar a contagem de transcrições pendentes do coordenador.
- Adiciona testes de regressão para requisições serializadas, resultados ordenados, cancelamento do trabalho enfileirado e bloqueio do envio automático até que a fila de transcrição fique vazia.

### Compatibilidade

- Registra que a versão mais recente do DSH testada com este plugin é **0.1.6-alpha.2**.

## [0.2.1] - 2026-09-19

### Documentação

- Reorienta o README para a experiência com prioridade local e sem usar as mãos, incluindo conversas contínuas, perguntas estruturadas faladas, comandos de voz e comportamento ao navegar entre chats.
- Amplia as palavras-chave de descoberta do pacote e do README para voz sem usar as mãos, IA conversacional, prompts falados, mecanismos de fala Qwen3 e Apple Silicon.

### Alterações

- Atualiza as dependências de desenvolvimento existentes.

### Correções de bugs

- Persiste o estado habilitado ou silenciado do microfone como preferência global e propaga as alterações de configurações para todos os controladores de voz ativos. Novos controladores passam a herdar o estado salvo do microfone e as informações de recursos disponíveis são atualizadas após mudanças sincronizadas nas configurações.
- Mantém os controles de microfone, conversa e Falar disponíveis quando o DSH omite o armazenamento legado `uiSession.pendingInteractions`. O tratamento por voz de perguntas estruturadas permanece inativo quando esse armazenamento opcional está indisponível.
- Adiciona cobertura de regressão para a normalização global do estado do microfone e para a montagem dos controles de voz sem o armazenamento legado de interações pendentes.

## [0.2.0] - Não lançado

### Alterações da versão

Esta versão amplia o controle de conversa, o roteamento de áudio, a filtragem de fala e a organização das configurações.

### Recursos

- Adiciona respostas sem usar as mãos às perguntas estruturadas do DSH no modo de conversa por voz: narra cada pergunta, captura a próxima resposta falada como resposta personalizada, envia-a automaticamente e mantém a barra de status do Live Voice visível sobre o painel de perguntas.
- Adiciona preferências de dispositivos de entrada e saída de áudio.
- Adiciona um modo de envio com três estados: revisão manual, envio para a fila e direcionamento imediato do agente.
- Adiciona filtragem configurável da entrada de fala, incluindo filtro de quantidade mínima de palavras nos resultados finais do reconhecimento.
- Adiciona filtragem configurável da saída de fala para omitir blocos de código das respostas faladas.
- Adiciona comandos de voz por correspondência exata para encerrar uma conversa, silenciar ou retomar a escuta, parar a fala, limpar a entrada e enviar ou enfileirar o texto reconhecido. Os comandos aceitam várias frases separadas por vírgulas e normalizam pontuação, maiúsculas/minúsculas e acentos apenas durante a correspondência.
- Adiciona uma contagem dos segmentos de fala restantes ao controle de fala automática; ele permanece expandido enquanto há fala na fila.
- Usa a mesma segmentação apenas por quebras de linha e a mesma fila para fala automática por streaming e ações manuais de Falar.
- Adiciona configurações do Live Voice em abas para organizar fala, conversa, comandos e opções avançadas.

### Alterações

- Melhora os controles do Live Voice e a interface de configurações para os estados de envio, dispositivos, filtragem, comandos, entrada do microfone e fila de fala.
- Amplia a cobertura de testes do coordenador, das configurações, dos componentes e dos filtros.
- Atualiza os bundles compilados de cliente e servidor para a nova funcionalidade.
- Inclui este histórico de alterações no pacote publicado.

### Correções de bugs

- Mantém o modo de conversa por voz ativo ao navegar entre chats. Quando o editor de mensagens atual é substituído, o chat recém-montado retoma automaticamente o modo de voz; apenas uma ação explícita de Encerrar conversa por voz o desabilita. Os rascunhos do editor continuam isolados por conversa, enquanto o descarte interno de controladores e as transferências de controle do hardware deixam de contar como encerramento da conversa solicitado pelo usuário.
- Adiciona cobertura de regressão do ciclo de vida para troca de chats com o modo de voz ativo e para preservar um encerramento explícito nos chats subsequentes.
- Exige pelo menos uma palavra reconhecida antes que a atividade do microfone no modo fone de ouvido possa pausar a fala do assistente; atividade de áudio sozinha não pausa mais a reprodução.
- Aplica debounce às interrupções no modo fone de ouvido para reduzir pausas indevidas causadas por eventos curtos de reconhecimento.
- Retoma a fala automaticamente quando uma possível interrupção termina sem se tornar uma fala válida do usuário.
- Preserva o comportamento de pausa manual separadamente do tratamento de interrupções automáticas.

## [0.1.0] - 2026-09-15

### Correções de bugs

- Reinicia de forma confiável o reconhecimento de fala do navegador após seu encerramento ou um erro.
- Permite uma URL base HTTP ou HTTPS personalizada para o serviço de fala Qwen3 local no host.

## [0.0.2] - 2026-09-15

### Recursos

- Adiciona suporte a Apple MLX local no host para Qwen3-ASR e Qwen3-TTS.
- Adiciona seleção de voz Qwen TTS nas configurações do Live Voice.
- Amplia os controles do Live Voice e sua cobertura de integração.
- Adiciona integração contínua, um hook de pre-push, configuração de formatação e validação dos artefatos de distribuição.

### Alterações

- Atualiza as integrações do coordenador de conversa, microfone, reconhecimento, síntese, Whisper e `say` nativo do macOS para os novos mecanismos e controles.
- Inclui os bundles compilados de cliente e servidor na distribuição publicada.

## [0.0.1-alpha.1] - 2026-09-15

### Recursos

- Primeira versão funcional do plugin DSH Live Voice.
- Coordena captura do microfone, reconhecimento de fala, envio de mensagens ao assistente e reprodução de fala.
- Adiciona digitação por voz no editor de mensagens do DSH e conversas contínuas por voz.
- Oferece suporte ao SpeechRecognition do navegador e ao reconhecimento HTTP autenticado do whisper.cpp em loopback.
- Oferece suporte à síntese de fala do navegador e à saída `say` nativa do macOS.
- Adiciona controles do Live Voice, configurações do Whisper, scripts de compilação e pré-visualização no navegador e uma suíte inicial de testes.

[0.3.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.1-alpha.1...v0.0.2
[0.0.1-alpha.1]: https://github.com/victorwads/dsh-live-voice/tree/v0.0.1-alpha.1
