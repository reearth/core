import { useCallback } from "react";

export default ({
  onMount,
  mountCamera,
  unmountCamera,
}: {
  onMount?: () => void;
  mountCamera?: () => void;
  unmountCamera?: () => void;
}) => {
  const handleMount = useCallback(() => {
    mountCamera?.();
    onMount?.();
  }, [mountCamera, onMount]);

  const handleUnmount = useCallback(() => {
    unmountCamera?.();
  }, [unmountCamera]);

  return {
    handleMount,
    handleUnmount,
  };
};
