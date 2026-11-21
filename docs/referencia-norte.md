# Análise do projeto Norte

O ZIP contém guias de montagem, composições desktop e mobile, duas receitas de preparação de mídia e uma demo de hospedagem dividida em dez seções. `AGENTS.md` e `CLAUDE.md` têm conteúdo idêntico. O pacote também contém `COMECE-AQUI.md`, `PROMPT.md` e uma receita de mídia em `arquivos/receitas/LEIA.md`. A demo traz o Vite configurado, os HTMLs e módulos, imagens em WebP, quatro texturas da Terra e scripts auxiliares de preparação de mídia. O manifesto de dependências é descrito no guia de montagem.

## Estrutura de apresentação

O arquivo `index.html` define a ordem das seções e camadas compartilhadas. Um plugin Vite expande os marcadores de comentário no HTML, preservando conteúdo semântico já no resultado do build. O CSS é carregado pelo HTML e usa tokens compartilhados. O canvas fixo aparece entre a palavra gigante e o conteúdo clicável. O Three.js é importado depois dos elementos da página. A CortexTech preserva a montagem em arquivos HTML, a base relativa do Vite, os tokens e as camadas. A composição muda de um hero centralizado de hospedagem para uma abertura editorial assimétrica com o cérebro ao lado da chamada.

## Movimento e cena

Na Norte, a Terra combina uma esfera, mapas de cor e relevo, shader e pontos definidos por latitude e longitude. `layout.js` mede âncoras e seções. `coreografia.js` interpola quadros-chave diferentes para mobile e desktop. `arrasto.js` usa eventos de ponteiro e desaceleração. `globo.js` projeta um ponto 3D em pixels para `voo.js` conduzir uma partícula até a busca de domínio. O manifesto visual usa máscaras nas entradas, texto revelado uma vez pelo IntersectionObserver, recortes tipográficos e WebP adaptado à largura.

A CortexTech adota o mesmo princípio de separar posição visual e fluxo de leitura. O percurso usa âncoras medidas no layout e o cérebro é um GLB com três grupos de pontos derivados da superfície. O frame compartilhado coordena suavização, posição, partícula e preenchimento do wireframe. A miniatura final reutiliza o conceito Forma Estúdio. O andamento do briefing incorpora a mesma luz para sinalizar progresso e preenchimento.

## Responsividade e acessibilidade

A referência define colunas separadas para texto e globo no desktop, reorganiza o hero no celular e usa `touch-action: pan-y pinch-zoom` para preservar movimento vertical. A CortexTech adapta a distribuição aos seus textos e reserva o espaço do objeto. A versão responsiva traz menu expansível com Escape e retorno de foco, botões para girar por teclado, fallback para WebGL e modo de movimento reduzido. O formulário usa controles nativos, foco no primeiro erro e uma confirmação condicionada ao retorno de um serviço real.

## Arquivos e licenças

A documentação original menciona fotos identificadas do Pexels e texturas baseadas em dados da NASA. A CortexTech usa sua própria marca, fotos geradas para o portfólio e um GLB independente com licença explícita. O ZIP não inclui uma licença geral para redistribuição do código. As técnicas descritas acima foram reimplementadas para CortexTech, sem incluir arquivos de código ou mídia da demo. A fonte Archivo é resolvida pela dependência Fontsource e sua licença acompanha o pacote.
