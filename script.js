// ============================================
// CONFIGURAÇÕES INICIAIS E ELEMENTOS DO DOM
// ============================================
const CHAVE_STORAGE = "clientes_db"; // chave usada no LocalStorage
let listaClientes = [];              // armazena todos os clientes em memória

// Elementos do formulário
const formulario = document.getElementById("formularioCliente");
const campoNome = document.getElementById("campoNome");
const campoEmail = document.getElementById("campoEmail");
const campoPlano = document.getElementById("campoPlano");
const campoCep = document.getElementById("campoCep");
const campoLogradouro = document.getElementById("campoLogradouro");
const campoBairro = document.getElementById("campoBairro");
const campoCidade = document.getElementById("campoCidade");
const campoUf = document.getElementById("campoUf");
const campoNumero = document.getElementById("campoNumero");
const campoComplemento = document.getElementById("campoComplemento");
const feedbackCep = document.getElementById("feedbackCep");
const feedbackSalvamento = document.getElementById("feedbackSalvamento");
const botaoSalvar = document.getElementById("botaoSalvar");

// Elementos da lista de clientes
const containerCards = document.getElementById("containerCards");
const campoBusca = document.getElementById("campoBusca");

// Elemento do operador (cabeçalho)
const nomeOperadorSpan = document.getElementById("nomeOperador");

//Carrega os clientes do LocalStorage para o array listaClientes. Se os dados estiverem corrompidos ou não forem um JSON válido, inicia com array vazio.
function carregarClientes() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  if (dados) { //verifica se existe algo armazenado
    try {
      listaClientes = JSON.parse(dados);   // JSON.parse → objeto
      if (!Array.isArray(listaClientes)) listaClientes = []; //se não for array, reseta para vazio.
    } catch (e) { //se os dados estiverem corrompidos ou não forem um JSON válido, captura o erro e inicia com array vazio.
      console.log("⚠️ Erro ao carregar dados do LocalStorage:", e.message);  
      listaClientes = [];
    }
  } else { //se não existir nada, inicia com array vazio
    listaClientes = [];
  }
}

//Salva o array listaClientes no LocalStorage.
function salvarClientes() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaClientes));
}

// Adiciona um novo cliente ao array e persiste. Verifica duplicidade de e‑mail (case insensitive).
function adicionarCliente(dadosCliente) {
  const duplicado = listaClientes.some( //percorre a lista para verificar se já existe um cliente com o mesmo e‑mail (ignora maiúsculas/minúsculas)
    cliente => cliente.email.toLowerCase() === dadosCliente.email.toLowerCase() //toLowerCase() → converte para minúsculas para comparação
  );
  if (duplicado) {
    mostrarFeedbackSalvamento("⚠️ E-mail já cadastrado!", "erro");
    return false;
  }
  const novo = {
    id: Date.now() + Math.floor(Math.random() * 10000), //cria id único (timestamp)
    ...dadosCliente //junta os dados do cliente (nome, email, plano, endereço etc.)
  };
  listaClientes.push(novo); //addiona o novo cliente ao array
  salvarClientes(); //salva a lista atualizada no LocalStorage
  return true;
}

//Remove um cliente da lista pelo id.
function removerCliente(id) {
  const indice = listaClientes.findIndex(cliente => cliente.id === id); //procura o índice do cliente com o id fornecido
  if (indice !== -1) {
    listaClientes.splice(indice, 1); //remove o cliente do array (splice → remove 1 elemento no índice encontrado)
    salvarClientes();
    return true;
  }
  return false;
}

// ---------- SESSIONSTORAGE (Operador da sessão) ----------
// REQUISITO: Identificação com SessionStorage – operador salvo apenas na sessão atual.

/**
 * Inicializa o operador: pergunta o nome na primeira vez
 * e permite trocar clicando no nome exibido.
 */
function inicializarOperador() {
  let nome = sessionStorage.getItem("operador_nome");
  if (!nome) {
    nome = perguntarNomeOperador();
  }
  nomeOperadorSpan.textContent = nome;
  nomeOperadorSpan.classList.add("clicavel");
  nomeOperadorSpan.addEventListener("click", trocarOperador);
}

//Exibe um prompt para o usuário digitar o nome do operador.
function perguntarNomeOperador() {
  let nome = prompt("✨ Bem-vindo(a)!\nDigite seu nome de operador:", ""); //gera o prompt na tela para o usuário digitar o nome do operador e salva em nome.
  if (!nome || nome.trim() === "") {
    nome = "Operador não identificado";
  }
  sessionStorage.setItem("operador_nome", nome.trim());
  return nome.trim();
}

//Troca o operador da sessão atual.
function trocarOperador() {
  const antigo = sessionStorage.getItem("operador_nome");
  if (confirm(`Operador atual: ${antigo}\n\nDeseja trocar?`)) { //gera uma caixa de confirmação na tela para o usuário confirmar se deseja trocar o operador, mostrando o nome do operador atual.
    const novo = perguntarNomeOperador();
    nomeOperadorSpan.textContent = novo;
  }
}

// Verifica se tem @ e pelo menos um ponto depois do @
function emailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

//Aplica/remove classe de erro no campo de e‑mail (gatilho blur).
function validarCampoEmail() {
  const valor = campoEmail.value;
  if (!emailValido(valor) && valor !== "") {
    campoEmail.classList.add("campo-invalido");
  } else {
    campoEmail.classList.remove("campo-invalido");
  }
}

//Ordena a lista de clientes primeiro por plano (Gold > Silver > Bronze) e depois por nome (A-Z) dentro do mesmo plano.
function ordenarClientes(lista) {
  const ordemPlanos = { 'Gold': 1, 'Silver': 2, 'Bronze': 3 }; // define a prioridade de cada plano
  return [...lista].sort((cliente1, cliente2) => { //devolve a lista ordenada sem modificar a original (spread operator para criar uma cópia)
    // se o plano não existir na lista, vai para o final (99)
    const pa = ordemPlanos[cliente1.plano] || 99;  
    const pb = ordemPlanos[cliente2.plano] || 99;
    if (pa !== pb) return pa - pb;          // ordena primeiro por plano
    return cliente1.nome.localeCompare(cliente2.nome, 'pt-BR'); // se mesmo plano, ordena por nome
  });
} 

// ---------- RENDERIZAÇÃO DOS CARDS (createElement) ----------
//Constrói dinamicamente os cards no DOM, aplicando filtro de busca e a ordenação fixa (plano + alfabética).
function renderizarCards() {
  const termoDeBusca = campoBusca.value.trim().toLowerCase(); //pega o termo digitado no campo de busca, remove espaços extras e converte para minúsculas para comparação case insensitive.

  // Filtra pelo termo de busca (nome, email, plano ou cidade)
  let filtrados = listaClientes; //
  if (termoDeBusca !== "") {
    filtrados = listaClientes.filter(cliente => //metodo filter percorre a lista de clientes e retorna um novo array apenas com os clientes que atendem à condição definida na função.
      cliente.nome.toLowerCase().includes(termoDeBusca) ||
      cliente.email.toLowerCase().includes(termoDeBusca) ||
      cliente.plano.toLowerCase().includes(termoDeBusca) ||
      (cliente.cidade && cliente.cidade.toLowerCase().includes(termoDeBusca))
    );
  }

  // Aplica a ordenação fixa (plano + alfabética)
  const ordenados = ordenarClientes(filtrados);

  // Limpa o container
  containerCards.innerHTML = "";

  // Estado vazio
  if (ordenados.length === 0) {
    const msg = document.createElement("div");
    msg.className = "mensagem-vazio";
    msg.textContent = termoDeBusca ? "🔎 Nenhum cliente encontrado" : "📭 Nenhum cliente cadastrado";
    containerCards.appendChild(msg);
    return;
  }

  // Cria cada card individualmente
  ordenados.forEach(cliente => {
    const card = document.createElement("div");
    // Define classe de cor conforme o plano (REQUISITO: cor de destaque)
    let classeCor = "";
    if (cliente.plano === "Gold") classeCor = "plano-gold";
    else if (cliente.plano === "Silver") classeCor = "plano-silver";
    else if (cliente.plano === "Bronze") classeCor = "plano-bronze";
    card.className = `cartao-cliente ${classeCor}`;

    // Container das informações
    const info = document.createElement("div");
    info.className = "info-cliente";

    // Nome
    const nomeEl = document.createElement("h3");
    nomeEl.textContent = cliente.nome;

    // E‑mail
    const emailEl = document.createElement("p"); 
    emailEl.innerHTML = `📧 ${cliente.email}`;

    // Plano (com o mesmo emoji do <select>)
    const planoEl = document.createElement("p");
    const badge = document.createElement("span");
    badge.className = "badge-plano";
    let emoji = "";
    if (cliente.plano === "Gold") emoji = "✨ Gold";
    else if (cliente.plano === "Silver") emoji = "⚪ Silver";
    else emoji = "🟤 Bronze";
    badge.textContent = emoji;
    planoEl.appendChild(badge);//addiona o badge com o nome do plano ao elemento do plano

    info.appendChild(nomeEl); //addiona o nome ao container de informações do card
    info.appendChild(emailEl); //addiona o e‑mail ao container de informações do card
    info.appendChild(planoEl); //addiona o plano ao container de informações do card

    // Endereço (se existir CEP)
    if (cliente.cep) {
      const endEl = document.createElement("p");
      endEl.className = "info-endereco";
      let txt = `📍 ${cliente.logradouro || ''}`;
      if (cliente.numero) txt += `, ${cliente.numero}`;
      if (cliente.complemento) txt += ` - ${cliente.complemento}`;
      txt += ` | ${cliente.bairro || ''} - ${cliente.cidade || ''}/${cliente.uf || ''}`;
      endEl.textContent = txt;
      info.appendChild(endEl); //addiona o endereço ao container de informações do card
    }

    // Botão de remover (excluir do DOM e LocalStorage)
    const btnRemover = document.createElement("button");
    btnRemover.textContent = "✖";
    btnRemover.className = "botao-remover";
    btnRemover.setAttribute("aria-label", "Remover cliente");
    btnRemover.addEventListener("click", (e) => {
      e.stopPropagation(); // evita que clique no card dispare outros eventos (se houver)
      if (confirm(`Remover ${cliente.nome}?`)) { //exibe uma caixa de confirmação para o usuário confirmar a exclusão do cliente, mostrando o nome do cliente.
        removerCliente(cliente.id); // remove do LocalStorage
        renderizarCards(); // re‑renderiza após exclusão removendo o cliente do DOM
      }
    });

    card.appendChild(info); //addiona as informações ao card
    card.appendChild(btnRemover); //addiona o botão de remover ao card
    containerCards.appendChild(card); //addiona o card completo ao container de cards no DOM
  });
}

//Atualiza toda a interface (conveniência). Chamado após operações que alteram os dados (ex: cadastro, exclusão) para garantir que a interface esteja sempre sincronizada com os dados atuais.
//Utilizado para centralizar a lógica de atualização da interface, evitando chamadas repetidas de renderizarCards() em vários pontos do código. 
// Se no futuro houver mais elementos a atualizar além dos cards, basta adicionar aqui.
function atualizarInterface() {
  renderizarCards();
}

/* === SPRINT 2 === */
//Busca o endereço na API ViaCEP usando async/await.
//async, continua rodando o código e aguarda a resposta da API sem travar a interface.
async function buscarEndereco(cepDigitado) { 
    //try/catch para tratar erros de conexão ou CEP não encontrado.
    try {    
        const cepLimpo = cepDigitado.replace(/\D/g, ''); //remove tudo que não for número do CEP (ex: 01001-000 → 01001000)
        if (cepLimpo.length !== 8) return;               //só busca quando digitado o CEP completo (8 dígitos)

        // Feedback de carregamento (visual durante a consulta)
        mostrarFeedbackCep("⏳ Buscando endereço...", "carregando"); //exibe uma mensagem de carregamento enquanto aguarda a resposta da API.
        campoLogradouro.value = "Carregando...";
        campoBairro.value = "Carregando...";
        campoCidade.value = "Carregando...";
        campoUf.value = "Carregando...";

        //faz a requisição para a API ViaCEP usando o CEP limpo (apenas números). 
        // O await faz com que o código espere a resposta da API antes de continuar, sem travar a interface.
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`); 
        //verifica se a resposta da API foi bem‑sucedida (status 200-299). Se não for, lança um erro para ser tratado no catch.
        if (!resposta.ok) throw new Error("Falha na conexão");

        //converte a resposta da API para um objeto JavaScript. O await garante que o código espere a conversão antes de continuar.
        const dados = await resposta.json(); 
        if (dados.erro) throw new Error("CEP não encontrado"); 

        // Preenche os campos com os dados retornados
        campoLogradouro.value = dados.logradouro || ""; //se o dado não existir, preenche com string vazia para evitar mostrar "undefined"
        campoBairro.value = dados.bairro || "";
        campoCidade.value = dados.localidade || "";
        campoUf.value = dados.uf || "";

        mostrarFeedbackCep("✅ Endereço encontrado!", "sucesso");
        campoNumero.focus(); // já posiciona no campo número
    } catch (erro) {
        // Em caso de erro, limpa os campos
        campoLogradouro.value = "";
        campoBairro.value = "";
        campoCidade.value = "";
        campoUf.value = "";
        mostrarFeedbackCep(erro.message, "erro"); //exibe a mensagem de erro capturada (pode ser "Falha na conexão" ou "CEP não encontrado")
    }
}

//Exibe feedback visual para a consulta de CEP.
function mostrarFeedbackCep(mensagem, tipo) { //tipo pode ser "carregando", "sucesso" ou "erro"
  feedbackCep.style.display = "block";
  feedbackCep.textContent = mensagem;
  feedbackCep.className = `feedback-cep ${tipo}`; //aplica a classe de estilo conforme o tipo (carregando, sucesso ou erro)
  if (tipo === "sucesso") {
    setTimeout(() => { feedbackCep.style.display = "none"; }, 4000); //esconde o feedback de sucesso após 4 segundos, dando tempo para o usuário ler a mensagem.
  }
}

//Exibe feedback visual abaixo do botão de salvar.
function mostrarFeedbackSalvamento(mensagem, tipo) {
  feedbackSalvamento.style.display = "block";
  feedbackSalvamento.textContent = mensagem;
  feedbackSalvamento.className = `feedback-salvamento ${tipo}`;
  if (tipo === "sucesso") {
    setTimeout(() => { feedbackSalvamento.style.display = "none"; }, 5000);
  }
}

// REQUISITO: Criar uma Promise customizada que resolve após 2 segundos.
function simularProcessamento() {
  return new Promise((resolve) => { //cria uma nova Promise que recebe uma função com o parâmetro resolve, que é a função que deve ser chamada para resolver a Promise.
    setTimeout(() => resolve("Processamento concluído"), 2000); //usa setTimeout para simular um atraso de 2 segundos, e depois chama resolve para indicar que a Promise foi resolvida com sucesso, passando uma mensagem como resultado.
  });
}

// ---------- FLUXO DE CADASTRO ASSÍNCRONO ----------
// REQUISITO: Fluxo de cadastro assíncrono com async/await, try/catch/finally.
// REQUISITO: Botão desabilitado e texto "Salvando..." durante o processamento.
//disparado quando o formulário é submetido (evento submit). 
async function processarCadastro(evento) {  
  evento.preventDefault();           // evita recarregar a página
  feedbackSalvamento.style.display = "none";

  try {
    // --- 1. Validação local ---
    //pega os valores dos campos do formulário, remove espaços extras e prepara para validação.
    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim();
    const plano = campoPlano.value;
    const cep = campoCep.value.trim();
    const logradouro = campoLogradouro.value;
    const bairro = campoBairro.value;
    const cidade = campoCidade.value;
    const uf = campoUf.value;
    const numero = campoNumero.value.trim();
    const complemento = campoComplemento.value.trim();

    //verifica se o campo está vazio. Se estiver, lança um erro com a mensagem "Nome obrigatório".
    if (!nome) throw new Error("❌ Nome obrigatório"); 
    if (!email) throw new Error("❌ E-mail obrigatório");
    if (!emailValido(email)) {
      campoEmail.classList.add("campo-invalido");
      throw new Error("❌ E-mail inválido");
    }
    if (!cep) throw new Error("❌ CEP obrigatório");

    // --- 2. Desabilitar botão e feedback de salvamento (REQUISITO) ---
    //desabilita o botão de salvar para evitar múltiplos cliques durante o processamento, 
    //muda o texto do botão para "Salvando..." e aplica uma classe de estilo para indicar que está em processo de salvamento. 
    // Também exibe um feedback visual informando que o processamento está em andamento.
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "⏳ Salvando...";
    botaoSalvar.classList.add("salvando");
    mostrarFeedbackSalvamento("⏳ Processando...", "carregando");

    // --- 3. Aguardar processamento simulado (2 segundos) ---
    //Chama a função simularProcessamento e aguarda sua resolução antes de continuar. 
    //Durante esse tempo, a interface permanece responsiva, permitindo que o usuário veja o feedback de carregamento.
    await simularProcessamento(); 

    // --- 4. Salvar no LocalStorage (todos os campos, inclusive endereço) ---
    const cliente = {
      nome, email, plano,
      cep: cep.replace(/\D/g, ''), // armazena apenas números
      logradouro, bairro, cidade, uf,
      numero, complemento
    };

    //Tenta adicionar o cliente, se for bem‑sucedido (sem e‑mail duplicado), continua o fluxo. 
    //Se retornar false, significa que o e‑mail já existe e o feedback de erro já foi exibido, então não faz mais nada.
    if (adicionarCliente(cliente)) { 
      // --- 5. Limpar formulário e atualizar interface ---
      limparFormulario(); //
      atualizarInterface();
      mostrarFeedbackSalvamento("✅ Cliente cadastrado!", "sucesso");
    }
  } catch (erro) {
    mostrarFeedbackSalvamento(erro.message, "erro");
  } finally {
    // --- 6. Reabilitar botão (sempre executa, mesmo com erro) ---
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = "💾 Salvar Cliente";
    botaoSalvar.classList.remove("salvando");
  }
}

//Limpa todos os campos do formulário e remove estilos de erro.
function limparFormulario() {
  campoNome.value = "";
  campoEmail.value = "";
  campoPlano.value = "Gold";
  campoCep.value = "";
  campoLogradouro.value = "";
  campoBairro.value = "";
  campoCidade.value = "";
  campoUf.value = "";
  campoNumero.value = "";
  campoComplemento.value = "";
  campoEmail.classList.remove("campo-invalido");
  feedbackCep.style.display = "none";
}

// CONFIGURAÇÃO DE EVENTOS
function configurarEventos() {
  // Validação de e‑mail ao perder o foco (Sprint 1)
  // O evento "blur" é disparado quando o campo de e‑mail perde o foco (ou seja, quando o usuário clica fora do campo ou navega para outro campo).
  // Chama a função validarCampoEmail para verificar se o e‑mail digitado é válido e aplicar a classe de erro se necessário.
  campoEmail.addEventListener("blur", validarCampoEmail);
  // Remove erro enquanto digita
  // O evento "input" é disparado sempre que o usuário digita algo no campo de e‑mail.
  // Verifica se o e‑mail é válido ou se o campo está vazio. Se for válido ou vazio, remove a classe de erro para dar feedback visual imediato ao usuário.
  campoEmail.addEventListener("input", () => {
    if (emailValido(campoEmail.value) || campoEmail.value === "") { 
      campoEmail.classList.remove("campo-invalido");
    }
  });

  // Busca de CEP no blur (Sprint 2)
  // Dispara a busca do endereço quando o campo de CEP perde o foco, mas somente se o campo não estiver vazio (após remover espaços extras). 
  // Isso evita chamadas desnecessárias à API quando o usuário ainda está digitando o CEP.
  campoCep.addEventListener("blur", () => {
    if (campoCep.value.trim() !== "") buscarEndereco(campoCep.value); 
  });
  // Máscara e busca automática ao digitar (Sprint 2)
  // O evento "input" é disparado sempre que o usuário digita algo no campo de CEP.
  // Aplica uma máscara para formatar o CEP no formato "XXXXX-XXX" enquanto o usuário digita, permitindo apenas números e limitando a 8 dígitos.
  // Quando o CEP completo é digitado (8 dígitos), chama a função buscarEndereco automaticamente para preencher os campos de endereço sem precisar sair do campo de CEP.
  campoCep.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, ''); //remove tudo que não for número do valor digitado
    if (valor.length > 8) valor = valor.substring(0, 8); //limita a 8 dígitos numéricos
    if (valor.length > 5) valor = valor.substring(0, 5) + '-' + valor.substring(5); //Se tem mais de 5 números, insere um hífen depois do 5º caractere
    campoCep.value = valor; //atualiza o campo de CEP com o valor formatado
    if (valor.replace(/\D/g, '').length === 8) buscarEndereco(valor); //chama a busca automática quando o CEP completo é digitado
  });

  // Submit assíncrono (Sprint 2)
  formulario.addEventListener("submit", processarCadastro); //quando o usuario clicka em "Salvar Cliente" envia o formulário e chama a função processarCadastro.

  // Filtro em tempo real (Sprint 1)
  campoBusca.addEventListener("input", renderizarCards); //quando o usuário digita no campo de busca, chama a função renderizarCards para atualizar a lista de clientes exibida conforme o termo de busca, aplicando o filtro em tempo real.
}

// INICIALIZAÇÃO DO SISTEMA
function iniciar() {
  carregarClientes();        // LocalStorage
  inicializarOperador();     // SessionStorage
  configurarEventos();       // Todos os eventos
  atualizarInterface();      // Renderiza cards iniciais
  campoEmail.classList.remove("campo-invalido"); // Garante que o campo de e‑mail comece sem a classe de erro, mesmo que o usuário tenha digitado algo inválido antes de recarregar a página.
  console.log("✅ Sistema iniciado");
}

// Inicia tudo ao carregar a página
iniciar();