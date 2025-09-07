import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import LoadingVideo from "@/components/loading-video";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Jobs from "@/pages/jobs";
import Feedbacks from "@/pages/feedbacks";
import Forms from "@/pages/forms";
import Resources from "@/pages/resources";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <Route path="*">
          <LoadingVideo fullScreen={true} width={150} height={150} />
        </Route>
      ) : !user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/feedbacks" component={Feedbacks} />
          <Route path="/forms" component={Forms} />
          <Route path="/resources" component={Resources} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/feedbacks" component={Feedbacks} />
          <Route path="/forms" component={Forms} />
          <Route path="/resources" component={Resources} />
          {user.role === 'admin' || user.role === 'editor' ? (
            <Route path="/admin" component={Admin} />
          ) : null}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // Enable auto-refresh when JSON files change
  useAutoRefresh();

  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
