import { useEffect, useMemo } from "react";

import { version } from "../../package.json";

interface CoreAPI {
  readonly version: string;
}

export default () => {
  const coreAPI: CoreAPI = useMemo(
    () => ({
      get version() {
        return version;
      },
    }),
    [],
  );

  useEffect(() => {
    (window as any).reearth_core = coreAPI;
  }, [coreAPI]);
};
