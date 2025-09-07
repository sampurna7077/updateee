import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Hide initial loading screen once React has mounted
setTimeout(() => {
  const loadingEl = document.getElementById('initial-loading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    loadingEl.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      loadingEl.remove();
    }, 300);
  }
}, 100);
