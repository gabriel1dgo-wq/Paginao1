/**
 * OLIVER IMOB — Planilha de leads
 *
 * Cole este arquivo em: Planilha Google → Extensões → Apps Script.
 * 1. Rode a função configurarPlanilha() uma vez (cria as abas e a formatação).
 * 2. Implantar → Nova implantação → App da Web
 *      Executar como: Eu | Quem pode acessar: Qualquer pessoa
 * 3. Copie o link que termina em /exec e cole em site/leads-config.js.
 * Passo a passo completo: planilha-leads/COMO-CONFIGURAR.md
 */

// E-mail que recebe o aviso de cada lead novo. Deixe '' para não enviar.
const EMAIL_AVISO = '';
const RESPONSAVEIS = ['Gabriel Oliveira Santos'];

const ABA_LEADS = 'Leads';
const ABA_PAINEL = 'Painel';
const ABA_GUIA = 'Como usar';

const STATUS = ['Novo', 'Em contato', 'Simulação enviada', 'Visita agendada', 'Proposta', 'Contrato assinado', 'Sem interesse agora', 'Perdido'];

// [título, largura, chave do formulário ou null quando é calculado/preenchido pelo corretor]
const COLUNAS = [
  ['ID', 70, null],
  ['Data e hora', 135, null],
  ['Status', 150, null],
  ['Temperatura', 110, null],
  ['Pontos', 65, null],
  ['Nome', 170, 'nome'],
  ['WhatsApp', 130, 'telefone'],
  ['Abrir conversa', 120, null],
  ['E-mail', 190, 'email'],
  ['Objetivo', 210, 'objetivo'],
  ['Projeto de interesse', 190, 'projeto'],
  ['Região preferida', 210, 'regiao'],
  ['Dormitórios', 110, 'dormitorios'],
  ['Orçamento', 200, 'orcamento'],
  ['Entrada', 200, 'entrada'],
  ['Renda familiar', 190, 'renda'],
  ['FGTS', 120, 'fgts'],
  ['Prazo de compra', 160, 'prazo'],
  ['Melhor horário', 120, 'horario'],
  ['Galerias que abriu no site', 260, 'galerias'],
  ['Regiões que viu no mapa', 220, 'regioesMapa'],
  ['Tempo no site', 100, 'tempoSite'],
  ['Quanto rolou da página', 110, 'rolagem'],
  ['Origem', 130, 'origem'],
  ['Mídia', 100, 'midia'],
  ['Campanha', 130, 'campanha'],
  ['Dispositivo', 105, 'dispositivo'],
  ['Consentimento LGPD', 110, 'consentimento'],
  ['Próximo passo sugerido', 300, null],
  ['Próximo contato', 115, null],
  ['Observações do corretor', 300, null],
  ['Responsável', 170, null]
];
const col = titulo => COLUNAS.findIndex(c => c[0] === titulo) + 1;
// 1 → A, 27 → AA
const letraDa = n => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };

/* ================= recebe o lead do site ================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.site || !d.nome || !d.telefone) return resposta({ ok: false }); // robô ou envio incompleto
    const aba = planilha().getSheetByName(ABA_LEADS) || configurarPlanilha().getSheetByName(ABA_LEADS);
    const { pontos, temperatura } = pontuar(d);
    const id = 'L' + String(aba.getLastRow()).padStart(4, '0');
    const tel = String(d.telefone).replace(/\D/g, '');
    const linha = COLUNAS.map(([titulo, , chave]) => {
      if (chave) return limpar(d[chave]);
      switch (titulo) {
        case 'ID': return id;
        case 'Data e hora': return new Date();
        case 'Status': return 'Novo';
        case 'Temperatura': return temperatura;
        case 'Pontos': return pontos;
        case 'Abrir conversa': return `=HYPERLINK("https://wa.me/55${tel}","Abrir WhatsApp")`;
        case 'Próximo passo sugerido': return proximoPasso(d, temperatura);
        case 'Responsável': return RESPONSAVEIS[0];
        default: return '';
      }
    });
    aba.insertRowBefore(2); // lead mais novo sempre no topo
    aba.getRange(2, 1, 1, linha.length).setValues([linha]);
    aba.getRange(2, col('WhatsApp')).setNumberFormat('@');
    try { avisar(d, id, temperatura, pontos); } catch (err) { console.error('aviso por e-mail falhou', err); }
    return resposta({ ok: true, id });
  } catch (err) {
    console.error(err);
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}
function doGet() { return resposta({ ok: true, mensagem: 'Planilha de leads OLIVER IMOB funcionando.' }); }
function resposta(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function planilha() { return SpreadsheetApp.getActiveSpreadsheet(); }
// evita que um texto começando com = + - @ vire fórmula
function limpar(v) { v = v == null ? '' : String(v).slice(0, 500); return /^[=+\-@]/.test(v) ? "'" + v : v; }

/* ================= qualificação automática ================= */
function pontuar(d) {
  const tabela = {
    prazo: { 'Nos próximos 3 meses': 30, 'Entre 3 e 6 meses': 22, 'Entre 6 e 12 meses': 12, 'Daqui a mais de 1 ano': 5 },
    entrada: { 'Acima de R$ 100 mil': 25, 'Acima de R$ 50 mil até R$ 100 mil': 20, 'Acima de R$ 20 mil até R$ 50 mil': 15, 'Até R$ 20 mil': 8, 'Ainda estou me organizando': 3 },
    renda: { 'Acima de R$ 12 mil': 20, 'Acima de R$ 8 mil até R$ 12 mil': 16, 'Acima de R$ 4 mil até R$ 8 mil': 12, 'Até R$ 4 mil': 6 },
    fgts: { 'Sim': 5 }
  };
  let p = 0;
  Object.keys(tabela).forEach(k => { p += tabela[k][d[k]] || 0; });
  if (d.orcamento && d.orcamento !== 'Ainda preciso definir') p += 5;
  if (d.projeto && d.projeto !== 'Quero ajuda para escolher') p += 8;
  if (d.email) p += 2;
  const galerias = d.galerias ? d.galerias.split(',').length : 0;
  p += Math.min(10, galerias * 2);
  p = Math.min(100, p);
  const temperatura = p >= 60 ? '🔥 Quente' : p >= 35 ? '🌤 Morno' : '❄ Frio';
  return { pontos: p, temperatura };
}
function proximoPasso(d, temperatura) {
  const passos = [];
  if (temperatura === '🔥 Quente') passos.push('Chamar em até 1 hora');
  else if (temperatura === '🌤 Morno') passos.push('Chamar hoje');
  else passos.push('Chamar e nutrir com opções');
  const periodo = { 'Manhã': 'de manhã', 'Tarde': 'à tarde', 'Noite': 'à noite' }[d.horario];
  if (periodo) passos.push('de preferência ' + periodo);
  if (d.projeto && d.projeto !== 'Quero ajuda para escolher') passos.push(`enviar book e tabela do ${d.projeto}`);
  else passos.push('montar comparativo de 3 opções na região escolhida');
  if (d.fgts === 'Sim') passos.push('pedir extrato do FGTS');
  if (d.fgts === 'Não sei se tenho direito') passos.push('verificar direito ao FGTS');
  if (!d.renda || d.renda === 'Prefiro informar na conversa') passos.push('confirmar renda para simulação');
  else passos.push('fazer simulação de crédito');
  return passos.join('; ') + '.';
}

/* ================= aviso por e-mail ================= */
function avisar(d, id, temperatura, pontos) {
  if (!EMAIL_AVISO) return;
  const linhas = [['Nome', d.nome], ['WhatsApp', d.telefone], ['E-mail', d.email], ['Objetivo', d.objetivo], ['Projeto', d.projeto],
    ['Região', d.regiao], ['Dormitórios', d.dormitorios], ['Orçamento', d.orcamento], ['Entrada', d.entrada], ['Renda', d.renda],
    ['FGTS', d.fgts], ['Prazo', d.prazo], ['Melhor horário', d.horario], ['Galerias vistas', d.galerias], ['Origem', d.origem]]
    .filter(r => r[1]).map(r => `<tr><td style="padding:4px 12px 4px 0;color:#777">${r[0]}</td><td style="padding:4px 0"><b>${String(r[1]).replace(/</g, '&lt;')}</b></td></tr>`).join('');
  const tel = String(d.telefone).replace(/\D/g, '');
  MailApp.sendEmail({
    to: EMAIL_AVISO,
    subject: `${temperatura} Novo lead ${id}: ${d.nome} (${pontos} pts)`,
    htmlBody: `<div style="font-family:Arial,sans-serif;font-size:14px"><h2 style="font-weight:400">Novo lead no site OLIVER IMOB</h2>
      <p><b>${temperatura}</b> · ${pontos} pontos</p><table>${linhas}</table>
      <p><a href="https://wa.me/55${tel}">Abrir conversa no WhatsApp</a> · <a href="${planilha().getUrl()}">Abrir planilha</a></p></div>`
  });
}

/* ================= monta a planilha (rodar uma vez) ================= */
function configurarPlanilha() {
  const ss = planilha();
  ss.setSpreadsheetTimeZone('America/Sao_Paulo');
  ss.setSpreadsheetLocale('pt_BR');
  const leads = ss.getSheetByName(ABA_LEADS) || ss.insertSheet(ABA_LEADS, 0);
  montarLeads(leads);
  montarPainel(ss.getSheetByName(ABA_PAINEL) || ss.insertSheet(ABA_PAINEL, 1));
  montarGuia(ss.getSheetByName(ABA_GUIA) || ss.insertSheet(ABA_GUIA, 2));
  const padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (padrao && padrao.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  ss.setActiveSheet(leads);
  return ss;
}

function montarLeads(aba) {
  const n = COLUNAS.length;
  if (aba.getMaxColumns() < n) aba.insertColumnsAfter(aba.getMaxColumns(), n - aba.getMaxColumns());
  const topo = aba.getRange(1, 1, 1, n);
  topo.setValues([COLUNAS.map(c => c[0])])
    .setBackground('#1b1f22').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10)
    .setVerticalAlignment('middle').setWrap(true);
  aba.setRowHeight(1, 42);
  COLUNAS.forEach(([, w], i) => aba.setColumnWidth(i + 1, w));
  aba.setFrozenRows(1);
  aba.setFrozenColumns(col('Nome'));

  // colunas que o corretor preenche ganham um tom dourado no título
  ['Status', 'Próximo contato', 'Observações do corretor', 'Responsável'].forEach(t => aba.getRange(1, col(t)).setBackground('#8a6d43'));

  const linhas = aba.getMaxRows() - 1;
  const faixa = t => aba.getRange(2, col(t), linhas, 1);
  faixa('Data e hora').setNumberFormat('dd/MM/yyyy HH:mm');
  faixa('Próximo contato').setNumberFormat('dd/MM/yyyy');
  faixa('Pontos').setHorizontalAlignment('center');
  faixa('Temperatura').setHorizontalAlignment('center');
  aba.getRange(2, 1, linhas, n).setVerticalAlignment('middle').setFontSize(10);
  ['Próximo passo sugerido', 'Observações do corretor', 'Galerias que abriu no site'].forEach(t => faixa(t).setWrap(true));

  faixa('Status').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build());
  faixa('Responsável').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(RESPONSAVEIS, true).setAllowInvalid(true).build());
  faixa('Próximo contato').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());

  // cores
  const regras = [];
  const cor = (t, texto, fundo, fonte) => regras.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(texto).setBackground(fundo).setFontColor(fonte || '#1b1f22').setRanges([faixa(t)]).build());
  cor('Temperatura', '🔥 Quente', '#f8d7cf', '#9b2c1a');
  cor('Temperatura', '🌤 Morno', '#fbeccc', '#7a5a12');
  cor('Temperatura', '❄ Frio', '#dde9f3', '#2d5675');
  cor('Status', 'Novo', '#e8f0fe', '#1a4fa0');
  cor('Status', 'Em contato', '#fff4d6');
  cor('Status', 'Simulação enviada', '#fde9d9');
  cor('Status', 'Visita agendada', '#e6f4ea', '#1e6b35');
  cor('Status', 'Proposta', '#d9f0e0', '#1e6b35');
  cor('Status', 'Contrato assinado', '#1e6b35', '#ffffff');
  cor('Status', 'Sem interesse agora', '#eeeeee', '#666666');
  cor('Status', 'Perdido', '#eeeeee', '#999999');
  // próximo contato vencido fica vermelho
  const L = letraDa(col('Próximo contato'));
  regras.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($${L}2<>"",$${L}2<=TODAY())`).setBackground('#f4c7c3').setFontColor('#9b2c1a').setBold(true)
    .setRanges([faixa('Próximo contato')]).build());
  aba.setConditionalFormatRules(regras);

  if (!aba.getFilter()) aba.getRange(1, 1, aba.getMaxRows(), n).createFilter();
  aba.getBandings().forEach(b => b.remove());
  aba.getRange(1, 1, aba.getMaxRows(), n).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor('#1b1f22');
}

function montarPainel(aba) {
  aba.clear();
  aba.getCharts().forEach(c => aba.removeChart(c));
  aba.setHiddenGridlines(true);
  const letra = t => letraDa(col(t)) + '2:' + letraDa(col(t));
  const R = t => `${ABA_LEADS}!${letra(t)}`;
  aba.setColumnWidths(1, 8, 150);
  aba.getRange('A1').setValue('OLIVER IMOB · Painel de leads').setFontSize(20).setFontFamily('Playfair Display');
  aba.getRange('A2').setFormula('="Atualizado em "&TEXT(NOW(),"dd/mm/yyyy hh:mm")').setFontColor('#777777');

  const cards = [
    ['Leads no total', `=COUNTA(${R('ID')})`],
    ['Leads este mês', `=COUNTIFS(${R('Data e hora')},">="&EOMONTH(TODAY(),-1)+1)`],
    ['Leads últimos 7 dias', `=COUNTIFS(${R('Data e hora')},">="&TODAY()-7)`],
    ['🔥 Quentes em aberto', `=COUNTIFS(${R('Temperatura')},"🔥 Quente",${R('Status')},"<>Contrato assinado",${R('Status')},"<>Perdido")`],
    ['Novos sem contato', `=COUNTIF(${R('Status')},"Novo")`],
    ['Contratos assinados', `=COUNTIF(${R('Status')},"Contrato assinado")`],
    ['Conversão', `=IFERROR(COUNTIF(${R('Status')},"Contrato assinado")/COUNTA(${R('ID')}),0)`],
    ['Retornos vencidos', `=COUNTIFS(${R('Próximo contato')},"<="&TODAY(),${R('Próximo contato')},"<>")`]
  ];
  cards.forEach(([rotulo, formula], i) => {
    const c = i + 1;
    aba.getRange(4, c).setValue(rotulo).setFontSize(9).setFontColor('#777777').setBackground('#f3f1ec');
    aba.getRange(5, c).setFormula(formula).setFontSize(22).setBackground('#f3f1ec').setHorizontalAlignment('left');
  });
  aba.getRange(5, 7).setNumberFormat('0.0%');
  aba.setRowHeight(5, 44);

  const tabela = (linha, coluna, titulo, campo) => {
    const L = letraDa(col(campo));
    aba.getRange(linha, coluna).setValue(titulo).setFontWeight('bold').setFontSize(11);
    aba.getRange(linha + 1, coluna).setFormula(
      `=IFERROR(QUERY(${ABA_LEADS}!A2:${letraDa(COLUNAS.length)},"select ${L}, count(A) where ${L} is not null group by ${L} order by count(A) desc label ${L} '${campo}', count(A) 'Leads'",0),"Sem dados ainda")`);
    aba.getRange(linha + 1, coluna, 1, 2).setFontWeight('bold').setBackground('#1b1f22').setFontColor('#ffffff');
  };
  tabela(8, 1, 'Funil por status', 'Status');
  tabela(8, 4, 'Temperatura', 'Temperatura');
  tabela(8, 7, 'Região preferida', 'Região preferida');
  tabela(22, 1, 'Projetos mais procurados', 'Projeto de interesse');
  tabela(22, 4, 'De onde vieram (origem)', 'Origem');
  tabela(22, 7, 'Prazo de compra', 'Prazo de compra');
  tabela(40, 1, 'Objetivo', 'Objetivo');
  tabela(40, 4, 'Orçamento', 'Orçamento');
  tabela(40, 7, 'Dispositivo', 'Dispositivo');

  aba.insertChart(aba.newChart().setChartType(Charts.ChartType.PIE).addRange(aba.getRange('D9:E14'))
    .setPosition(2, 10, 0, 0).setOption('title', 'Temperatura dos leads').setOption('pieHole', .5)
    .setOption('colors', ['#c0533a', '#d6a64a', '#5d8fb5']).setOption('width', 420).setOption('height', 260).build());
  aba.insertChart(aba.newChart().setChartType(Charts.ChartType.BAR).addRange(aba.getRange('A23:B33'))
    .setPosition(16, 10, 0, 0).setOption('title', 'Projetos mais procurados').setOption('legend', { position: 'none' })
    .setOption('colors', ['#1b1f22']).setOption('width', 420).setOption('height', 300).build());
}

function montarGuia(aba) {
  aba.clear();
  aba.setHiddenGridlines(true);
  aba.setColumnWidth(1, 220); aba.setColumnWidth(2, 620);
  const linhas = [
    ['Como usar esta planilha', ''],
    ['', ''],
    ['Leads', 'Cada cadastro do site entra sozinho aqui, o mais novo sempre no topo. As colunas com título dourado são para você preencher.'],
    ['Status', 'Mude conforme o atendimento avança: ' + STATUS.join(' → ') + '.'],
    ['Temperatura e pontos', 'Calculados na hora pelo que o cliente respondeu (0 a 100). 🔥 Quente = 60+ · 🌤 Morno = 35 a 59 · ❄ Frio = até 34.'],
    ['Como os pontos são somados', 'Prazo (até 30) + entrada (até 25) + renda (até 20) + orçamento definido (5) + projeto escolhido (8) + FGTS (5) + e-mail (2) + galerias abertas no site (2 cada, até 10).'],
    ['Galerias e mapa', 'Mostram o que o cliente olhou no site antes de se cadastrar: ótimo para começar a conversa.'],
    ['Origem / Mídia / Campanha', 'Vêm do link do anúncio (utm_source, utm_medium, utm_campaign). Ex.: ...?utm_source=instagram&utm_campaign=lapa'],
    ['Próximo contato', 'Coloque a data do retorno. Quando vencer, a célula fica vermelha.'],
    ['Painel', 'Resumo automático: totais, funil, projetos mais procurados e origem dos leads.'],
    ['LGPD', 'Só entram leads que marcaram o consentimento. Se alguém pedir exclusão, apague a linha inteira.'],
    ['Compartilhar', 'Arquivo → Compartilhar. Dê acesso de Leitor para quem só acompanha e de Editor para os corretores.']
  ];
  aba.getRange(1, 1, linhas.length, 2).setValues(linhas).setVerticalAlignment('top').setWrap(true);
  aba.getRange('A1').setFontSize(18).setFontFamily('Playfair Display');
  aba.getRange(3, 1, linhas.length - 2, 1).setFontWeight('bold');
}

/* ================= teste: cria um lead fictício ================= */
function testarLead() {
  doPost({ postData: { contents: JSON.stringify({
    nome: 'Cliente Teste', telefone: '(11) 90000-0000', email: 'teste@exemplo.com',
    objetivo: 'Sair do aluguel / primeiro imóvel', projeto: 'Quero ajuda para escolher',
    regiao: 'Zona Leste (Tatuapé, Mooca, Carrão, Penha)', dormitorios: '2 dormitórios',
    orcamento: 'Acima de R$ 250 mil até R$ 350 mil', entrada: 'Acima de R$ 20 mil até R$ 50 mil',
    renda: 'Acima de R$ 4 mil até R$ 8 mil', fgts: 'Sim', prazo: 'Entre 3 e 6 meses', horario: 'Noite',
    galerias: 'Exemplo A, Exemplo B', regioesMapa: 'Zona Leste', tempoSite: '3 min 20 s', rolagem: '74%',
    origem: 'teste', dispositivo: 'Computador', consentimento: 'Sim'
  }) } });
}
