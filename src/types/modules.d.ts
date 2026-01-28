// Type declarations for modules without built-in types

declare module "protomaps" {
  export interface Zxy {
    z: number;
    x: number;
    y: number;
  }

  export interface Feature {
    readonly geomType: number;
    readonly geometry: number[][];
    readonly geom: Array<Array<{ x: number; y: number }>>;
    readonly id?: number | string;
    readonly props: Record<string, any>;
  }

  export class TileCache {
    constructor(cacheFunction?: any, maxCacheEntries?: number);
    get(coords: Zxy): Promise<any>;
    readonly tileSize: number;
  }

  export class ZxySource {
    constructor(url: string, cache?: boolean);
  }
}

declare module "@reearth/cesium-mvt-imagery-provider" {
  import { ImageryProvider } from "cesium";

  export class MVTImageryProvider implements ImageryProvider {
    constructor(options: any);
    readonly ready: boolean;
    readonly rectangle: any;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly maximumLevel: number;
    readonly minimumLevel: number;
    readonly tilingScheme: any;
    readonly tileDiscardPolicy: any;
    readonly errorEvent: any;
    readonly credit: any;
    readonly proxy: any;
    readonly hasAlphaChannel: boolean;
    getTileCredits(x: number, y: number, level: number): any[];
    requestImage(x: number, y: number, level: number, request?: any): Promise<any> | undefined;
    pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<any[]> | undefined;
  }
}

declare module "cesium-dnd" {
  import { Viewer } from "cesium";

  export interface CesiumDnDOptions {
    onDrag?: (e: any, position: any, context: Context) => boolean | void;
    onDrop?: (e: any, position: any) => boolean | void;
    onDropError?: (error: Error) => void;
    dragDelay?: number;
    initialDisabled?: boolean;
  }

  export class Context {
    constructor(viewer: Viewer, options?: CesiumDnDOptions);
    disable(): void;
    enable(): void;
    destroy(): void;
  }

  const CesiumDnD: typeof Context;
  export default CesiumDnD;
  export type { Context };
}

declare module "@turf/ellipse" {
  import { Feature, Polygon, Point, Units } from "@turf/helpers";

  export default function ellipse(
    center: Point | number[],
    xSemiAxis: number,
    ySemiAxis: number,
    options?: {
      angle?: number;
      pivot?: Point | number[];
      steps?: number;
      units?: Units;
      properties?: Record<string, any>;
    },
  ): Feature<Polygon>;
}
