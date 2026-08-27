// Fluxo Pessoal — direção editorial fintech escura: navegação persistente, contraste elevado e estados por cor.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" position="bottom-right" />
          <Home />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
