// ---------- GERENCIAMENTO DE SESSIONSTORAGE (OPERADOR) ----------
function inicializarOperadorSession() {
    // Recupera ou pergunta o nome do operador
    let operadorNome = sessionStorage.getItem("operador_nome");
    const operadorSpan = document.getElementById("operadorNomeSpan");
    
    if (!operadorNome) {
        // Pergunta ao usuário via prompt (única vez por aba/sessão)
        let nomeDigitado = prompt("✨ Bem-vindo(a)! Digite seu nome para registrar como Operador(a) atual:", "Operador");
        if (nomeDigitado && nomeDigitado.trim() !== "") {
            operadorNome = nomeDigitado.trim();
            sessionStorage.setItem("operador_nome", operadorNome);
        } else {
            operadorNome = "Não informado";
            sessionStorage.setItem("operador_nome", operadorNome);
        }
    }
    operadorSpan.textContent = operadorNome;
}

// Carregamento inicial da página:
function init() {
    // 2) Inicializar operador (SessionStorage)
    inicializarOperadorSession();

}