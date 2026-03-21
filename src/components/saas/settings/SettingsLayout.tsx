import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsTab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
  badge?: string;
  description?: string;
}

interface SettingsLayoutProps {
  title?: string;
  subtitle?: string;
  tabs: SettingsTab[];
  defaultTab?: string;
  variant?: "sidebar" | "tabs" | "stacked";
}

export function SettingsLayout({
  title = "Configurações",
  subtitle = "Gerencie as configurações da sua conta",
  tabs,
  defaultTab,
  variant = "sidebar",
}: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeContent = tabs.find(t => t.id === activeTab);

  if (variant === "stacked") {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-display">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold">{tab.label}</h2>
                  {tab.description && <p className="text-xs text-muted-foreground">{tab.description}</p>}
                </div>
              </div>
              <div className="p-6">{tab.content}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "tabs") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeContent?.content}
        </motion.div>
      </div>
    );
  }

  // Sidebar variant (default)
  return (
    <div className="flex gap-8">
      <aside className="w-64 shrink-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      <main className="flex-1 min-w-0">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeContent && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50">
                <h2 className="text-lg font-semibold font-display">{activeContent.label}</h2>
                {activeContent.description && (
                  <p className="text-sm text-muted-foreground mt-1">{activeContent.description}</p>
                )}
              </div>
              <div className="p-6">{activeContent.content}</div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
