export type Vec2 = {
  x: number;
  y: number;
};

export type FlowKind = "uniform" | "source" | "sink" | "doublet" | "vortex";

export type Flow = {
  id: string;
  kind: FlowKind;
  name: string;
  x: number;
  y: number;
  strength: number;
  angle: number;
  enabled: boolean;
};

const TAU = Math.PI * 2;
const CORE_RADIUS_SQUARED = 0.025;

export function velocityAtPoint(point: Vec2, flows: Flow[]): Vec2 {
  return flows.reduce<Vec2>(
    (velocity, flow) => {
      if (!flow.enabled) {
        return velocity;
      }

      const contribution = velocityFromFlow(point, flow);
      velocity.x += contribution.x;
      velocity.y += contribution.y;
      return velocity;
    },
    { x: 0, y: 0 },
  );
}

export function streamFunctionAtPoint(point: Vec2, flows: Flow[]): number {
  return flows.reduce((psi, flow) => {
    if (!flow.enabled) {
      return psi;
    }

    return psi + streamFunctionFromFlow(point, flow);
  }, 0);
}

export function velocityFromFlow(point: Vec2, flow: Flow): Vec2 {
  if (flow.kind === "uniform") {
    return {
      x: flow.strength * Math.cos(flow.angle),
      y: flow.strength * Math.sin(flow.angle),
    };
  }

  const dx = point.x - flow.x;
  const dy = point.y - flow.y;
  const r2 = Math.max(dx * dx + dy * dy, CORE_RADIUS_SQUARED);

  if (flow.kind === "source" || flow.kind === "sink") {
    const sign = flow.kind === "source" ? 1 : -1;
    const scale = (sign * flow.strength) / (TAU * r2);
    return {
      x: scale * dx,
      y: scale * dy,
    };
  }

  if (flow.kind === "vortex") {
    const scale = flow.strength / (TAU * r2);
    return {
      x: -scale * dy,
      y: scale * dx,
    };
  }

  const axisX = Math.cos(flow.angle);
  const axisY = Math.sin(flow.angle);
  const dot = axisX * dx + axisY * dy;
  const scale = -flow.strength / (TAU * r2 * r2);

  return {
    x: scale * (axisX * r2 - 2 * dx * dot),
    y: scale * (axisY * r2 - 2 * dy * dot),
  };
}

export function streamFunctionFromFlow(point: Vec2, flow: Flow): number {
  if (flow.kind === "uniform") {
    return flow.strength * (point.y * Math.cos(flow.angle) - point.x * Math.sin(flow.angle));
  }

  const dx = point.x - flow.x;
  const dy = point.y - flow.y;
  const radius = Math.max(Math.hypot(dx, dy), Math.sqrt(CORE_RADIUS_SQUARED));
  const theta = Math.atan2(dy, dx);

  if (flow.kind === "source" || flow.kind === "sink") {
    const sign = flow.kind === "source" ? 1 : -1;
    return (sign * flow.strength * theta) / TAU;
  }

  if (flow.kind === "vortex") {
    return -(flow.strength * Math.log(radius)) / TAU;
  }

  return -((flow.strength * Math.sin(theta - flow.angle)) / (TAU * radius));
}

export function magnitude(vector: Vec2): number {
  return Math.hypot(vector.x, vector.y);
}

export function flowLabel(kind: FlowKind): string {
  switch (kind) {
    case "uniform":
      return "Uniform";
    case "source":
      return "Source";
    case "sink":
      return "Sink";
    case "doublet":
      return "Doublet";
    case "vortex":
      return "Vortex";
  }
}
