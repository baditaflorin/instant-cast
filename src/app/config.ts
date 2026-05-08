export const appConfig = {
  name: "Instant Cast",
  version: __APP_VERSION__,
  commit: __COMMIT_SHA__,
  repoUrl: "https://github.com/baditaflorin/instant-cast",
  paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
  defaultApiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  pagesUrl: "https://baditaflorin.github.io/instant-cast/",
};
