import "./style.css";
import { type Flow, type FlowKind, type Vec2, flowLabel, magnitude, velocityAtPoint } from "./flow";

const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 500;
const WORLD_HALF_WIDTH = 5.5;
const WORLD_HALF_HEIGHT = 3.35;
const STEP_SIZE = 0.045;
const TRACE_STEPS = 460;
const SEED_SPACING = 0.45;
const GRID_SNAP = 0.25;
const DRAG_HIT_RADIUS = 14;
const SIDE_ANGLE_LIMIT = 80;
const DOMAIN_MARGIN = 0.25;

type BoundarySide = "left" | "right" | "top" | "bottom";

type SideFlow = {
  side: BoundarySide;
  enabled: boolean;
  speed: number;
  angleOffset: number;
};

type ViewState = {
  showVectors: boolean;
  showSeeds: boolean;
  selectedFlowId: string | null;
  flows: Flow[];
  sideFlows: SideFlow[];
};

type DragState = {
  flowId: string;
};

const state: ViewState = {
  showVectors: true,
  showSeeds: false,
  selectedFlowId: null,
  flows: [],
  sideFlows: createDefaultSideFlows(),
};

let dragState: DragState | null = null;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <main class="workbench" aria-label="Potential flow streamline workbench">
    <aside class="panel">
      <header class="panel-header">
        <h1>StreamLines</h1>
        <p>Compose ideal-flow primitives and watch the streamline field respond.</p>
      </header>

      <section class="control-group" aria-labelledby="add-flow-label">
        <h2 id="add-flow-label">Add Primitive</h2>
        <div class="button-grid">
          <button class="flow-add" type="button" data-kind="source">Source</button>
          <button class="flow-add" type="button" data-kind="sink">Sink</button>
          <button class="flow-add" type="button" data-kind="doublet">Doublet</button>
          <button class="flow-add" type="button" data-kind="vortex">Vortex</button>
        </div>
      </section>

      <section class="control-group" aria-labelledby="flows-label">
        <h2 id="flows-label">Active Flows</h2>
        <div id="flow-list" class="flow-list"></div>
      </section>

      <section class="control-group" aria-labelledby="editor-label">
        <h2 id="editor-label">Selected Flow</h2>
        <div id="flow-editor" class="editor-empty">Select a flow to edit its parameters.</div>
      </section>

      <section class="pane-footer" aria-label="Visualization controls">
        <label class="toggle">
          <input id="toggle-vectors" type="checkbox" checked />
          Velocity vectors
        </label>
        <label class="toggle">
          <input id="toggle-seeds" type="checkbox" />
          Seed points
        </label>
        <button id="reset-case" type="button">Reset</button>
      </section>
    </aside>

    <section class="stage-shell">
      <div class="boundary-layout" aria-label="Boundary uniform flow controls">
        <div id="side-top" class="side-control side-control-top"></div>
        <div id="side-left" class="side-control side-control-left"></div>
        <canvas id="flow-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" aria-label="Canvas showing potential flow streamlines"></canvas>
        <div id="side-right" class="side-control side-control-right"></div>
        <div id="side-bottom" class="side-control side-control-bottom"></div>
      </div>
      <div id="readout" class="readout">x 0.00, y 0.00, |V| 0.00</div>
    </section>
  </main>
`;

const canvas = requiredElement<HTMLCanvasElement>("#flow-canvas");
const context = requiredCanvasContext(canvas);
const flowList = requiredElement<HTMLDivElement>("#flow-list");
const flowEditor = requiredElement<HTMLDivElement>("#flow-editor");
const readout = requiredElement<HTMLDivElement>("#readout");
const vectorToggle = requiredElement<HTMLInputElement>("#toggle-vectors");
const seedToggle = requiredElement<HTMLInputElement>("#toggle-seeds");
const resetButton = requiredElement<HTMLButtonElement>("#reset-case");
const sideControls = new Map<BoundarySide, HTMLDivElement>([
  ["left", requiredElement<HTMLDivElement>("#side-left")],
  ["right", requiredElement<HTMLDivElement>("#side-right")],
  ["top", requiredElement<HTMLDivElement>("#side-top")],
  ["bottom", requiredElement<HTMLDivElement>("#side-bottom")],
]);

const css = getComputedStyle(document.documentElement);
const colors = {
  background: css.getPropertyValue("--canvas-background").trim(),
  grid: css.getPropertyValue("--canvas-grid").trim(),
  axis: css.getPropertyValue("--canvas-axis").trim(),
  streamline: css.getPropertyValue("--streamline").trim(),
  streamlineMuted: css.getPropertyValue("--streamline-muted").trim(),
  vector: css.getPropertyValue("--vector").trim(),
  marker: css.getPropertyValue("--marker").trim(),
  markerStroke: css.getPropertyValue("--marker-stroke").trim(),
};

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element ${selector} was not created.`);
  }

  return element;
}

function requiredCanvasContext(target: HTMLCanvasElement): CanvasRenderingContext2D {
  const nextContext = target.getContext("2d");

  if (!nextContext) {
    throw new Error("Canvas 2D context is not available.");
  }

  return nextContext;
}

document.querySelectorAll<HTMLButtonElement>(".flow-add").forEach((button) => {
  button.addEventListener("click", () => {
    const kind = button.dataset.kind as FlowKind;
    const flow = createFlow(kind);
    state.flows.push(flow);
    state.selectedFlowId = flow.id;
    renderUi();
    draw();
  });
});

vectorToggle.addEventListener("change", () => {
  state.showVectors = vectorToggle.checked;
  draw();
});

seedToggle.addEventListener("change", () => {
  state.showSeeds = seedToggle.checked;
  draw();
});

resetButton.addEventListener("click", () => {
  state.flows = [
    {
      id: crypto.randomUUID(),
      kind: "doublet",
      name: "Doublet 1",
      x: 0,
      y: 0,
      strength: 5,
      angle: 0,
      enabled: true,
    },
  ];
  state.sideFlows = createDefaultSideFlows();
  state.selectedFlowId = state.flows[0]?.id ?? null;
  renderUi();
  draw();
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const point = screenToWorld({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  const hoveredFlow = findFlowAtScreenPoint({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  const velocity = velocityAtPoint(point, activeFlows());
  readout.textContent = `x ${point.x.toFixed(2)}, y ${point.y.toFixed(2)}, |V| ${magnitude(velocity).toFixed(2)}`;
  canvas.classList.toggle("is-draggable", Boolean(hoveredFlow));
});

canvas.addEventListener("mouseleave", () => {
  readout.textContent = "x 0.00, y 0.00, |V| 0.00";
  canvas.classList.remove("is-draggable");
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const flow = findFlowAtScreenPoint(point);

  if (!flow) {
    return;
  }

  state.selectedFlowId = flow.id;
  dragState = { flowId: flow.id };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("is-dragging");
  moveFlowToPointer(flow, point);
  renderUi();
  draw();
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragState) {
    return;
  }

  const flow = state.flows.find((candidate) => candidate.id === dragState?.flowId);

  if (!flow) {
    dragState = null;
    canvas.classList.remove("is-dragging");
    return;
  }

  const rect = canvas.getBoundingClientRect();
  moveFlowToPointer(flow, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  renderEditor();
  draw();
});

canvas.addEventListener("pointerup", (event) => {
  dragState = null;
  canvas.releasePointerCapture(event.pointerId);
  canvas.classList.remove("is-dragging");
});

canvas.addEventListener("pointercancel", (event) => {
  dragState = null;
  canvas.releasePointerCapture(event.pointerId);
  canvas.classList.remove("is-dragging");
});

function createFlow(kind: FlowKind): Flow {
  const index = state.flows.filter((flow) => flow.kind === kind).length + 1;
  const defaults: Record<FlowKind, Pick<Flow, "x" | "y" | "strength" | "angle">> = {
    uniform: { x: 0, y: 0, strength: 1, angle: 0 },
    source: { x: -1.25, y: 0, strength: 4, angle: 0 },
    sink: { x: 1.25, y: 0, strength: 4, angle: 0 },
    doublet: { x: 0, y: 0, strength: 5, angle: 0 },
    vortex: { x: 0, y: 0, strength: 5, angle: 0 },
  };

  return {
    id: crypto.randomUUID(),
    kind,
    name: `${flowLabel(kind)} ${index}`,
    enabled: true,
    ...defaults[kind],
  };
}

function renderUi(): void {
  renderSideControls();
  flowList.innerHTML = "";

  state.flows.forEach((flow) => {
    const row = document.createElement("div");
    row.className = `flow-row${flow.id === state.selectedFlowId ? " selected" : ""}`;

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "flow-select";
    selectButton.textContent = flow.name;
    selectButton.addEventListener("click", () => {
      state.selectedFlowId = flow.id;
      renderUi();
      draw();
    });

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = flow.enabled;
    toggle.ariaLabel = `Enable ${flow.name}`;
    toggle.addEventListener("change", () => {
      flow.enabled = toggle.checked;
      draw();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-flow";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.flows = state.flows.filter((candidate) => candidate.id !== flow.id);
      if (state.selectedFlowId === flow.id) {
        state.selectedFlowId = state.flows[0]?.id ?? null;
      }
      renderUi();
      draw();
    });

    row.append(toggle, selectButton, remove);
    flowList.append(row);
  });

  renderEditor();
}

function renderSideControls(): void {
  state.sideFlows.forEach((sideFlow) => {
    const container = sideControls.get(sideFlow.side);

    if (!container) {
      return;
    }

    const angleDegrees = radiansToDegrees(sideFlow.angleOffset);
    const sideName = sideFlow.side[0].toUpperCase() + sideFlow.side.slice(1);

    container.innerHTML = `
      <label class="side-toggle">
        <input type="checkbox" data-side-toggle="${sideFlow.side}" ${sideFlow.enabled ? "checked" : ""} />
        ${sideName}
      </label>
      <label class="side-slider side-speed">
        <span>Velocity <output>${sideFlow.speed.toFixed(1)}</output></span>
        <input type="range" min="0" max="5" step="0.1" value="${sideFlow.speed}" data-side-speed="${sideFlow.side}" />
      </label>
      <div class="side-angle" data-side-angle="${sideFlow.side}">
        <span>Angle <output>${angleDegrees.toFixed(0)} deg</output></span>
        <svg viewBox="0 0 120 62" aria-hidden="true">
          <path class="angle-arc-track" d="M 18 48 A 42 42 0 0 1 102 48"></path>
          <path class="angle-arc-normal" d="M 60 48 L 60 13"></path>
          <line class="angle-arc-ray" x1="60" y1="48" x2="60" y2="13"></line>
          <circle class="angle-arc-handle" cx="60" cy="13" r="6"></circle>
        </svg>
      </div>
    `;

    const toggle = requiredChild<HTMLInputElement>(container, `[data-side-toggle="${sideFlow.side}"]`);
    const speed = requiredChild<HTMLInputElement>(container, `[data-side-speed="${sideFlow.side}"]`);
    const angle = requiredChild<HTMLDivElement>(container, `[data-side-angle="${sideFlow.side}"]`);
    updateAngleArc(angle, angleDegrees);

    toggle.addEventListener("change", () => {
      sideFlow.enabled = toggle.checked;
      draw();
    });

    speed.addEventListener("input", () => {
      sideFlow.speed = Number(speed.value);
      const output = requiredChild<HTMLOutputElement>(container, ".side-speed output");
      output.textContent = sideFlow.speed.toFixed(1);
      draw();
    });

    angle.addEventListener("pointerdown", (event) => {
      angle.setPointerCapture(event.pointerId);
      setSideAngleFromPointer(sideFlow, angle, event);
      draw();
    });

    angle.addEventListener("pointermove", (event) => {
      if (!angle.hasPointerCapture(event.pointerId)) {
        return;
      }

      setSideAngleFromPointer(sideFlow, angle, event);
      draw();
    });
  });
}

function renderEditor(): void {
  const flow = state.flows.find((candidate) => candidate.id === state.selectedFlowId);

  if (!flow) {
    flowEditor.className = "editor-empty";
    flowEditor.textContent = "Select a flow to edit its parameters.";
    return;
  }

  flowEditor.className = "editor";
  flowEditor.innerHTML = "";

  flowEditor.append(
    numberField("Strength", flow.strength, -12, 12, 0.1, (value) => {
      flow.strength = value;
    }),
  );

  if (flow.kind !== "uniform") {
    const position = document.createElement("p");
    position.className = "position-readout";
    position.textContent = `Position: (${flow.x.toFixed(2)}, ${flow.y.toFixed(2)})`;
    flowEditor.append(position);
  }

  if (flow.kind === "uniform" || flow.kind === "doublet") {
    flowEditor.append(
      numberField("Direction", radiansToDegrees(flow.angle), -180, 180, 1, (value) => {
        flow.angle = degreesToRadians(value);
      }, "deg"),
    );
  }
}

function numberField(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void,
  unit = "",
): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = "field";
  const formatted = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(1);

  field.innerHTML = `
    <span>${label} <output>${formatted}${unit ? ` ${unit}` : ""}</output></span>
    <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
  `;

  const input = field.querySelector<HTMLInputElement>("input");
  const output = field.querySelector<HTMLOutputElement>("output");

  if (!input || !output) {
    throw new Error("Range field was not created.");
  }

  input.addEventListener("input", () => {
    const nextValue = Number(input.value);
    onChange(nextValue);
    output.textContent = `${Number.isInteger(step) ? nextValue.toFixed(0) : nextValue.toFixed(1)}${unit ? ` ${unit}` : ""}`;
    draw();
  });

  return field;
}

function requiredChild<T extends Element>(parent: Element, selector: string): T {
  const element = parent.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required child ${selector} was not created.`);
  }

  return element;
}

function setSideAngleFromPointer(sideFlow: SideFlow, angleControl: HTMLDivElement, event: PointerEvent): void {
  const svg = requiredChild<SVGSVGElement>(angleControl, "svg");
  const rect = svg.getBoundingClientRect();
  const localX = ((event.clientX - rect.left) / rect.width) * 120;
  const localY = ((event.clientY - rect.top) / rect.height) * 62;
  const degrees = clamp(Math.atan2(localX - 60, 48 - localY) * (180 / Math.PI), -SIDE_ANGLE_LIMIT, SIDE_ANGLE_LIMIT);

  sideFlow.angleOffset = degreesToRadians(degrees);
  updateAngleArc(angleControl, degrees);
}

function updateAngleArc(angleControl: HTMLDivElement, degrees: number): void {
  const output = requiredChild<HTMLOutputElement>(angleControl, "output");
  const ray = requiredChild<SVGLineElement>(angleControl, ".angle-arc-ray");
  const handle = requiredChild<SVGCircleElement>(angleControl, ".angle-arc-handle");
  const point = angleHandlePoint(degrees);

  output.textContent = `${degrees.toFixed(0)} deg`;
  ray.setAttribute("x2", point.x.toFixed(2));
  ray.setAttribute("y2", point.y.toFixed(2));
  handle.setAttribute("cx", point.x.toFixed(2));
  handle.setAttribute("cy", point.y.toFixed(2));
}

function angleHandlePoint(degrees: number): Vec2 {
  const radians = degreesToRadians(degrees);

  return {
    x: 60 + Math.sin(radians) * 42,
    y: 48 - Math.cos(radians) * 42,
  };
}

function draw(): void {
  context.fillStyle = colors.background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid();
  drawStreamlines();

  if (state.showVectors) {
    drawVectors();
  }

  drawSingularities();
}

function drawGrid(): void {
  context.save();
  context.lineWidth = 1;
  context.strokeStyle = colors.grid;

  for (let x = -5; x <= 5; x += 0.5) {
    drawLine(worldToScreen({ x, y: -WORLD_HALF_HEIGHT }), worldToScreen({ x, y: WORLD_HALF_HEIGHT }));
  }

  for (let y = -3; y <= 3; y += 0.5) {
    drawLine(worldToScreen({ x: -WORLD_HALF_WIDTH, y }), worldToScreen({ x: WORLD_HALF_WIDTH, y }));
  }

  context.restore();
}

function drawStreamlines(): void {
  const seeds = makeSeeds();

  context.save();
  context.lineWidth = 1.25;

  seeds.forEach((seed, index) => {
    const forward = traceStreamline(seed, 1);
    const backward = traceStreamline(seed, -1).reverse();
    const line = [...backward, seed, ...forward];

    if (line.length < 4) {
      return;
    }

    context.strokeStyle = index % 4 === 0 ? colors.streamline : colors.streamlineMuted;
    context.beginPath();
    line.forEach((point, pointIndex) => {
      const screen = worldToScreen(point);
      if (pointIndex === 0) {
        context.moveTo(screen.x, screen.y);
      } else {
        context.lineTo(screen.x, screen.y);
      }
    });
    context.stroke();

    if (state.showSeeds) {
      const screenSeed = worldToScreen(seed);
      context.fillStyle = colors.marker;
      context.beginPath();
      context.arc(screenSeed.x, screenSeed.y, 2.4, 0, Math.PI * 2);
      context.fill();
    }
  });

  context.restore();
}

function traceStreamline(start: Vec2, direction: 1 | -1): Vec2[] {
  const points: Vec2[] = [];
  let point = start;

  for (let i = 0; i < TRACE_STEPS; i += 1) {
    const velocity = velocityAtPoint(point, activeFlows());
    const speed = magnitude(velocity);

    if (speed < 0.03 || isOutOfBounds(point)) {
      break;
    }

    const unit = { x: velocity.x / speed, y: velocity.y / speed };
    const next = rk4Step(point, unit, STEP_SIZE * direction);

    if (isOutOfBounds(next)) {
      break;
    }

    points.push(next);
    point = next;
  }

  return points;
}

function rk4Step(point: Vec2, unitVelocity: Vec2, step: number): Vec2 {
  const sampleUnit = (sample: Vec2): Vec2 => {
    const velocity = velocityAtPoint(sample, activeFlows());
    const speed = Math.max(magnitude(velocity), 0.001);
    return { x: velocity.x / speed, y: velocity.y / speed };
  };

  const k1 = unitVelocity;
  const k2 = sampleUnit({ x: point.x + (step * k1.x) / 2, y: point.y + (step * k1.y) / 2 });
  const k3 = sampleUnit({ x: point.x + (step * k2.x) / 2, y: point.y + (step * k2.y) / 2 });
  const k4 = sampleUnit({ x: point.x + step * k3.x, y: point.y + step * k3.y });

  return {
    x: point.x + (step / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: point.y + (step / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  };
}

function drawVectors(): void {
  context.save();
  context.strokeStyle = colors.vector;
  context.fillStyle = colors.vector;
  context.lineWidth = 1;

  for (let y = -WORLD_HALF_HEIGHT + 0.4; y <= WORLD_HALF_HEIGHT - 0.4; y += 0.65) {
    for (let x = -WORLD_HALF_WIDTH + 0.4; x <= WORLD_HALF_WIDTH - 0.4; x += 0.65) {
      const point = { x, y };

      const velocity = velocityAtPoint(point, activeFlows());
      const speed = magnitude(velocity);

      if (speed < 0.04) {
        continue;
      }

      const scale = Math.min(0.28, 0.11 + speed * 0.035);
      const unit = { x: velocity.x / speed, y: velocity.y / speed };
      const start = worldToScreen(point);
      const end = worldToScreen({ x: point.x + unit.x * scale, y: point.y + unit.y * scale });
      drawArrow(start, end);
    }
  }

  context.restore();
}

function drawSingularities(): void {
  context.save();

  state.flows.forEach((flow) => {
    if (flow.kind === "uniform") {
      return;
    }

    const point = worldToScreen({ x: flow.x, y: flow.y });
    context.fillStyle = colors.marker;
    context.strokeStyle = flow.id === state.selectedFlowId ? colors.markerStroke : colors.axis;
    context.lineWidth = flow.id === state.selectedFlowId ? 2.5 : 1.5;
    context.beginPath();
    context.arc(point.x, point.y, 7, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (flow.kind === "doublet") {
      const axis = { x: Math.cos(flow.angle), y: Math.sin(flow.angle) };
      drawLine(
        worldToScreen({ x: flow.x - axis.x * 0.28, y: flow.y - axis.y * 0.28 }),
        worldToScreen({ x: flow.x + axis.x * 0.28, y: flow.y + axis.y * 0.28 }),
      );
    }
  });

  context.restore();
}

function findFlowAtScreenPoint(point: Vec2): Flow | null {
  let nearestFlow: Flow | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  state.flows.forEach((flow) => {
    if (flow.kind === "uniform") {
      return;
    }

    const screen = worldToScreen({ x: flow.x, y: flow.y });
    const distance = Math.hypot(screen.x - point.x, screen.y - point.y);

    if (distance <= DRAG_HIT_RADIUS && distance < nearestDistance) {
      nearestFlow = flow;
      nearestDistance = distance;
    }
  });

  return nearestFlow;
}

function moveFlowToPointer(flow: Flow, point: Vec2): void {
  const world = screenToWorld(point);
  flow.x = snap(clamp(world.x, -WORLD_HALF_WIDTH + DOMAIN_MARGIN, WORLD_HALF_WIDTH - DOMAIN_MARGIN));
  flow.y = snap(clamp(world.y, -WORLD_HALF_HEIGHT + DOMAIN_MARGIN, WORLD_HALF_HEIGHT - DOMAIN_MARGIN));
}

function drawLine(start: Vec2, end: Vec2): void {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

function drawArrow(start: Vec2, end: Vec2): void {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - Math.cos(angle - 0.55) * 5, end.y - Math.sin(angle - 0.55) * 5);
  context.lineTo(end.x - Math.cos(angle + 0.55) * 5, end.y - Math.sin(angle + 0.55) * 5);
  context.closePath();
  context.fill();
}

function makeSeeds(): Vec2[] {
  const seeds: Vec2[] = [];

  for (let y = -WORLD_HALF_HEIGHT + DOMAIN_MARGIN; y <= WORLD_HALF_HEIGHT - DOMAIN_MARGIN; y += SEED_SPACING) {
    seeds.push({ x: -WORLD_HALF_WIDTH + DOMAIN_MARGIN, y });
    seeds.push({ x: WORLD_HALF_WIDTH - DOMAIN_MARGIN, y });
  }

  for (let x = -WORLD_HALF_WIDTH + DOMAIN_MARGIN; x <= WORLD_HALF_WIDTH - DOMAIN_MARGIN; x += SEED_SPACING) {
    seeds.push({ x, y: -WORLD_HALF_HEIGHT + DOMAIN_MARGIN });
    seeds.push({ x, y: WORLD_HALF_HEIGHT - DOMAIN_MARGIN });
  }

  return seeds;
}

function worldToScreen(point: Vec2): Vec2 {
  return {
    x: ((point.x + WORLD_HALF_WIDTH) / (WORLD_HALF_WIDTH * 2)) * CANVAS_WIDTH,
    y: ((WORLD_HALF_HEIGHT - point.y) / (WORLD_HALF_HEIGHT * 2)) * CANVAS_HEIGHT,
  };
}

function screenToWorld(point: Vec2): Vec2 {
  return {
    x: (point.x / CANVAS_WIDTH) * WORLD_HALF_WIDTH * 2 - WORLD_HALF_WIDTH,
    y: WORLD_HALF_HEIGHT - (point.y / CANVAS_HEIGHT) * WORLD_HALF_HEIGHT * 2,
  };
}

function isOutOfBounds(point: Vec2): boolean {
  return (
    point.x < -WORLD_HALF_WIDTH ||
    point.x > WORLD_HALF_WIDTH ||
    point.y < -WORLD_HALF_HEIGHT ||
    point.y > WORLD_HALF_HEIGHT
  );
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function snap(value: number): number {
  return Math.round(value / GRID_SNAP) * GRID_SNAP;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function activeFlows(): Flow[] {
  return [...state.flows, ...state.sideFlows.map(sideFlowToUniformFlow)];
}

function sideFlowToUniformFlow(sideFlow: SideFlow): Flow {
  return {
    id: `side-${sideFlow.side}`,
    kind: "uniform",
    name: `${sideFlow.side} boundary`,
    x: 0,
    y: 0,
    strength: sideFlow.speed,
    angle: sideBaseAngle(sideFlow.side) + sideFlow.angleOffset,
    enabled: sideFlow.enabled,
  };
}

function sideBaseAngle(side: BoundarySide): number {
  switch (side) {
    case "left":
      return 0;
    case "right":
      return Math.PI;
    case "top":
      return -Math.PI / 2;
    case "bottom":
      return Math.PI / 2;
  }
}

function createDefaultSideFlows(): SideFlow[] {
  return [
    { side: "left", enabled: true, speed: 1.2, angleOffset: 0 },
    { side: "right", enabled: false, speed: 1.2, angleOffset: 0 },
    { side: "top", enabled: false, speed: 1.2, angleOffset: 0 },
    { side: "bottom", enabled: false, speed: 1.2, angleOffset: 0 },
  ];
}

renderUi();
draw();
