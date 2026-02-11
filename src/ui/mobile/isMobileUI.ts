export function isMobileUI(): boolean {
  if (typeof window === "undefined") return false;

  const forceMobile = new URLSearchParams(window.location.search).get("ui") === "mobile";
  if (forceMobile) return true;

  return window.matchMedia("(max-width: 520px)").matches;
}

