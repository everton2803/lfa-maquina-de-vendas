const states = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const finalStates = [30, 35, 40, 45, 50];
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
const nodeRadius = 32;
const nodePositions = {
  0: { x: 70, y: 350 }, 5: { x: 280, y: 130 }, 10: { x: 500, y: 130 }, 15: { x: 720, y: 130 },
  20: { x: 280, y: 405 }, 25: { x: 500, y: 405 },
  30: { x: 900, y: 80 }, 35: { x: 900, y: 230 }, 40: { x: 900, y: 380 }, 45: { x: 900, y: 530 }, 50: { x: 900, y: 680 },
};
let draggedNode = null;

function transitionEdges() {
  const edges = new Map();
  states.filter((state) => state < 30).forEach((state) => {
    [5, 10, 25].forEach((coin) => {
      const target = state + coin;
      const key = `${state}-${target}`;
      if (!edges.has(key)) edges.set(key, { from: state, to: target, coins: [] });
      edges.get(key).coins.push(coin);
    });
  });
  finalStates.forEach((state) => edges.set(`${state}-0`, { from: state, to: 0, coins: ['selecionar'] }));
  return [...edges.values()];
}

function edgePath(edge, curveIndex, curveCount) {
  const from = nodePositions[edge.from];
  const to = nodePositions[edge.to];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const directionX = dx / length;
  const directionY = dy / length;
  const startX = from.x + directionX * nodeRadius;
  const startY = from.y + directionY * nodeRadius;
  const endX = to.x - directionX * nodeRadius;
  const endY = to.y - directionY * nodeRadius;
  const normalX = -dy / length;
  const normalY = dx / length;
  const curve = (curveIndex - (curveCount - 1) / 2) * 18;
  const controlX = (from.x + to.x) / 2 + normalX * curve;
  const controlY = (from.y + to.y) / 2 + normalY * curve;
  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

function renderAutomaton() {
  const currentState = credit;
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
    const labelEdge = finalStates.includes(edge.from) ? { from: edge.to, to: edge.from } : edge;
    const marker = activeEdges.has(key) ? 'arrowhead-active' : 'arrowhead';
    return `<g class="graph-edge ${activeEdges.has(key) ? 'is-active' : ''}" data-edge="${key}"><path d="${edgePath(edge, pairEdges.indexOf(edge), pairEdges.length)}" marker-end="url(#${marker})"></path><path class="graph-label-path" id="label-edge-${key}" d="${edgePath(labelEdge, pairEdges.indexOf(edge), pairEdges.length)}"></path><text><textPath href="#label-edge-${key}" startOffset="50%">${edge.coins.join(' / ')}</textPath></text></g>`;
  }).join('');
  const nodeMarkup = states.map((value) => {
    const final = finalStates.includes(value);
    const change = value - 30;
    return `<g class="graph-node ${final ? 'is-final' : ''} ${value === currentState ? 'is-current' : ''}" data-node="${value}"><circle cx="${nodePositions[value].x}" cy="${nodePositions[value].y}" r="${nodeRadius}"></circle><text x="${nodePositions[value].x}" y="${nodePositions[value].y - (final ? 4 : -5)}"><tspan x="${nodePositions[value].x}">q${value}</tspan>${final ? `<tspan x="${nodePositions[value].x}" dy="15">troco ${change}¢</tspan>` : ''}</text></g>`;
  }).join('');
  automatonGraph.innerHTML = `<defs><marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,1 L11,6 L0,11 z" fill="#7f9587"></path></marker><marker id="arrowhead-active" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,1 L12,6.5 L0,12 z" fill="#276044"></path></marker></defs><g class="graph-edges">${edgeMarkup}</g><g class="graph-nodes">${nodeMarkup}</g>`;
  edges.forEach((edge) => {
    const path = automatonGraph.querySelector(`[data-edge="${edge.from}-${edge.to}"] path`);
    if (path) path.id = `edge-${edge.from}-${edge.to}`;
  });
}

function updateGraphGeometry() {
  transitionEdges().forEach((edge) => {
    const path = automatonGraph.querySelector(`[data-edge="${edge.from}-${edge.to}"] path`);
    if (path) path.setAttribute('d', edgePath(edge, 0, 1));
    const labelPath = automatonGraph.querySelector(`[data-edge="${edge.from}-${edge.to}"] .graph-label-path`);
    if (labelPath) {
      const labelEdge = finalStates.includes(edge.from) ? { from: edge.to, to: edge.from } : edge;
      labelPath.setAttribute('d', edgePath(labelEdge, 0, 1));
    }
  });
  states.forEach((value) => {
    const node = automatonGraph.querySelector(`[data-node="${value}"]`);
    if (!node) return;
    const { x, y } = nodePositions[value];
    node.querySelector('circle').setAttribute('cx', x);
    node.querySelector('circle').setAttribute('cy', y);
    node.querySelector('text').setAttribute('x', x);
    node.querySelector('text').setAttribute('y', finalStates.includes(value) ? y - 3 : y + 4);
    node.querySelectorAll('tspan').forEach((line, index) => line.setAttribute('x', x));
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
    x: Math.max(35, Math.min(965, point.x)),
    y: Math.max(45, Math.min(675, point.y)),
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
    edge.querySelector('path').setAttribute('marker-end', 'url(#arrowhead-active)');
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
  if (credit >= 30) return;
  const nextCredit = credit + coin;
  const previousCredit = credit;
  credit = nextCredit;
  addTransition(previousCredit, coin, credit);
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
  stateReadout.textContent = `q${credit}`;
  coinButtons.forEach((button) => { button.disabled = credit >= 30; });
  updateProductAvailability();
  renderAutomaton();
}

function dispense(product) {
  message.textContent = `${product} liberado. Obrigado por usar a Vendo30!`;
  message.className = 'message success';
  status.textContent = 'Produto retirado';
  addTransition(credit, 0, 0);
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