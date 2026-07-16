import "./style.css";
import { type Flow, type FlowKind, type Vec2, flowLabel, magnitude, velocityAtPoint } from "./flow";

const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 500;
const WORLD_HALF_WIDTH = 5.5;
const WORLD_HALF_HEIGHT = 3.35;
const GRID_SNAP = 0.25;
const DRAG_HIT_RADIUS = 14;
const SIDE_ANGLE_LIMIT = 80;
const DOMAIN_MARGIN = 0.25;
const HOVER_REVEAL_DELAY_MS = 2000;
const STREAMLINE_STEP = 0.045;
const STREAMLINE_MAX_STEPS = 620;
const STREAMLINE_CANDIDATE_SPACING = 0.24;
const STREAMLINE_SAMPLE_STRIDE = 4;
const STREAMLINE_BASE_SPACING = 12;
const STREAMLINE_MIN_SPACING = 4.5;
const STREAMLINE_SPACING_CELL_SIZE = 12;

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
let hoveredFlowId: string | null = null;
let hoverTimer: number | null = null;

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
        <div id="primitive-tooltip" class="primitive-tooltip" role="status" aria-live="polite" hidden></div>
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
const primitiveTooltip = requiredElement<HTMLDivElement>("#primitive-tooltip");
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

const primitiveColors: Record<Exclude<FlowKind, "uniform">, string> = {
  source: css.getPropertyValue("--flow-source").trim(),
  sink: css.getPropertyValue("--flow-sink").trim(),
  doublet: css.getPropertyValue("--flow-doublet").trim(),
  vortex: css.getPropertyValue("--flow-vortex").trim(),
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
  updateHoveredFlow(hoveredFlow);
});

canvas.addEventListener("mouseleave", () => {
  readout.textContent = "x 0.00, y 0.00, |V| 0.00";
  canvas.classList.remove("is-draggable");
  clearHoverTooltip();
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const flow = findFlowAtScreenPoint(point);

  if (!flow) {
    clearHoverTooltip();
    return;
  }

  clearHoverTooltip();
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
    clearHoverTooltip();
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
  clearHoverTooltip();
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
    row.style.setProperty("--flow-color", flow.kind === "uniform" ? colors.marker : primitiveColor(flow));

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
    const dial = dialGeometry(sideFlow.side);

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
        <svg viewBox="0 0 120 72" aria-hidden="true">
          <path class="angle-arc-track" d="${dial.arcPath}"></path>
          <path class="angle-arc-flat" d="${dial.flatPath}"></path>
          <line class="angle-arc-line" x1="${dial.center.x}" y1="${dial.center.y}" x2="${dial.center.x}" y2="${dial.center.y}"></line>
          <circle class="angle-arc-handle" cx="${dial.center.x}" cy="${dial.center.y}" r="6"></circle>
        </svg>
      </div>
    `;

    const toggle = requiredChild<HTMLInputElement>(container, `[data-side-toggle="${sideFlow.side}"]`);
    const speed = requiredChild<HTMLInputElement>(container, `[data-side-speed="${sideFlow.side}"]`);
    const angle = requiredChild<HTMLDivElement>(container, `[data-side-angle="${sideFlow.side}"]`);
    updateAngleArc(angle, sideFlow.side, angleDegrees);

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
  const dial = dialGeometry(sideFlow.side);
  const rect = svg.getBoundingClientRect();
  const localX = ((event.clientX - rect.left) / rect.width) * 120;
  const localY = ((event.clientY - rect.top) / rect.height) * 72;
  const outward = normalizeVector({
    x: localX - dial.center.x,
    y: localY - dial.center.y,
  });
  const flowScreen = { x: -outward.x, y: -outward.y };
  const flowMathAngle = Math.atan2(-flowScreen.y, flowScreen.x);
  const degrees = clamp(
    radiansToDegrees(normalizeAngle(flowMathAngle - sideBaseAngle(sideFlow.side))),
    -SIDE_ANGLE_LIMIT,
    SIDE_ANGLE_LIMIT,
  );

  sideFlow.angleOffset = degreesToRadians(degrees);
  updateAngleArc(angleControl, sideFlow.side, degrees);
}

function updateAngleArc(angleControl: HTMLDivElement, side: BoundarySide, degrees: number): void {
  const output = requiredChild<HTMLOutputElement>(angleControl, "output");
  const line = requiredChild<SVGLineElement>(angleControl, ".angle-arc-line");
  const handle = requiredChild<SVGCircleElement>(angleControl, ".angle-arc-handle");
  const dial = dialGeometry(side);
  const flowAngle = sideBaseAngle(side) + degreesToRadians(degrees);
  const flowScreen = { x: Math.cos(flowAngle), y: -Math.sin(flowAngle) };
  const outward = { x: -flowScreen.x, y: -flowScreen.y };
  const start = {
    x: dial.center.x - outward.x * 18,
    y: dial.center.y - outward.y * 18,
  };
  const point = {
    x: dial.center.x + outward.x * dial.radius,
    y: dial.center.y + outward.y * dial.radius,
  };

  output.textContent = `${degrees.toFixed(0)} deg`;
  line.setAttribute("x1", start.x.toFixed(2));
  line.setAttribute("y1", start.y.toFixed(2));
  line.setAttribute("x2", point.x.toFixed(2));
  line.setAttribute("y2", point.y.toFixed(2));
  handle.setAttribute("cx", point.x.toFixed(2));
  handle.setAttribute("cy", point.y.toFixed(2));
}

function dialGeometry(side: BoundarySide): {
  center: Vec2;
  radius: number;
  arcPath: string;
  flatPath: string;
} {
  const radius = 40;
  const outwardBySide: Record<BoundarySide, Vec2> = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
  };
  const centerBySide: Record<BoundarySide, Vec2> = {
    left: { x: 100, y: 36 },
    right: { x: 20, y: 36 },
    top: { x: 60, y: 58 },
    bottom: { x: 60, y: 14 },
  };
  const center = centerBySide[side];
  const outward = outwardBySide[side];
  const tangent = { x: -outward.y, y: outward.x };
  const start = { x: center.x - tangent.x * radius, y: center.y - tangent.y * radius };
  const end = { x: center.x + tangent.x * radius, y: center.y + tangent.y * radius };

  return {
    center,
    radius,
    arcPath: semiCirclePath(center, outward, tangent, radius),
    flatPath: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
  };
}

function semiCirclePath(center: Vec2, outward: Vec2, tangent: Vec2, radius: number): string {
  const points: Vec2[] = [];

  for (let index = 0; index <= 24; index += 1) {
    const theta = Math.PI - (Math.PI * index) / 24;
    points.push({
      x: center.x + Math.cos(theta) * tangent.x * radius + Math.sin(theta) * outward.x * radius,
      y: center.y + Math.cos(theta) * tangent.y * radius + Math.sin(theta) * outward.y * radius,
    });
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function normalizeVector(vector: Vec2): Vec2 {
  const length = Math.max(Math.hypot(vector.x, vector.y), 0.001);

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function normalizeAngle(angle: number): number {
  let nextAngle = angle;

  while (nextAngle > Math.PI) {
    nextAngle -= Math.PI * 2;
  }

  while (nextAngle < -Math.PI) {
    nextAngle += Math.PI * 2;
  }

  return nextAngle;
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
  const acceptedSamples: Vec2[] = [];
  const spacingGrid = new SpacingGrid(STREAMLINE_SPACING_CELL_SIZE);
  const candidates = makeStreamlineCandidates();

  context.save();
  context.lineWidth = 1.25;

  candidates.forEach((seed, index) => {
    if (!spacingGrid.canAccept(seed, requiredStreamlineSpacing(seed))) {
      return;
    }

    const line = traceAdaptiveStreamline(seed, spacingGrid);

    if (line.length < 16) {
      return;
    }

    context.strokeStyle = index % 4 === 0 ? colors.streamline : colors.streamlineMuted;
    drawPolyline(line);
    const samples = samplePolyline(line);
    acceptedSamples.push(...samples);
    spacingGrid.addMany(samples);
  });

  if (state.showSeeds) {
    drawAcceptedSamples(acceptedSamples);
  }

  context.restore();
}

function makeStreamlineCandidates(): Vec2[] {
  const candidates: Vec2[] = [];

  for (let y = -WORLD_HALF_HEIGHT + DOMAIN_MARGIN; y <= WORLD_HALF_HEIGHT - DOMAIN_MARGIN; y += STREAMLINE_CANDIDATE_SPACING) {
    for (let x = -WORLD_HALF_WIDTH + DOMAIN_MARGIN; x <= WORLD_HALF_WIDTH - DOMAIN_MARGIN; x += STREAMLINE_CANDIDATE_SPACING) {
      candidates.push({ x, y });
    }
  }

  return candidates.sort((first, second) => {
    const firstSpeed = magnitude(velocityAtPoint(first, activeFlows()));
    const secondSpeed = magnitude(velocityAtPoint(second, activeFlows()));
    return secondSpeed - firstSpeed;
  });
}

function traceAdaptiveStreamline(seed: Vec2, spacingGrid: SpacingGrid): Vec2[] {
  const backward = traceStreamlineDirection(seed, -1, spacingGrid).reverse();
  const forward = traceStreamlineDirection(seed, 1, spacingGrid);
  return [...backward, seed, ...forward];
}

function traceStreamlineDirection(seed: Vec2, direction: 1 | -1, spacingGrid: SpacingGrid): Vec2[] {
  const points: Vec2[] = [];
  let point = seed;

  for (let step = 0; step < STREAMLINE_MAX_STEPS; step += 1) {
    const velocity = velocityAtPoint(point, activeFlows());
    const speed = magnitude(velocity);

    if (speed < 0.025) {
      break;
    }

    const next = rk4StreamlineStep(point, STREAMLINE_STEP * direction);

    if (isOutOfDomain(next) || !spacingGrid.canAccept(next, requiredStreamlineSpacing(next))) {
      break;
    }

    points.push(next);
    point = next;
  }

  return points;
}

function rk4StreamlineStep(point: Vec2, step: number): Vec2 {
  const unitVelocity = (sample: Vec2): Vec2 => {
    const velocity = velocityAtPoint(sample, activeFlows());
    const speed = Math.max(magnitude(velocity), 0.001);
    return { x: velocity.x / speed, y: velocity.y / speed };
  };
  const k1 = unitVelocity(point);
  const k2 = unitVelocity({ x: point.x + (step * k1.x) / 2, y: point.y + (step * k1.y) / 2 });
  const k3 = unitVelocity({ x: point.x + (step * k2.x) / 2, y: point.y + (step * k2.y) / 2 });
  const k4 = unitVelocity({ x: point.x + step * k3.x, y: point.y + step * k3.y });

  return {
    x: point.x + (step / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: point.y + (step / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  };
}

function requiredStreamlineSpacing(point: Vec2): number {
  const speed = magnitude(velocityAtPoint(point, activeFlows()));
  return clamp(STREAMLINE_BASE_SPACING / Math.sqrt(1 + speed * 0.55), STREAMLINE_MIN_SPACING, STREAMLINE_BASE_SPACING);
}

class SpacingGrid {
  private readonly cells = new Map<string, Vec2[]>();

  constructor(private readonly cellSize: number) {}

  canAccept(point: Vec2, requiredDistance: number): boolean {
    const screenPoint = worldToScreen(point);
    const cell = this.cellFor(screenPoint);
    const radius = Math.ceil(requiredDistance / this.cellSize);

    for (let y = cell.y - radius; y <= cell.y + radius; y += 1) {
      for (let x = cell.x - radius; x <= cell.x + radius; x += 1) {
        const samples = this.cells.get(this.key(x, y));

        if (!samples) {
          continue;
        }

        const tooClose = samples.some((sample) => {
          const screenSample = worldToScreen(sample);
          return Math.hypot(screenPoint.x - screenSample.x, screenPoint.y - screenSample.y) < requiredDistance;
        });

        if (tooClose) {
          return false;
        }
      }
    }

    return true;
  }

  addMany(points: Vec2[]): void {
    points.forEach((point) => {
      const screenPoint = worldToScreen(point);
      const cell = this.cellFor(screenPoint);
      const key = this.key(cell.x, cell.y);
      const samples = this.cells.get(key);

      if (samples) {
        samples.push(point);
      } else {
        this.cells.set(key, [point]);
      }
    });
  }

  private cellFor(point: Vec2): Vec2 {
    return {
      x: Math.floor(point.x / this.cellSize),
      y: Math.floor(point.y / this.cellSize),
    };
  }

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }
}

function samplePolyline(line: Vec2[]): Vec2[] {
  return line.filter((_, index) => index % STREAMLINE_SAMPLE_STRIDE === 0);
}

function drawPolyline(line: Vec2[]): void {
  context.beginPath();

  line.forEach((point, index) => {
    const screen = worldToScreen(point);

    if (index === 0) {
      context.moveTo(screen.x, screen.y);
    } else {
      context.lineTo(screen.x, screen.y);
    }
  });

  context.stroke();
}

function drawAcceptedSamples(samples: Vec2[]): void {
  context.fillStyle = colors.marker;

  samples.forEach((sample) => {
    const point = worldToScreen(sample);
    context.beginPath();
    context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
    context.fill();
  });
}

function isOutOfDomain(point: Vec2): boolean {
  return (
    point.x < -WORLD_HALF_WIDTH ||
    point.x > WORLD_HALF_WIDTH ||
    point.y < -WORLD_HALF_HEIGHT ||
    point.y > WORLD_HALF_HEIGHT
  );
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
    context.fillStyle = primitiveColor(flow);
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

function primitiveColor(flow: Flow): string {
  if (flow.kind === "uniform") {
    return colors.marker;
  }

  return primitiveColors[flow.kind];
}

function updateHoveredFlow(flow: Flow | null): void {
  if (dragState) {
    clearHoverTooltip();
    return;
  }

  if (!flow) {
    clearHoverTooltip();
    return;
  }

  if (hoveredFlowId === flow.id) {
    return;
  }

  clearHoverTooltip();
  hoveredFlowId = flow.id;
  hoverTimer = window.setTimeout(() => {
    if (dragState || hoveredFlowId !== flow.id) {
      return;
    }

    showPrimitiveTooltip(flow);
  }, HOVER_REVEAL_DELAY_MS);
}

function clearHoverTooltip(): void {
  hoveredFlowId = null;

  if (hoverTimer !== null) {
    window.clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  primitiveTooltip.hidden = true;
  primitiveTooltip.innerHTML = "";
}

function showPrimitiveTooltip(flow: Flow): void {
  const type = flowLabel(flow.kind);

  primitiveTooltip.style.setProperty("--tooltip-flow-color", primitiveColor(flow));
  primitiveTooltip.innerHTML = `
    <div class="primitive-tooltip-title">${flow.name}</div>
    <div class="primitive-tooltip-type">${type}</div>
    <code>${streamFunctionLabel(flow.kind)}</code>
  `;
  primitiveTooltip.hidden = false;
  positionPrimitiveTooltip(flow);
}

function positionPrimitiveTooltip(flow: Flow): void {
  const layout = requiredElement<HTMLDivElement>(".boundary-layout");
  const layoutRect = layout.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const point = worldToScreen({ x: flow.x, y: flow.y });
  const tooltipWidth = 260;
  const tooltipHeight = 112;
  const left = clamp(canvasRect.left - layoutRect.left + point.x + 16, 10, layoutRect.width - tooltipWidth - 10);
  const top = clamp(canvasRect.top - layoutRect.top + point.y - 18, 10, layoutRect.height - tooltipHeight - 10);

  primitiveTooltip.style.left = `${left}px`;
  primitiveTooltip.style.top = `${top}px`;
}

function streamFunctionLabel(kind: FlowKind): string {
  switch (kind) {
    case "uniform":
      return "psi = U(y cos alpha - x sin alpha)";
    case "source":
      return "psi = (Q / 2pi) theta";
    case "sink":
      return "psi = -(Q / 2pi) theta";
    case "doublet":
      return "psi = -(mu / 2pi r) sin(theta - alpha)";
    case "vortex":
      return "psi = -(Gamma / 2pi) ln r";
  }
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
