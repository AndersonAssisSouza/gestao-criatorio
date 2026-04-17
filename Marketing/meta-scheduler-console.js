// ============================================================================
// PLUMAR — Meta Business Suite Scheduler Helper
// ============================================================================
// Uso:
//   1. Abra https://business.facebook.com/latest/composer/?asset_id=1146018875251408
//   2. Abra DevTools (F12) -> aba Console
//   3. Cole o arquivo todo e aperta Enter
//   4. Chame: plumar.start(postNum)
//        - plumar.start(2) para Post 2 (Reel)
//        - plumar.start(3) para Post 3 (Carrossel), etc.
//   5. Quando abrir o file picker, selecione a(s) mídia(s) da pasta
//      frontend/public/marketing/ do projeto.
//   6. O script preenche caption, data/hora e clica "Programar".
//   7. Confirme clicando "Programar" no diálogo final.
// ============================================================================

window.plumar = (function () {
  // Catálogo dos 11 posts pendentes
  const POSTS = {
    2: {
      type: 'reel',
      mediaHint: 'Selecione PLUMAR_Post2_Reel_5Problemas.mp4',
      caption: 'Quantos desses problemas são seus? Comenta o número! 👇\n\nO PLUMAR foi criado por quem vive a rotina do criatório. Link na bio.\n\n#plumar #criacaodeaves #geneticadeaves #criadordecurio #criadoresbrasileiros #gestaodecriatório #mutacoes #sispass',
      scheduleAt: '2026-04-17T07:30',
    },
    3: {
      type: 'carousel',
      mediaHint: 'Selecione PLUMAR_Post3_Slide1..7.png (7 arquivos, na ordem)',
      caption: 'A diferença entre um criatório amador e um profissional? Planejamento genético.\n\nCruzar sem previsão é jogar no escuro. Hoje dá pra simular ANTES de formar o casal — e saber com probabilidade real quais mutações podem sair.\n\nSalva esse post e compartilha com aquele amigo criador. 🔖\n\nTeste grátis 30 dias — link na bio.\n\n#plumar #geneticadeaves #mutacoes #canariodecor #criacaodeaves #simuladorgenetico #gestaodecriatório #aviculturabrasileira',
      scheduleAt: '2026-04-19T11:00',
    },
    4: {
      type: 'story',
      mediaHint: 'Stories não têm composer no Business Suite — use app mobile',
      caption: '',
      scheduleAt: null,
    },
    6: {
      type: 'reel',
      mediaHint: 'Selecione PLUMAR_Post6_Reel_Simulador.mp4',
      caption: 'Simulador genético de mutações. Exclusivo no PLUMAR.\n\nPara de adivinhar e começa a planejar seus cruzamentos. 🧬\n\nEscolhe o casal → vê as probabilidades → monta a temporada com método.\n\nTeste grátis 30 dias no link da bio.\n\n#plumar #simuladorgenetico #mutacoesdeaves #criacaoprofissional #geneticadeaves #gestaodecriatório #canariodecor #ringneck #agapornis',
      scheduleAt: '2026-04-22T19:30',
    },
    7: {
      type: 'carousel',
      mediaHint: 'Selecione PLUMAR_Post7_Slide1..6.png (6 arquivos, na ordem)',
      caption: 'Planilha vs PLUMAR — qual é o seu criatório hoje?\n\nSe você ainda gerencia o criatório com Excel e caderno, esse post é pra você.\n\nMigre para o PLUMAR. 30 dias grátis. Link na bio.\n\n#plumar #gestaodecriatório #criacaodeaves #adeusplanilha #simuladorgenetico #controledeaves #sispass #aviculturabrasileira',
      scheduleAt: '2026-04-24T12:30',
    },
    9: {
      type: 'carousel',
      mediaHint: 'Selecione PLUMAR_Post9_Slide1..8.png (8 arquivos, na ordem)',
      caption: 'Como usar o Simulador Genético do PLUMAR — passo a passo. 🧬\n\nSalva esse post e usa como guia na próxima vez que for formar um casal.\n\n1. Seleciona a espécie → 2. Marca as mutações do macho → 3. Marca as da fêmea → 4. Simula → 5. Lê o percentual de cada mutação possível na ninhada.\n\nTeste grátis 30 dias. Link na bio.\n\n#plumar #simuladorgenetico #geneticadeaves #tutorial #mutacoes #canariodecor #ringneck #agapornis #gestaodecriatório',
      scheduleAt: '2026-04-26T11:00',
    },
    10: {
      type: 'reel',
      mediaHint: 'Selecione PLUMAR_Post10_Reel_3Funcionalidades.mp4',
      caption: '3 funcionalidades que seu criatório precisa — e você nem sabia. 👀\n\n1. Simulador genético — pare de cruzar no escuro.\n2. Multi-criatório — gerencie mais de um local no mesmo painel.\n3. Dashboard financeiro — saiba se tá dando lucro.\n\nPLUMAR. Link na bio.\n\n#plumar #criacaodeaves #gestaodecriatório #dashboard #simuladorgenetico #multicriatorio #aviculturabrasileira #criadoresbrasileiros',
      scheduleAt: '2026-04-28T19:00',
    },
    11: {
      type: 'image',
      mediaHint: 'Selecione PLUMAR_Post11_DicaManejo.png',
      caption: '📋 Dica de manejo: registre SEMPRE a data de postura de cada ovo.\n\nSaber a data exata permite:\n— Prever o nascimento com precisão (incubação ±17 dias na maioria das espécies)\n— Identificar ovos inférteis no tempo certo\n— Organizar rodízio de casais\n\nNo PLUMAR, o ciclo reprodutivo é monitorado automaticamente: cada ovo, cada ninhada, cada filhote registrado.\n\n👉 Teste grátis 30 dias: link na bio.\n\n#plumar #dicasdemanejo #criacaodeaves #cicloreprodutivo #ovoseninhadas #gestaodecriatório #canariodecor #agapornis',
      scheduleAt: '2026-04-30T08:00',
    },
    12: {
      type: 'carousel',
      mediaHint: 'Selecione PLUMAR_Post12_Slide1..7.png (7 arquivos, na ordem)',
      caption: '5 motivos para trocar sua planilha pelo PLUMAR hoje:\n\n1. Planilhas corrompem. O PLUMAR salva na nuvem.\n2. Planilhas não simulam genética. O PLUMAR simula.\n3. Planilhas não avisam sobre ciclos. O PLUMAR monitora.\n4. Planilhas não controlam anilhas. O PLUMAR rastreia.\n5. Planilhas não mostram seu lucro. O PLUMAR calcula.\n\nMigre hoje. 30 dias grátis. Link na bio.\n\n#plumar #gestaodecriatório #adeusplanilha #criacaodeaves #simuladorgenetico #controledeaves #sispass',
      scheduleAt: '2026-05-02T11:00',
    },
    13: {
      type: 'reel',
      mediaHint: 'Mídia pendente — precisa gravar depoimento real do beta tester',
      caption: 'Quem usa, recomenda. 🐦\n\nDepoimento de [NOME], criador de [ESPÉCIE] há [X] anos, beta tester do PLUMAR.\n\nCadastre-se hoje e ganhe 30 dias grátis. Link na bio.\n\n#plumar #depoimento #criadores #criacaodeaves #simuladorgenetico #gestaodecriatório',
      scheduleAt: '2026-05-04T19:30',
    },
    14: {
      type: 'image',
      mediaHint: 'Selecione PLUMAR_Post14_Urgencia.png',
      caption: '⏰ Últimos dias com trial de 30 dias estendido!\n\nQuem criar conta essa semana ganha acesso completo a todas as funcionalidades — sem cartão de crédito, sem pegadinha.\n\nDepois, o trial padrão volta ao normal.\n\n👉 plumar.com.br — link na bio. Não perca.\n\n#plumar #criacaodeaves #oportunidade #gestaodecriatório #simuladorgenetico',
      scheduleAt: '2026-05-06T20:00',
    },
  };

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function waitFor(selector, timeout = 5000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const el = typeof selector === 'function' ? selector() : document.querySelector(selector);
      if (el) return el;
      await sleep(150);
    }
    return null;
  }

  function findByText(texts, root = document) {
    texts = Array.isArray(texts) ? texts : [texts];
    const all = root.querySelectorAll('a, button, [role="button"], span, div');
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (texts.some(x => t === x) && el.offsetParent !== null) return el;
    }
    return null;
  }

  async function fillCaption(text) {
    // Procura o textbox do post (Lexical editor)
    const editor = document.querySelector('[contenteditable="true"][role="textbox"]');
    if (!editor) throw new Error('Editor de texto não encontrado');
    editor.focus();
    // Usa InputEvent pra compatibilidade com Lexical/React
    document.execCommand('insertText', false, text);
    console.log('[plumar] caption preenchida');
  }

  async function setSchedule(isoDatetime) {
    // Toggle "Definir data e hora"
    const toggle = await waitFor(() =>
      Array.from(document.querySelectorAll('input[type="checkbox"], [role="switch"]'))
        .find(el => {
          const p = el.closest('*');
          return p && p.textContent && p.textContent.includes('Definir data e hora');
        })
    );
    if (toggle && !toggle.checked) toggle.click();
    await sleep(600);

    // Preenche data e hora (format: AAAA-MM-DD HH:MM)
    const [date, time] = isoDatetime.split('T');
    const dateInput = document.querySelector('input[type="date"], input[placeholder*="data" i]');
    const timeInput = document.querySelector('input[type="time"], input[placeholder*="hora" i]');
    if (dateInput) {
      dateInput.focus();
      dateInput.value = date;
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (timeInput) {
      timeInput.focus();
      timeInput.value = time;
      timeInput.dispatchEvent(new Event('input', { bubbles: true }));
      timeInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    console.log('[plumar] agenda configurada para', isoDatetime);
  }

  async function clickAddPhoto() {
    const link = findByText(['Adicionar foto', 'Adicionar video']);
    if (!link) throw new Error('Botão Adicionar foto/video não encontrado');
    link.click();
  }

  async function start(postNum) {
    const post = POSTS[postNum];
    if (!post) {
      console.error('Post inválido. Use:', Object.keys(POSTS).join(', '));
      return;
    }
    if (!post.scheduleAt) {
      console.warn('Post', postNum, 'não tem agendamento definido:', post.mediaHint);
      return;
    }
    console.log('[plumar] === Iniciando Post', postNum, '===');
    console.log('[plumar]', post.mediaHint);
    console.log('[plumar] Quando abrir o file picker, selecione o(s) arquivo(s).');

    // Fluxo: clica Adicionar -> usuário escolhe arquivo(s) no picker nativo ->
    // quando a mídia aparece, preenche caption e agenda
    await clickAddPhoto();

    // Aguarda a mídia carregar (visível na prévia)
    console.log('[plumar] Aguardando mídia aparecer na prévia...');
    const mediaLoaded = await waitFor(() => {
      // Sinal: miniatura de mídia aparece na área Mídia
      const imgs = document.querySelectorAll('[aria-label*="imagem" i] img, [class*="media"] img');
      return imgs.length > 0 ? imgs[0] : null;
    }, 120000);
    if (!mediaLoaded) {
      console.error('[plumar] Timeout aguardando mídia. Verifique se carregou.');
      return;
    }
    await sleep(1500);

    // Preenche caption
    await fillCaption(post.caption);
    await sleep(800);

    // Configura agendamento
    await setSchedule(post.scheduleAt);
    await sleep(500);

    console.log('[plumar] ✅ Pronto. Confira e clique em "Programar" para confirmar.');
    console.log('[plumar] Depois, rode plumar.start(' + nextPost(postNum) + ') para o próximo.');
  }

  function nextPost(n) {
    const keys = Object.keys(POSTS).map(Number).sort((a, b) => a - b);
    const i = keys.indexOf(n);
    return keys[i + 1] || '(fim)';
  }

  function list() {
    console.log('Posts pendentes:');
    for (const [num, p] of Object.entries(POSTS)) {
      console.log(`  ${num} [${p.type}]  ${p.scheduleAt || 'pendente'}  — ${p.mediaHint.substring(0, 60)}`);
    }
  }

  return { start, list, POSTS };
})();

console.log('%c[PLUMAR] Helper carregado.', 'color:#2D8659;font-weight:bold;font-size:14px');
console.log('Comandos: plumar.list() | plumar.start(numero)');
console.log('Ordem sugerida: 2 → 3 → 4 → 6 → 7 → 9 → 10 → 11 → 12 → 13 → 14');
