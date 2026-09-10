# Vendo30

Simulador visual de uma máquina de vendas modelada como um autômato finito determinístico. O projeto permite inserir moedas, acompanhar o crédito, escolher um produto e observar cada transição no autômato de forma interativa.

## Executar

Abra o arquivo `index.html` em um navegador. O projeto funciona diretamente no navegador e não exige instalação de dependências ou etapa de build.

## Painel da máquina

O painel representa visualmente uma máquina de vendas física:

- O visor mostra o total de crédito inserido.
- A barra de progresso indica a proximidade do valor mínimo de 30 centavos.
- Os botões permitem inserir moedas de 5¢, 10¢ e 25¢.
- A vitrine mantém três produtos visíveis durante toda a simulação.
- Antes de atingir o valor mínimo, os produtos ficam bloqueados.
- Ao alcançar um estado final, os produtos são habilitados para seleção.
- O painel informa o valor do troco quando o crédito ultrapassa 30¢.
- Depois da retirada de um produto, a máquina devolve o troco, registra a operação e retorna ao estado inicial `q0`.
- O botão de reinício limpa o crédito, o histórico e os destaques do autômato.

## Autômato interativo

O painel do autômato apresenta todos os estados possíveis e suas transições. As linhas possuem setas que indicam o sentido do caminho. As transições ainda não utilizadas aparecem de forma discreta; quando uma moeda é inserida, o caminho percorrido fica destacado.

Os estados podem ser arrastados individualmente pelo usuário. Ao mover um estado, as setas e os rótulos das transições permanecem conectados e são reposicionados automaticamente. Assim, o usuário pode reorganizar o grafo para estudar melhor uma sequência específica.

Em telas menores, o painel mantém o tamanho necessário para preservar a leitura do grafo e pode ser navegado horizontalmente.

## Modelagem do autômato

O autômato pode ser descrito pela quíntupla:

$$
M = (Q, \Sigma, \delta, q_0, F)
$$

### Estados

Cada estado representa o crédito acumulado em centavos:

$$
Q = \{q0, q5, q10, q15, q20, q25, q30, q35, q40, q45, q50\}
$$

- `q0` é o estado inicial, sem crédito inserido.
- `q5`, `q10`, `q15`, `q20` e `q25` são estados intermediários.
- `q30`, `q35`, `q40`, `q45` e `q50` são estados finais, pois já permitem escolher um produto.

O valor máximo representado é 50¢ porque, antes de liberar a compra, o maior crédito intermediário possível é 25¢ e a maior moeda aceita é 25¢. Portanto, a maior transição possível é `q25 + 25¢ = q50`.

### Alfabeto de entrada

O alfabeto representa as moedas aceitas pela máquina:

$$
\Sigma = \{5, 10, 25\}
$$

### Estado inicial

O autômato sempre começa em `q0`. A partir dele, cada moeda inserida produz uma transição para um novo estado:

- `q0 + 5¢ = q5`
- `q0 + 10¢ = q10`
- `q0 + 25¢ = q25`

### Função de transição

Para os estados que ainda não atingiram 30¢, a transição soma o valor da moeda ao crédito atual:

$$
\delta(q_{valor}, moeda) = q_{valor + moeda}
$$

Alguns exemplos:

- `q5 + 5¢ = q10`
- `q5 + 10¢ = q15`
- `q5 + 25¢ = q30`
- `q10 + 25¢ = q35`
- `q15 + 25¢ = q40`
- `q20 + 25¢ = q45`
- `q25 + 25¢ = q50`

As setas das moedas apontam do estado inicial da transição para o estado de destino. Quando o crédito atinge ou ultrapassa 30¢, a inserção de moedas é encerrada e os produtos são liberados.

### Estados finais e troco

Todos os estados a partir de 30¢ são estados finais. O troco é determinado pela diferença entre o crédito acumulado e o preço do produto:

$$
troco = crédito - 30
$$

| Estado final | Crédito | Troco |
| --- | ---: | ---: |
| `q30` | 30¢ | 0¢ |
| `q35` | 35¢ | 5¢ |
| `q40` | 40¢ | 10¢ |
| `q45` | 45¢ | 15¢ |
| `q50` | 50¢ | 20¢ |

Essa estrutura representa as diferentes combinações de moedas que podem ultrapassar o preço exato. Por exemplo, `10¢ + 25¢` leva a `q35`, enquanto `25¢ + 25¢` leva a `q50`.

### Seleção do produto e retorno

Depois que um produto é selecionado, ocorre uma transição de retorno do estado final atual para `q0`. Essas transições são representadas por setas no sentido do estado final para o estado inicial:

- `q30 -- selecionar --> q0`
- `q35 -- selecionar --> q0`
- `q40 -- selecionar --> q0`
- `q45 -- selecionar --> q0`
- `q50 -- selecionar --> q0`

O valor do troco é exibido antes da retirada e a máquina fica pronta para uma nova operação depois que o produto é liberado.

## Exemplos de sequências

| Sequência de moedas | Estado final | Troco |
| --- | --- | ---: |
| `5¢ + 25¢` | `q30` | 0¢ |
| `10¢ + 25¢` | `q35` | 5¢ |
| `5¢ + 10¢ + 25¢` | `q40` | 10¢ |
| `5¢ + 5¢ + 10¢ + 25¢` | `q45` | 15¢ |
| `25¢ + 25¢` | `q50` | 20¢ |