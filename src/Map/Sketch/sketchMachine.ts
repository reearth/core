// TODO: Refactor: move cesium related code to engine.
import invariant from "tiny-invariant";
import { createMachine, assign, type StateFrom } from "xstate";

import { type SketchType } from "./types";

export type Position2d = [number, number];
export type Position3d = [number, number, number];

export type EventObject =
  | ((
      | { type: "MARKER" }
      | { type: "POLYLINE" }
      | { type: "CIRCLE" }
      | { type: "RECTANGLE" }
      | { type: "POLYGON" }
      | { type: "EXTRUDED_CIRCLE" }
      | { type: "EXTRUDED_RECTANGLE" }
      | { type: "EXTRUDED_POLYGON" }
      | { type: "NEXT" }
      | { type: "EXTRUDE" }
    ) & {
      pointerPosition: Position2d;
      controlPoint: Position3d;
    })
  | ((
      | { type: "EDIT_MARKER" }
      | { type: "EDIT_POLYLINE" }
      | { type: "EDIT_CIRCLE" }
      | { type: "EDIT_RECTANGLE" }
      | { type: "EDIT_POLYGON" }
      | { type: "EDIT_EXTRUDED_CIRCLE" }
      | { type: "EDIT_EXTRUDED_RECTANGLE" }
      | { type: "EDIT_EXTRUDED_POLYGON" }
      | { type: "CATCH" }
      | { type: "UPDATE" }
      | { type: "MOVE" }
      | { type: "RELEASE" }
    ) & {
      extrudedHeight?: number;
      controlPoints: Position3d[];
      catchedControlPointIndex?: number;
      catchedExtrudedPoint?: boolean;
    })
  | { type: "CREATE" }
  | { type: "CANCEL" }
  | { type: "ABORT" }
  | { type: "EXIT_EDIT" };

export interface Context {
  lastPointerPosition?: Position2d;
  lastControlPoint?: Position3d;
  type?: SketchType;
  controlPoints?: Position3d[];
  catchedControlPointIndex?: number;
  catchedExtrudedPoint?: boolean;
  originalControlPoint?: Position3d;
}

export function createSketchMachine() {
  return createMachine({
    id: "sketch",
    initial: "idle",
    context: {} as Context,
    states: {
      idle: {
        on: {
          MARKER: {
            target: "drawing.marker",
            actions: ["createMarker"],
          },
          POLYLINE: {
            target: "drawing.polyline",
            actions: ["createPolyline"],
          },
          CIRCLE: {
            target: "drawing.circle",
            actions: ["createCircle"],
          },
          RECTANGLE: {
            target: "drawing.rectangle",
            actions: ["createRectangle"],
          },
          POLYGON: {
            target: "drawing.polygon",
            actions: ["createPolygon"],
          },
          EXTRUDED_CIRCLE: {
            target: "drawing.circle",
            actions: ["createExtrudedCircle"],
          },
          EXTRUDED_RECTANGLE: {
            target: "drawing.extrudedRectangle",
            actions: ["createExtrudedRectangle"],
          },
          EXTRUDED_POLYGON: {
            target: "drawing.extrudedPolygon",
            actions: ["createExtrudedPolygon"],
          },
          EDIT_MARKER: {
            target: "editing.marker",
            actions: ["editMarker"],
          },
          EDIT_POLYLINE: {
            target: "editing.polyline",
            actions: ["editPolyline"],
          },
          EDIT_CIRCLE: {
            target: "editing.circle",
            actions: ["editCircle"],
          },
          EDIT_RECTANGLE: {
            target: "editing.rectangle",
            actions: ["editRectangle"],
          },
          EDIT_POLYGON: {
            target: "editing.polygon",
            actions: ["editPolygon"],
          },
          EDIT_EXTRUDED_CIRCLE: {
            target: "editing.circle",
            actions: ["editExtrudedCircle"],
          },
          EDIT_EXTRUDED_RECTANGLE: {
            target: "editing.extrudedRectangle",
            actions: ["editExtrudedRectangle"],
          },
          EDIT_EXTRUDED_POLYGON: {
            target: "editing.extrudedPolygon",
            actions: ["editExtrudedPolygon"],
          },
        },
      },
      drawing: {
        initial: "marker",
        states: {
          marker: {
            initial: "vertex",
            states: {
              vertex: {},
            },
          },
          polyline: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: {
                    target: "vertex",
                    reenter: false,
                    actions: ["pushPosition"],
                  },
                },
              },
            },
          },
          circle: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: {
                    target: "#sketch.extruding",
                    actions: ["pushPosition"],
                  },
                },
              },
            },
          },
          rectangle: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: [
                    {
                      target: "vertex",
                      reenter: false,
                      actions: ["pushPosition"],
                    },
                  ],
                },
              },
            },
          },
          extrudedRectangle: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: [
                    {
                      target: "#sketch.extruding",
                      guard: "willRectangleComplete",
                      actions: ["pushPosition", "recordOriginalControlPoint"],
                    },
                    {
                      target: "vertex",
                      reenter: false,
                      actions: ["pushPosition"],
                    },
                  ],
                },
              },
            },
          },
          polygon: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: {
                    target: "vertex",
                    reenter: false,
                    actions: ["pushPosition"],
                  },
                },
              },
            },
          },
          extrudedPolygon: {
            initial: "vertex",
            states: {
              vertex: {
                on: {
                  NEXT: {
                    target: "vertex",
                    reenter: false,
                    actions: ["pushPosition"],
                  },
                  EXTRUDE: {
                    target: "#sketch.extruding",
                    actions: ["pushPosition"],
                  },
                },
              },
            },
          },
          history: {
            type: "history",
          },
        },
        on: {
          CANCEL: [
            {
              target: ".history",
              guard: "canPopPosition",
              actions: ["popPosition"],
            },
            {
              target: "idle",
              actions: ["clearDrawing"],
            },
          ],
          ABORT: {
            target: "idle",
            actions: ["clearDrawing"],
          },
          CREATE: {
            target: "idle",
            actions: ["clearDrawing"],
          },
        },
      },
      extruding: {
        on: {
          CREATE: {
            target: "idle",
            actions: ["clearDrawing"],
          },
          CANCEL: {
            target: "drawing.history",
            actions: ["popPosition"],
          },
          ABORT: {
            target: "idle",
            actions: ["clearDrawing"],
          },
        },
      },
      editing: {
        initial: "marker",
        states: {
          marker: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          polyline: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                  UPDATE: {
                    target: "waiting",
                    reenter: false,
                    actions: ["updateControlPoints"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          circle: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          rectangle: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          polygon: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                  UPDATE: {
                    target: "waiting",
                    reenter: false,
                    actions: ["updateControlPoints"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          extrudedCircle: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          extrudedRectangle: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
          extrudedPolygon: {
            initial: "waiting",
            states: {
              waiting: {
                on: {
                  CATCH: {
                    target: "moving",
                    reenter: false,
                    actions: ["catchControlPoint"],
                  },
                  UPDATE: {
                    target: "waiting",
                    reenter: false,
                    actions: ["updateControlPoints"],
                  },
                },
              },
              moving: {
                on: {
                  MOVE: {
                    target: "moving",
                    reenter: false,
                    actions: ["moveControlPoint"],
                  },
                  RELEASE: {
                    target: "waiting",
                    actions: ["releaseControlPoint"],
                  },
                },
              },
            },
          },
        },
        on: {
          EXIT_EDIT: {
            target: "idle",
            actions: ["clearDrawing"],
          },
        },
      },
    },
  }).provide({
    guards: {
      canPopPosition: ({ context }) =>
        context.controlPoints != null && context.controlPoints.length > 1,
      willRectangleComplete: ({ context }) =>
        context.controlPoints != null && context.controlPoints.length === 2,
    },
    actions: {
      createMarker: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "MARKER" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "marker" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editMarker: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_MARKER" }>;
        return {
          lastControlPoint: undefined,
          type: "marker" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createPolyline: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "POLYLINE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "polyline" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editPolyline: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_POLYLINE" }>;
        return {
          lastControlPoint: undefined,
          type: "polyline" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createCircle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "CIRCLE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "circle" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editCircle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_CIRCLE" }>;
        return {
          lastControlPoint: undefined,
          type: "circle" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createRectangle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "RECTANGLE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "rectangle" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editRectangle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_RECTANGLE" }>;
        return {
          lastControlPoint: undefined,
          type: "rectangle" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createPolygon: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "POLYGON" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "polygon" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editPolygon: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_POLYGON" }>;
        return {
          lastControlPoint: undefined,
          type: "polygon" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createExtrudedCircle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EXTRUDED_CIRCLE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "extrudedCircle" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editExtrudedCircle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_EXTRUDED_CIRCLE" }>;
        return {
          lastControlPoint: undefined,
          type: "extrudedCircle" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createExtrudedRectangle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EXTRUDED_RECTANGLE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "extrudedRectangle" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editExtrudedRectangle: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_EXTRUDED_RECTANGLE" }>;
        return {
          lastControlPoint: undefined,
          type: "extrudedRectangle" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      createExtrudedPolygon: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EXTRUDED_POLYGON" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          type: "extrudedPolygon" as SketchType,
          controlPoints: [controlPoint],
        };
      }),
      editExtrudedPolygon: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "EDIT_EXTRUDED_POLYGON" }>;
        return {
          lastControlPoint: undefined,
          type: "extrudedPolygon" as SketchType,
          controlPoints: e.controlPoints,
        };
      }),
      pushPosition: assign(({ context, event }) => {
        const e = event as Extract<EventObject, { type: "NEXT" | "EXTRUDE" }>;
        const controlPoint = [...e.controlPoint] as Position3d;
        return {
          lastPointerPosition: [...e.pointerPosition] as Position2d,
          lastControlPoint: controlPoint,
          controlPoints: [...(context.controlPoints ?? []), controlPoint],
        };
      }),
      popPosition: assign(({ context }) => {
        invariant(context.controlPoints != null);
        invariant(context.controlPoints.length > 1);
        return { controlPoints: context.controlPoints.slice(0, -1) };
      }),
      clearDrawing: assign(() => ({
        lastControlPoint: undefined,
        type: undefined,
        controlPoints: undefined,
        catchedControlPointIndex: undefined,
        catchedExtrudedPoint: undefined,
        originalControlPoint: undefined,
      })),
      catchControlPoint: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "CATCH" }>;
        return {
          catchedControlPointIndex: e.catchedControlPointIndex,
          catchedExtrudedPoint: e.catchedExtrudedPoint,
        };
      }),
      moveControlPoint: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "MOVE" }>;
        return { controlPoints: e.controlPoints };
      }),
      releaseControlPoint: assign(() => ({
        catchedControlPointIndex: undefined,
        catchedExtrudedPoint: undefined,
      })),
      updateControlPoints: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "UPDATE" }>;
        return { controlPoints: e.controlPoints };
      }),
      recordOriginalControlPoint: assign(({ event }) => {
        const e = event as Extract<EventObject, { type: "NEXT" }>;
        return { originalControlPoint: [...e.controlPoint] as Position3d };
      }),
    },
  });
}

export type SketchMachine = ReturnType<typeof createSketchMachine>;
export type SketchMachineState = StateFrom<SketchMachine>;
