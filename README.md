# Sprint 1: Dashboard de Clientes

## Entrega
* Código fonte organizado em `index.html`, `style.css` e `script.js`.
* O projeto deve permitir: Adicionar cliente -> Recarregar página -> Cliente continua lá.

# Sprint 2: Integração com API e Fluxo Assíncrono

## Resultado Esperado

Ao cadastrar um cliente:

1. Preencher CEP → endereço carregado automaticamente via API
2. Clicar em "Salvar" → botão desabilita e mostra "Salvando..."
3. Passa pela simulação de 2 segundos
4. Cliente aparece na lista com endereço completo
5. Recarregar a página → cliente continua salvo
6. Remover → exclui do DOM e do LocalStorage

O sistema agora não é apenas um CRUD local — ele **consome dados reais da internet**, **orquestra um fluxo assíncrono** e **dá feedback visual** ao usuário durante o processamento.
