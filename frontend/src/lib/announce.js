// Writes to the shared `aria-live="polite"` region in AppShell so screen-reader users get
// the same feedback sighted users get from react-hot-toast (Constitution Principle II —
// toast is supplementary, never the sole channel for success/error feedback).
export function announce(message) {
  const region = document.getElementById("app-live-region");
  if (region) {
    region.textContent = message;
  }
}
