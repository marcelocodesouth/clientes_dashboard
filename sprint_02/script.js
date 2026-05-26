/* ───────────────────────────────────────────────────────
   CONSTANTES E HELPERS
─────────────────────────────────────────────────────── */
const CHAVE_DB = 'clientes_db';

/** Lê a lista de clientes do LocalStorage */
function lerClientes() {
  const dados = localStorage.getItem(CHAVE_DB);
  return dados ? JSON.parse(dados) : [];
}

/** Grava a lista de clientes no LocalStorage */
function salvarClientes(lista) {
  localStorage.setItem(CHAVE_DB, JSON.stringify(lista));
}

/** Exibe uma mensagem de status no elemento informado */
function exibirMensagem(elementoId, texto, tipo) {
  const el = document.getElementById(elementoId);
  el.textContent = texto;
  el.className = `msg ${tipo} show`;
}

/** Limpa a mensagem de status */
function limparMensagem(elementoId) {
  const el = document.getElementById(elementoId);
  el.textContent = '';
  el.className = 'msg';
}

/* ───────────────────────────────────────────────────────
   BLOCO 1 — BUSCAR CEP NA API VIACEP
   → Usa fetch() + async/await + try/catch
─────────────────────────────────────────────────────── */
async function buscarEndereco(cep) {
  // Remove qualquer caractere que não seja número
  const cepLimpo = cep.replace(/\D/g, '');

  // Só busca se tiver exatamente 8 dígitos
  if (cepLimpo.length !== 8) return;

  // Feedback visual: informa que está carregando
  document.getElementById('logradouro').value = 'Carregando...';
  document.getElementById('bairro').value     = 'Carregando...';
  document.getElementById('cidade').value     = 'Carregando...';
  document.getElementById('uf').value         = 'Carregando...';
  limparMensagem('msg-cep');

  try {
    // 1. Faz a requisição para a API do ViaCEP
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    // 2. Se o HTTP devolver erro de rede (ex: 500), lança exceção
    if (!resposta.ok) {
      throw new Error('Falha na requisição');
    }

    // 3. Converte a resposta para JSON
    const dados = await resposta.json();

    // 4. A ViaCEP retorna { "erro": true } para CEPs inexistentes
    if (dados.erro) {
      throw new Error('CEP não encontrado');
    }

    // 5. Preenche os campos com os dados retornados
    document.getElementById('logradouro').value = dados.logradouro || '';
    document.getElementById('bairro').value     = dados.bairro     || '';
    document.getElementById('cidade').value     = dados.localidade || '';
    document.getElementById('uf').value         = dados.uf         || '';

  } catch (erro) {
    // Qualquer erro cai aqui: rede fora, CEP inválido, etc.
    exibirMensagem('msg-cep', 'Erro ao consultar CEP. Verifique e tente novamente.', 'erro');
    document.getElementById('logradouro').value = '';
    document.getElementById('bairro').value     = '';
    document.getElementById('cidade').value     = '';
    document.getElementById('uf').value         = '';
  }
}

/* ───────────────────────────────────────────────────────
   BLOCO 2 — PROMISE CUSTOMIZADA (simulação de 2 segundos)
   → Usa new Promise() + setTimeout
─────────────────────────────────────────────────────── */
function simularProcessamento() {
  return new Promise((resolve) => {
    // Resolve (sucesso) depois de 2 segundos
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

/* ───────────────────────────────────────────────────────
   BLOCO 3 — SALVAR CLIENTE
   → Usa async/await + try/catch/finally
─────────────────────────────────────────────────────── */
async function salvarCliente() {
  const btnSalvar = document.getElementById('btn-salvar');

  // PASSO 1: Coleta os valores do formulário
  const nome       = document.getElementById('nome').value.trim();
  const email      = document.getElementById('email').value.trim();
  const plano      = document.getElementById('plano').value;
  const cep        = document.getElementById('cep').value.trim();
  const logradouro = document.getElementById('logradouro').value.trim();
  const bairro     = document.getElementById('bairro').value.trim();
  const cidade     = document.getElementById('cidade').value.trim();
  const uf         = document.getElementById('uf').value.trim();

  // PASSO 2: Validação síncrona (antes de qualquer async)
  if (!nome || !email || !plano || !cep || !logradouro) {
    exibirMensagem('msg-form', 'Preencha todos os campos obrigatórios (incluindo o CEP).', 'erro');
    return; // Interrompe aqui se inválido
  }
  limparMensagem('msg-form');

  // PASSO 3: Feedback visual — desabilita o botão
  btnSalvar.disabled    = true;
  btnSalvar.textContent = 'SALVANDO...';

  try {
    // PASSO 4: Aguarda a Promise customizada (2s)
    await simularProcessamento();

    // PASSO 5: Monta o objeto do cliente
    const novoCliente = {
      id: Date.now(), // ID único baseado no timestamp
      nome,
      email,
      plano,
      cep,
      logradouro,
      bairro,
      cidade,
      uf
    };

    // PASSO 6: Salva no LocalStorage
    const listaAtual = lerClientes();
    listaAtual.push(novoCliente);
    salvarClientes(listaAtual);

    // PASSO 7: Renderiza o card na tela
    renderizarCard(novoCliente);
    atualizarContador();

    // PASSO 8: Limpa o formulário
    limparFormulario();

    exibirMensagem('msg-form', 'Cliente cadastrado com sucesso!', 'info');

  } catch (erro) {
    // Se qualquer etapa falhar, cai aqui
    exibirMensagem('msg-form', 'Ocorreu um erro ao salvar. Tente novamente.', 'erro');

  } finally {
    // SEMPRE executa — com erro ou sem erro
    // Reabilita o botão e restaura o texto original
    btnSalvar.disabled    = false;
    btnSalvar.textContent = 'SALVAR CLIENTE';
  }
}

/* ───────────────────────────────────────────────────────
   BLOCO 4 — RENDERIZAR CARD DO CLIENTE NO DOM
─────────────────────────────────────────────────────── */
function renderizarCard(cliente) {
  const lista = document.getElementById('lista-clientes');

  // Remove o "estado vazio" se existir
  const emptyState = lista.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  // Cria o elemento do card
  const card = document.createElement('div');
  card.className  = 'card-cliente';
  card.dataset.id = cliente.id;

  card.innerHTML = `
    <div class="card-info">
      <div class="card-nome">${cliente.nome}</div>
      <div class="card-email">${cliente.email}</div>
      <div class="card-plano">${cliente.plano}</div>
      <div class="card-endereco">
        <span>${cliente.logradouro}</span>, ${cliente.bairro}<br>
        ${cliente.cidade} — <span>${cliente.uf}</span> &nbsp;·&nbsp; CEP: ${cliente.cep}
      </div>
    </div>
    <button class="btn-remover" onclick="removerCliente(${cliente.id})">Remover</button>
  `;

  lista.appendChild(card);
}

/* ───────────────────────────────────────────────────────
   BLOCO 5 — REMOVER CLIENTE
─────────────────────────────────────────────────────── */
function removerCliente(id) {
  // 1. Remove do LocalStorage
  const listaAtual    = lerClientes();
  const listaFiltrada = listaAtual.filter(c => c.id !== id);
  salvarClientes(listaFiltrada);

  // 2. Remove o card do DOM
  const card = document.querySelector(`.card-cliente[data-id="${id}"]`);
  if (card) card.remove();

  // 3. Se não houver mais clientes, mostra o estado vazio
  const lista = document.getElementById('lista-clientes');
  if (lista.children.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>Nenhum cliente cadastrado ainda.</p>
      </div>
    `;
  }

  atualizarContador();
}

/* ───────────────────────────────────────────────────────
   BLOCO 6 — CARREGAR CLIENTES AO ABRIR A PÁGINA
─────────────────────────────────────────────────────── */
function carregarClientes() {
  const clientes = lerClientes();
  clientes.forEach(cliente => renderizarCard(cliente));
  atualizarContador();
}

/* ───────────────────────────────────────────────────────
   BLOCO 7 — IDENTIFICAÇÃO DO OPERADOR (SessionStorage)

   SessionStorage funciona como LocalStorage, mas é apagado
   automaticamente quando a aba ou o navegador é fechado.
   Ideal para dados de sessão como o nome do operador logado.
─────────────────────────────────────────────────────── */
function inicializarOperador() {
  // Tenta recuperar o nome já salvo nesta sessão
  let nomeOperador = sessionStorage.getItem('operador_nome');

  if (!nomeOperador) {
    // Primeira visita da sessão: pergunta o nome ao usuário
    const digitado = prompt('Bem-vindo(a)! Digite seu nome para identificação:');

    // Se o usuário cancelar ou deixar em branco, usa "Visitante"
    nomeOperador = (digitado && digitado.trim() !== '')
      ? digitado.trim()
      : 'Visitante';

    // Salva no SessionStorage — some quando a aba fechar
    sessionStorage.setItem('operador_nome', nomeOperador);
  }

  // Exibe o nome na barra do header
  document.getElementById('operador-nome').textContent = nomeOperador;
}

/* ───────────────────────────────────────────────────────
   BLOCO 8 — FILTRO DE BUSCA EM TEMPO REAL

   Lê o texto digitado no campo #filtro-busca e oculta/exibe
   cada card conforme o conteúdo bater com nome, e-mail ou plano.
   Não remove do DOM — apenas altera o display via CSS class,
   para não interferir com os dados reais do LocalStorage.
─────────────────────────────────────────────────────── */
function filtrarClientes() {
  // Termo de busca: converte para minúsculo para comparação sem case
  const termo = document.getElementById('filtro-busca').value.trim().toLowerCase();

  // Seleciona todos os cards já renderizados na lista
  const cards = document.querySelectorAll('.card-cliente');

  let visiveis = 0;

  cards.forEach(card => {
    // Extrai o texto do card inteiro (nome + email + plano + endereço)
    const textoCard = card.textContent.toLowerCase();

    if (textoCard.includes(termo)) {
      // Bate com o filtro: garante que está visível
      card.style.display = '';
      visiveis++;
    } else {
      // Não bate: esconde o card
      card.style.display = 'none';
    }
  });

  // Atualiza o contador mostrando quantos estão visíveis
  document.getElementById('counter').innerHTML =
    `<strong>${visiveis}</strong> cliente(s) encontrado(s)`;

  // Mostra o "estado vazio" se nenhum card bater com o filtro
  const lista       = document.getElementById('lista-clientes');
  const jaTemVazio  = lista.querySelector('.filtro-vazio');

  if (visiveis === 0 && cards.length > 0) {
    // Há clientes cadastrados, mas nenhum bate com o filtro
    if (!jaTemVazio) {
      const aviso = document.createElement('div');
      aviso.className = 'empty-state filtro-vazio';
      aviso.innerHTML = `<div class="icon">🔎</div><p>Nenhum cliente encontrado para "<strong>${termo}</strong>".</p>`;
      lista.appendChild(aviso);
    }
  } else if (jaTemVazio) {
    // Filtro foi limpo ou voltou a ter resultados: remove o aviso
    jaTemVazio.remove();
  }
}

/* ───────────────────────────────────────────────────────
   UTILITÁRIOS
─────────────────────────────────────────────────────── */
function atualizarContador() {
  const total = lerClientes().length;
  document.getElementById('counter').innerHTML =
    `<strong>${total}</strong> cliente(s) registrado(s)`;
}

function limparFormulario() {
  ['nome', 'email', 'plano', 'cep', 'logradouro', 'bairro', 'cidade', 'uf']
    .forEach(id => {
      document.getElementById(id).value = '';
    });
}

/* ───────────────────────────────────────────────────────
   EVENT LISTENERS
─────────────────────────────────────────────────────── */

// Busca o endereço quando o campo CEP perder o foco
document.getElementById('cep').addEventListener('blur', function () {
  buscarEndereco(this.value);
});

// Busca também quando o usuário atingir 8 dígitos enquanto digita
document.getElementById('cep').addEventListener('input', function () {
  const cepLimpo = this.value.replace(/\D/g, '');
  if (cepLimpo.length === 8) {
    buscarEndereco(this.value);
  }
});

// Botão salvar
document.getElementById('btn-salvar').addEventListener('click', salvarCliente);

/* ───────────────────────────────────────────────────────
   INICIALIZAÇÃO
   Ordem importa: operador primeiro (exige DOM pronto),
   depois carrega os cards do LocalStorage.
─────────────────────────────────────────────────────── */
inicializarOperador(); // → SessionStorage (pergunta o nome)
carregarClientes();    // → LocalStorage   (reconstrói os cards)
