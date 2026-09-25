# Planilha de leads — como configurar (10 minutos)

Cada pessoa que preenche o formulário "Simulação grátis" do site vira uma linha numa Planilha Google, com pontuação, temperatura e próximo passo sugerido. O proprietário acessa de qualquer lugar e pode compartilhar com a equipe.

## 1. Criar a planilha
1. Entre no Google Drive com a conta do proprietário e crie uma **Planilha Google** em branco. Dê o nome "Leads OLIVER IMOB".
2. Menu **Extensões → Apps Script**.
3. Apague o que estiver no editor e cole todo o conteúdo de `planilha-leads/Codigo.gs`.
4. (Opcional) Na linha `const EMAIL_AVISO = '';` coloque o e-mail que deve receber aviso de cada lead. Ex.: `'contato@oliverimob.com.br'`.
5. Clique em **Salvar** (ícone de disquete).

## 2. Montar as abas
1. No topo do editor, escolha a função **configurarPlanilha** e clique em **Executar**.
2. O Google pede autorização: **Revisar permissões → escolha a conta → Avançado → Acessar (não seguro) → Permitir**. (O aviso aparece porque o script é seu, não de uma empresa verificada.)
3. Volte à planilha: agora ela tem as abas **Leads**, **Painel** e **Como usar**.
4. Quer ver como fica? Execute a função **testarLead**. Depois apague a linha de teste.

## 3. Publicar o link que o site usa
1. No Apps Script: **Implantar → Nova implantação**.
2. Engrenagem → **App da Web**.
3. Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**.
4. **Implantar** e copie o **URL do app da Web** (termina em `/exec`).

## 4. Ligar o site à planilha
Abra `site/leads-config.js` e cole o link entre as aspas:

```js
window.OLIVER_LEADS_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

Publique o site. Pronto: preencha o formulário uma vez para testar.

> Se mudar o `Codigo.gs` depois, use **Implantar → Gerenciar implantações → Editar → Nova versão**, assim o link continua o mesmo.

## O que cada lead traz

| Grupo | Colunas |
|---|---|
| Controle | ID, data e hora, **status**, **temperatura**, pontos (0–100), responsável, próximo contato, observações |
| Contato | nome, WhatsApp, botão "Abrir WhatsApp", e-mail, melhor horário |
| Perfil de compra | objetivo, projeto de interesse, região, dormitórios, orçamento, entrada, renda, FGTS, prazo |
| Comportamento no site | galerias que abriu, regiões que viu no mapa, tempo no site, quanto rolou a página, dispositivo |
| Marketing | origem, mídia e campanha (dos links com `utm_`) |
| Sugestão automática | próximo passo (ex.: "Chamar em até 1 hora; de preferência à noite; enviar book e tabela do Conx Mooca; pedir extrato do FGTS") |
| LGPD | consentimento marcado pelo cliente |

**Temperatura:** 🔥 Quente (60+ pontos) · 🌤 Morno (35–59) · ❄ Frio (até 34). A regra está na aba "Como usar".

**Painel:** total de leads, leads do mês e da semana, quentes em aberto, novos sem contato, contratos, conversão, retornos vencidos, funil por status, projetos mais procurados, origem, região, prazo, objetivo, orçamento e gráficos.

## Links de anúncio
Para saber de onde veio cada lead, use links assim nos anúncios e na bio:

- Instagram: `https://seusite.com/?utm_source=instagram&utm_medium=bio`
- Anúncio: `https://seusite.com/?utm_source=meta&utm_medium=anuncio&utm_campaign=lapa-setembro`
- Google: `https://seusite.com/?utm_source=google&utm_medium=cpc&utm_campaign=itaquera`

## Segurança e LGPD
- O link `/exec` só consegue **adicionar** linhas; ninguém consegue ler a planilha por ele.
- Um campo invisível bloqueia robôs; textos começando com `=` são gravados como texto, não como fórmula.
- Compartilhe a planilha só com quem atende os leads. Se um cliente pedir, apague a linha dele.
