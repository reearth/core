import type { FallbackProps } from "react-error-boundary";

export default function Error({ error, resetErrorBoundary }: FallbackProps) {
  const err = error as Error;
  const errorMessage = err?.message ?? String(error);

  return (
    <div>
      <h1>Oops! An Error Occurred</h1>
      <p>{errorMessage}</p>
      <p>
        <button style={{ color: "#fff" }} onClick={resetErrorBoundary}>
          Retry
        </button>
      </p>
    </div>
  );
}
