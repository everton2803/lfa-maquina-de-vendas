const states = [0, 5, 10, 15, 20, 25, 30];
const products = [
  { name: 'Suco cítrico', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=420&q=85' },
  { name: 'Biscoito', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=420&q=85' },
  { name: 'Chá gelado', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=420&q=85' },
];

let credit = 0;
let iterations = 0;
const balance = document.querySelector('#balance');
const progressBar = document.querySelector('#progress-bar');
const message = document.querySelector('#message');
const status = document.querySelector('#machine-status');
const stateReadout = document.querySelector('#state-readout');
const automatonGraph = document.querySelector('#automaton-graph');
const transitionLog = document.querySelector('#transition-log-list');
const transitionCount = document.querySelector('#transition-count');
const productsArea = document.querySelector('#products-area');
const productGrid = document.querySelector('#product-grid');
const changeBadge = document.querySelector('#change-badge');
const coinButtons = document.querySelectorAll('.coin-button');
const activeEdges = new Set();
const nodePositions = {
  0: { x: 82, y: 165 }, 5: { x: 230, y: 75 }, 10: { x: 395, y: 75 },
  15: { x: 560, y: 75 }, 20: { x: 230, y: 255 }, 25: { x: 395, y: 255 }, 30: { x: 560, y: 255 },
};
let draggedNode = null;

function transitionEdges() {
  const edges = new Map();
  states.filter((state) => state < 30).forEach((state) => {
    [5, 10, 25].forEach((coin) => {
      const target = Math.min(state + coin, 30);
      const key = `${state}-${target}`;
      if (!edges.has(key)) edges.set(key, { from: state, to: target, coins: [] });
      edges.get(key).coins.push(coin);
    });
  });
  edges.set('30-0', { from: 30, to: 0, coins: ['selecionar'] });
  return [...edges.values()];
}

function edgePath(edge, curveIndex, curveCount) {
  const from = nodePositions[edge.from];
  const to = nodePositions[edge.to];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const curve = (curveIndex - (curveCount - 1) / 2) * 18;
  const controlX = (from.x + to.x) / 2 + normalX * curve;
  const controlY = (from.y + to.y) / 2 + normalY * curve;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function renderAutomaton() {
  const currentState = Math.min(credit, 30);
  const edges = transitionEdges();
  const groupedPairs = new Map();
  edges.forEach((edge) => {
    const pair = `${edge.from}-${edge.to}`;
    if (!groupedPairs.has(pair)) groupedPairs.set(pair, []);
    groupedPairs.get(pair).push(edge);
  });
  const edgeMarkup = edges.map((edge) => {
    const pairEdges = groupedPairs.get(`${edge.from}-${edge.to}`);
    const key = `${edge.from}-${edge.to}`;
    return `<g class="graph-edge ${activeEdges.has(key) ? 'is-active' : ''}" data-edge="${key}"><path d="${edgePath(edge, pairEdges.indexOf(edge), pairEdges.length)}" marker-end="url(#arrowhead)"></path><text><textPath href="#edge-${key}" startOffset="50%">${edge.coins.join(' / ')}</textPath></text></g>`;
  }).join('');
  const nodeMarkup = states.map((value) => `<g class="graph-node ${value === 30 ? 'is-final' : ''} ${value === currentState ? 'is-current' : ''}" data-node="${value}"><circle cx="${nodePositions[value].x}" cy="${nodePositions[value].y}" r="25"></circle><text x="${nodePositions[value].x}" y="${nodePositions[value].y + 4}">q${value}</text></g>`).join('');
  automatonGraph.innerHTML = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs><g class="graph-edges">${edgeMarkup}</g><g class="graph-nodes">${nodeMarkup}</g>`;
  edges.forEach((edge) => {
    const path = automatonGraph.querySelector(`[data-edge="${edge.from}-${edge.to}"] path`);
    if (path) path.id = `edge-${edge.from}-${edge.to}`;
  });
}

function updateGraphGeometry() {
  transitionEdges().forEach((edge) => {
    const path = automatonGraph.querySelector(`[data-edge="${edge.from}-${edge.to}"] path`);
    if (path) path.setAttribute('d', edgePath(edge, 0, 1));
  });
  states.forEach((value) => {
    const node = automatonGraph.querySelector(`[data-node="${value}"]`);
    if (!node) return;
    const { x, y } = nodePositions[value];
    node.querySelector('circle').setAttribute('cx', x);
    node.querySelector('circle').setAttribute('cy', y);
    node.querySelector('text').setAttribute('x', x);
    node.querySelector('text').setAttribute('y', y + 4);
  });
}

function graphPoint(event) {
  const svgPoint = automatonGraph.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  return svgPoint.matrixTransform(automatonGraph.getScreenCTM().inverse());
}

function startDragging(event) {
  const node = event.target.closest('.graph-node');
  if (!node) return;
  draggedNode = Number(node.dataset.node);
  automatonGraph.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function dragNode(event) {
  if (draggedNode === null) return;
  const point = graphPoint(event);
  nodePositions[draggedNode] = {
    x: Math.max(30, Math.min(730, point.x)),
    y: Math.max(35, Math.min(295, point.y)),
  };
  updateGraphGeometry();
}

function stopDragging(event) {
  if (draggedNode === null) return;
  if (automatonGraph.hasPointerCapture(event.pointerId)) automatonGraph.releasePointerCapture(event.pointerId);
  draggedNode = null;
  automatonGraph.style.cursor = '';
}

function highlightTransition(from, to) {
  const key = `${from}-${to}`;
  activeEdges.add(key);
  const edge = automatonGraph.querySelector(`[data-edge="${key}"]`);
  if (edge) {
    edge.classList.add('is-active', 'is-latest');
    setTimeout(() => edge.classList.remove('is-latest'), 650);
  }
}

function renderProducts() {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  productGrid.innerHTML = shuffled.map((product) => `<button class="product-card" type="button" data-product="${product.name}"><img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy"><strong>${product.name}</strong><small>retirar produto</small></button>`).join('');
  productGrid.querySelectorAll('.product-card').forEach((button) => button.addEventListener('click', () => dispense(button.dataset.product)));
  updateProductAvailability();
}

function updateProductAvailability() {
  const ready = credit >= 30;
  productGrid.querySelectorAll('.product-card').forEach((button) => { button.disabled = !ready; });
  changeBadge.textContent = ready ? `Troco: ${credit - 30}¢` : 'Bloqueada · 30¢';
}

function addTransition(from, coin, to, accepted = true) {
  const emptyLog = transitionLog.querySelector('.empty-log');
  if (emptyLog) emptyLog.remove();
  const item = document.createElement('li');
  item.innerHTML = `<span>${from === to ? '↺' : '→'} q${from} + ${coin}¢</span><strong>${accepted ? `q${to}` : 'rejeitada'}</strong>`;
  transitionLog.prepend(item);
  if (accepted) highlightTransition(from, to);
  iterations += 1;
  transitionCount.textContent = `${iterations} ${iterations === 1 ? 'iteração' : 'iterações'}`;
}

function insertCoin(coin) {
  if (credit === 30) return;
  const nextCredit = credit + coin;
  const previousCredit = credit;
  credit = nextCredit;
  const nextState = Math.min(credit, 30);
  addTransition(previousCredit, coin, nextState);
  updateDisplay();
  if (credit >= 30) {
    const change = credit - 30;
    message.textContent = change > 0 ? `Crédito completo. Seu troco será de ${change} centavos.` : 'Crédito completo. A vitrine foi liberada!';
    message.className = 'message success';
    status.textContent = 'Pronto para escolher';
    changeBadge.textContent = `Troco: ${change}¢`;
  } else {
    message.textContent = `Faltam ${30 - credit} centavos para liberar a vitrine.`;
    message.className = 'message';
  }
}

function updateDisplay() {
  balance.textContent = credit;
  progressBar.style.width = `${Math.min((credit / 30) * 100, 100)}%`;
  stateReadout.textContent = `q${Math.min(credit, 30)}`;
  coinButtons.forEach((button) => { button.disabled = credit >= 30; });
  updateProductAvailability();
  renderAutomaton();
}

function dispense(product) {
  message.textContent = `${product} liberado. Obrigado por usar a Vendo30!`;
  message.className = 'message success';
  status.textContent = 'Produto retirado';
  addTransition(30, 0, 0);
  credit = 0;
  updateDisplay();
  setTimeout(() => { message.textContent = 'A máquina está pronta para receber sua próxima moeda.'; message.className = 'message'; status.textContent = 'Aguardando moeda'; }, 1800);
}

function reset() {
  credit = 0;
  iterations = 0;
  transitionCount.textContent = '0 iterações';
  transitionLog.innerHTML = '<li class="empty-log">As transições aparecerão aqui.</li>';
  activeEdges.clear();
  message.textContent = 'A máquina está pronta para receber sua primeira moeda.';
  message.className = 'message';
  status.textContent = 'Aguardando moeda';
  updateDisplay();
}

coinButtons.forEach((button) => button.addEventListener('click', () => insertCoin(Number(button.dataset.coin))));
document.querySelector('#reset-button').addEventListener('click', reset);
automatonGraph.addEventListener('pointerdown', startDragging);
automatonGraph.addEventListener('pointermove', dragNode);
automatonGraph.addEventListener('pointerup', stopDragging);
automatonGraph.addEventListener('pointercancel', stopDragging);
renderProducts();
renderAutomaton();
updateDisplay();