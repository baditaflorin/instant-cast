import { useMemo } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SharedPlayback } from "../features/playback/SharedPlayback";
import { Studio } from "../features/recorder/Studio";
import { getRoute } from "./routes";

export function App() {
  const route = useMemo(() => getRoute(), []);

  return (
    <ErrorBoundary>
      {route.kind === "watch" ? (
        <SharedPlayback
          token={route.token}
          passphrase={route.passphrase}
          apiBaseUrl={route.apiBaseUrl}
        />
      ) : (
        <Studio />
      )}
    </ErrorBoundary>
  );
}
