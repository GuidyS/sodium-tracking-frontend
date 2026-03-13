import AppHeader from "./AppHeader";
import TopNav from "./TopNav";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 pt-6 pb-6">
        <AppHeader />
        <TopNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;