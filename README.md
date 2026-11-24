# CortexTech

**Da ideia ao digital.** Site de um estúdio de estratégia, design e desenvolvimento web sob medida. A landing conduz da primeira conexão neural a uma interface e a um briefing de projeto.

## Executar localmente

Use Node.js 20.19+ na linha 20 ou 22.12+.

```sh
npm ci
npm run dev
```

Abra o endereço que o Vite indicar, normalmente `http://127.0.0.1:5183`. Para gerar e conferir a distribuição:

```sh
npm run build
npm run preview
```

O build fica em `dist/` e usa caminhos relativos para funcionar também em uma subpasta de hospedagem estática.

## O que está implementado

- Landing responsiva com hero, pilares do estúdio, transição de wireframe para interface, serviços, processo, dois projetos-conceito, galeria de equipe, briefing, contato e fechamento.
- Cérebro anatômico em GLB com material grafite, luzes em Three.js, arrasto por mouse e dedo e controles por teclado. O movimento reage à seção e acende grupos de conexões durante a apresentação dos pilares. Uma partícula sai da região do cérebro em direção à interface.
- Cena carregada de forma assíncrona, com densidade de pixels limitada. Uma imagem WebP entra em caso de ausência de WebGL, erro no modelo ou preferência por movimento reduzido. Em telas de toque, a rolagem vertical permanece nativa. Lenis suaviza a roda quando há ponteiro fino.
- Briefing em quatro etapas com validação, resumo editável e prévia conceitual sensível a empresa, tipo de projeto, páginas, estilo e cor. Os dados ficam na página até que o visitante copie o resumo ou peça o envio ao serviço configurado.
- A seleção de um serviço abre o briefing com o tipo correspondente. A animação marca o avanço e responde ao preenchimento.

## Contato

A seção **Contato** exibe o e-mail oficial e permite copiá-lo. O formulário monta um rascunho no aplicativo de e-mail do visitante para que ele revise e envie a mensagem.

## Configurar o envio do briefing

O modo padrão oferece **Copiar resumo**. Se o navegador bloquear o clipboard, o formulário mostra o texto selecionável.

Para ativar o envio, copie `.env.example` para `.env.local`, defina `VITE_BRIEFING_ENDPOINT` e reinicie o Vite ou gere outro build. Essa variável é pública. Guarde credenciais no serviço que recebe o briefing. O endpoint pode ser relativo ou HTTPS. Se estiver em outra origem, o serviço precisa autorizar a origem do site para solicitações POST em JSON.

O cliente envia os campos do briefing e um `requestId` em JSON por POST. A confirmação exige uma resposta HTTP 2xx com JSON no formato `{"accepted":true,"id":"identificador-opcional"}`. Responda apenas depois de registrar ou encaminhar o pedido. Use `requestId` para deduplicar novas tentativas com o mesmo conteúdo e valide os campos no servidor. Os nomes dos campos estão em [`src/briefing/state.js`](src/briefing/state.js). O contrato de envio fica em [`src/briefing/submit.js`](src/briefing/submit.js).

## Estrutura

```text
index.html          Metadados, camadas e ordem de montagem
vite.config.js      Injeção das seções no HTML de desenvolvimento e produção
src/sections/       Marcações semânticas da landing e do briefing
src/styles/         Tokens, layout, narrativa, seções e briefing
src/motion/         Lenis, entrada de seções, arrasto, cena Three.js e conexões
src/briefing/       Estado derivado do formulário, prévia, validação e envio
public/media/       Modelo GLB, imagem de fallback e imagens dos conceitos
tests/              Testes de lógica e de navegador
docs/               Análise técnica da referência e créditos de mídia
```

Stack: Vite, JavaScript ES Modules, HTML, CSS, Three.js e Lenis. Tipografia local via Fontsource.

## Testes

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador cobrem carregamento, fallback WebGL, navegação móvel, larguras de 320 a 1440 px, teclado, movimento reduzido, edição do resumo, clipboard, auditoria axe e respostas do endpoint simulado. É possível usar o Edge instalado definindo `PLAYWRIGHT_CHANNEL=msedge`. Para exigir WebGL e exercitar o arrasto em ambientes sem GPU dedicada, defina `PLAYWRIGHT_SOFTWARE_WEBGL=1` antes de rodar a suíte.

## Status e pendências

O GLB de produção está integrado. Os grupos de pontos são estilizados para a narrativa. A aplicação está pronta para hospedagem estática e a entrega desta versão é o código versionado. Para receber briefings em produção, resta configurar um destino real e validar o envio nesse ambiente.

Os créditos, as licenças e as intervenções nos arquivos estão em [Créditos de mídia](docs/media.md). A arquitetura que serviu de referência está em [Análise do projeto Norte](docs/referencia-norte.md).
