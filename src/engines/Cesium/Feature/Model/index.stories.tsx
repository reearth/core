import { Meta, StoryFn } from "@storybook/react";

import { engine } from "../..";
import { Map, Props } from "../../../../Map";

export default {
  component: Map,
} as Meta;

const Template: StoryFn<Props> = args => <Map {...args} />;

export const Default = Template.bind([]);
Default.args = {
  engine: "cesium",
  engines: {
    cesium: engine,
  },
  ready: true,
  layers: [
    {
      id: "l",
      type: "simple",
      data: {
        type: "geojson",
        value: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [0, 0, 1000],
          },
        },
      },
      model: {
        url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
        scale: 1000000,
      },
    },
  ],
  property: {
    tiles: [
      {
        id: "default",
        type: "default",
      },
    ],
  },
};
