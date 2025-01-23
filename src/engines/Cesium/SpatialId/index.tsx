import { ClassificationType, Color, HeightReference, Rectangle } from "cesium";
import { FC, memo, useMemo } from "react";
import { Entity } from "resium";

import { SpatialIdSpaceType } from "../../../Map/SpatialId/types";

const DEFAULT_COLOR = "#00bebe";

type SpatialIdComponentProps = {
  space: SpatialIdSpaceType;
};

const SpatialIdSpace: FC<SpatialIdComponentProps> = memo(({ space }) => {
  const options = useMemo(
    () => ({
      rectangle: {
        coordinates: Rectangle.fromDegrees(...space.wsen),
        height: space.type === "coordinate" ? undefined : space.height,
        heightReference: space.type === "coordinate" ? undefined : HeightReference.NONE,
        extrudedHeight: space.type === "coordinate" ? undefined : space.extrudedHeight,
        clampToGround: space.type === "coordinate",
        fill: true,
        outline: space.type !== "coordinate",
        outlineColor: Color.fromCssColorString(space.color ?? DEFAULT_COLOR).withAlpha(
          space.type === "floor" ? 0.5 : 1,
        ),
        material: Color.fromCssColorString(space.color ?? DEFAULT_COLOR).withAlpha(
          space.type === "floor" ? 0.05 : 0.2,
        ),
        classificationType:
          space.type === "coordinate" ? ClassificationType.BOTH : ClassificationType.TERRAIN,
      },
    }),
    [space],
  );

  return <Entity id={space.id} {...options} />;
});

SpatialIdSpace.displayName = "SpatialIdSpace";

export default SpatialIdSpace;
