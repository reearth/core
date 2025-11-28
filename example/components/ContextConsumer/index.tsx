import { Cross2Icon } from "@radix-ui/react-icons";
import { useContext, useState } from "react";

import { coreContext } from "@reearth/core";

import { OptionSection } from "../OptionsPanel/common";
import { Button } from "../ui/button";

export const ContextConsumer = () => {
  const { selectedLayer, selectedComputedFeature } = useContext(coreContext);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="absolute z-10 left-2 bottom-10" onClick={() => setOpen(true)}>
        Core Context
      </Button>
      <div
        className={`absolute bottom-0 left-0 z-20 p-2 transition-all w-96 ${
          open ? "" : "-translate-x-full"
        }`}>
        <div className="flex flex-col gap-6 p-4 bg-white rounded-md shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Core Context</h3>
            <Button size="sm" variant="ghost" className="p-2" onClick={() => setOpen(false)}>
              <Cross2Icon className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-4 max-h-[40vh] overflow-auto">
            <OptionSection title="SelectedLayer">
              <span className="text-sm break-all">
                {selectedLayer ? JSON.stringify(selectedLayer) : "undefined"}
              </span>
            </OptionSection>

            <OptionSection title="SelectedComputedFeature">
              <span className="text-sm break-all">
                {selectedComputedFeature ? JSON.stringify(selectedComputedFeature) : "undefined"}
              </span>
            </OptionSection>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContextConsumer;
