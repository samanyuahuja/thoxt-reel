import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ReelsCreator from "@/pages/reels-creator";
import SavedReels from "@/pages/saved-reels";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ReelsCreator} />
      <Route path="/reels" component={ReelsCreator} />
      <Route path="/saved-reels" component={SavedReels} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
