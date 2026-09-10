# Vendo30

Simulador visual de uma máquina de vendas modelada como um autômato finito determinístico.

## Executar

Abra o arquivo `index.html` no navegador. Não há dependências ou etapa de build.

## Regras da máquina

- As moedas aceitas são 5, 10 e 25 centavos.
- Os estados representam o crédito acumulado: `q0`, `q5`, `q10`, `q15`, `q20`, `q25` e `q30`.
- Moedas que ultrapassarem 30 centavos são aceitas, e a máquina permanece no estado final `q30`.
- Os três produtos ficam sempre visíveis na vitrine, mas só podem ser selecionados ao chegar em `q30`.
- Ao chegar em `q30`, o troco é calculado como `crédito - 30` e os produtos são habilitados para seleção.
- Depois da retirada do produto, a máquina retorna para `q0`.