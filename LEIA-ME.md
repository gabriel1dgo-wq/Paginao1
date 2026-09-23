# OLIVER IMOB — página completa e código-fonte

Cópia dos arquivos locais correspondentes à versão 10 publicada em 23/09/2026.
Site: https://logica-broker-projetos.sr-statk.chatgpt.site/

## Versão 12 — lapidação (23/09/2026)

- 38 empreendimentos (9 anteriores + 29 novos extraídos dos books). Dados em `site/catalog.js`; imagens em `site/assets/books/<empreendimento>/`.
- Cards gerados por `site/render-cards.js`. Para editar textos, metragens ou coordenadas no mapa, altere `site/catalog.js`.
- Novas seções: linha do tempo "Como funciona a sua compra", mapa no estilo Google (`site/oliver-map.js`), ambientes em neon, A Oliver com obra animada pela rolagem e registros reais.
- Validação social no mapa: `site/clientes-data.js`. Adicione apenas clientes reais, com autorização.
- Fotos do Gabriel em `site/assets/gabriel/` (recortadas para não mostrar marcas de terceiros).
- Não publicados, pois o book proíbe divulgação: Bosque Club Itaquera, Casa Higienópolis (THINK) e Viva Itamaracá. Sem dados suficientes: Vinx, Roya Perdizes e Raiz (Paulo Mauro).

## Versão 11 — redesign "maquete digital" (23/09/2026)

- `site/index.html` foi reescrito com o visual de referência do vídeo: hero off-white com retrato e edifício, cubos 3D de mármore/madeira e folhas em parallax, bloco "Mapa 3D Cartographer", mapa noturno 3D com rotas em neon, carrossel de projetos, coverflow de ambientes, seção A Oliver e rodapé escuro.
- Arquivos novos: `site/oliver.css`, `site/oliver.js` (animações, carrosséis, planejamento), `site/oliver-map.js` (mapa 3D) e `site/assets/oliver/` (texturas recortadas de `materials.webp`).
- Continuam em uso: `projects-data.js`, `gallery.js`, `profile.js`, `fonts.css` e `assets/vendor/maplibre.*`.
- A versão anterior foi preservada em `site/index-anterior.html` (usa os CSS/JS antigos, que continuam na pasta).
- Todos os números exibidos vêm dos books (9 projetos, 4 bairros, 7 incorporadoras, 147 imagens, 25 a 58 m²). Conversas de WhatsApp são ilustrativas e estão identificadas como tal.

## O que está incluído

- `site/`: página completa, pronta para hospedagem estática.
- `site/index.html`: estrutura, textos e formulário.
- `site/styles.css`, `editorial.css` e `experience.css`: estilos e adaptações para celular.
- `site/residence3d.js`: maquete 3D interativa.
- `site/experience.js`: mapa, transições, filtros e planejamento de compra.
- `site/projects-data.js`: dados e imagens dos nove projetos.
- `site/gallery.js`: galerias dos empreendimentos.
- `site/profile.js`: formulário e mensagem para WhatsApp.
- `site/fonts.css` e `site/assets/fonts/`: configuração e arquivos das fontes tipográficas.
- `site/assets/`: imagens, logotipos, bibliotecas JavaScript, PDFs e mídias disponíveis no projeto.
- `documentacao/`: notas técnicas históricas; podem descrever etapas anteriores à versão atual.
- `MANIFESTO-SHA256.json`: relação dos arquivos e hashes para conferir integridade.

O código HTML, CSS e JavaScript é o código-fonte editável, sem necessidade de compilação. As bibliotecas de terceiros ficam em `site/assets/vendor/`. Foram preservados também arquivos antigos ainda existentes no projeto, inclusive mídias da seção de obra que foi removida da página.

## Como abrir no computador

Para carregar corretamente os módulos 3D, abra com um servidor local, e não apenas com um duplo clique no HTML.

Se Python 3 estiver instalado, abra o terminal nesta pasta e execute:

```sh
python3 -m http.server 8080 --directory site
```

Depois acesse http://localhost:8080 no navegador. Alternativamente, abra a pasta `site` no VS Code e use um servidor local como Live Server.

## Como hospedar

Publique o conteúdo da pasta `site` em uma hospedagem estática com HTTPS. O arquivo de entrada é `index.html`. Não existe backend, banco de dados nem etapa de build obrigatória.

## Dependências e conteúdo

O mapa necessita de internet: utiliza o estilo Liberty e dados de OpenFreeMap/OpenStreetMap. As bibliotecas MapLibre e Three.js estão incluídas localmente; mantenha as atribuições e avisos de licença. O envio final do formulário abre o WhatsApp e depende desse serviço. As demais mídias e fontes da página estão nesta pasta.

As mensagens simuladas estão identificadas como exemplos fictícios. Valores e enquadramentos pendentes continuam sob consulta; o planejamento não representa aprovação de crédito.

Esta entrega não inclui credenciais, tokens, histórico Git ou acesso à conta de hospedagem. Os PDFs incluídos são os que estavam armazenados na pasta do site; nem todos os books originais enviados na conversa estavam publicados como PDF.
