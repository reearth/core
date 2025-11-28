import { FC, PropsWithChildren, RefObject, createContext, useContext, useMemo } from "react";

import { MapRef } from "../Map";

const context = createContext<RefObject<MapRef | null> | undefined>(undefined);

export type Context = RefObject<MapRef | null>;

export const useVisualizer = (): RefObject<MapRef | null> => {
  const value = useContext(context);
  if (!value) {
    throw new Error("Visualizer is not declared. You have to use this hook inside of Visualizer");
  }
  return value;
};

const filterMapRefToContext = (mapRef: RefObject<MapRef | null>): Context => {
  return mapRef as Context;
};

export const VisualizerProvider: FC<PropsWithChildren<{ mapRef: RefObject<MapRef | null> }>> = ({
  mapRef,
  children,
}) => {
  const value = useMemo(() => filterMapRefToContext(mapRef), [mapRef]);
  return <context.Provider value={value}>{children}</context.Provider>;
};
