import { useEffect, useState } from "react";

const navigationEvent = "bolsa:navigation";
const currentRoute = () => ({ pathname: window.location.pathname, search: window.location.search });

export function navigate(url: string, options: { replace?: boolean } = {}) {
  const target = new URL(url, window.location.origin);
  if (target.origin !== window.location.origin) return;
  const changedPage = target.pathname !== window.location.pathname;
  window.history[options.replace ? "replaceState" : "pushState"](null, "", target.pathname + target.search + target.hash);
  window.dispatchEvent(new Event(navigationEvent));
  if (changedPage) window.scrollTo({ top: 0 });
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
    window.addEventListener("popstate", update);
    window.addEventListener(navigationEvent, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(navigationEvent, update);
    };
  }, []);
  return route;
}
