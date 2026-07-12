import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { CookieConsentProvider } from "@/components/cookie-consent";
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy-load all pages for code splitting — reduces initial bundle size
const Home = lazy(() => import("@/pages/home"));
const HistoryPage = lazy(() => import("@/pages/history"));
const FormatsPage = lazy(() => import("@/pages/formats"));
const FAQPage = lazy(() => import("@/pages/faq"));
const AboutPage = lazy(() => import("@/pages/about"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const AlternativesPage = lazy(() => import("@/pages/alternatives"));
const CookiePolicyPage = lazy(() => import("@/pages/cookie-policy"));
const DMCAPage = lazy(() => import("@/pages/dmca"));
const CopyrightPage = lazy(() => import("@/pages/copyright"));
const DisclaimerPage = lazy(() => import("@/pages/disclaimer"));
const ContactPage = lazy(() => import("@/pages/contact"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/formats" component={FormatsPage} />
          <Route path="/faq" component={FAQPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/alternatives" component={AlternativesPage} />
          <Route path="/cookies" component={CookiePolicyPage} />
          <Route path="/dmca" component={DMCAPage} />
          <Route path="/copyright" component={CopyrightPage} />
          <Route path="/disclaimer" component={DisclaimerPage} />
          <Route path="/contact" component={ContactPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {/* CookieConsentProvider must wrap Router so all pages and the
              Layout footer can access openSettings via useCookieConsentActions */}
          <CookieConsentProvider>
            <Router />
          </CookieConsentProvider>
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
