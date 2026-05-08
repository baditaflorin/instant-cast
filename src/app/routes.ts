export type AppRoute =
  | { kind: "studio" }
  | {
      kind: "watch";
      token: string;
      passphrase: string | null;
      apiBaseUrl: string | null;
    };

export function getRoute(): AppRoute {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  const relativePath = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, "");

  if (relativePath.startsWith("watch/")) {
    const token = decodeURIComponent(relativePath.slice("watch/".length));
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return {
      kind: "watch",
      token,
      passphrase: params.get("key"),
      apiBaseUrl: params.get("api"),
    };
  }

  const redirect = sessionStorage.getItem("instant-cast:redirect");
  if (redirect) {
    sessionStorage.removeItem("instant-cast:redirect");
    window.history.replaceState(null, "", redirect);
    return getRoute();
  }

  return { kind: "studio" };
}
