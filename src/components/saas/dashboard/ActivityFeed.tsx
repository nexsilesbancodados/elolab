import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon } from "lucide-react";

interface Activity {
  id: string;
  user: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: string;
  icon?: LucideIcon;
  type?: "default" | "success" | "warning" | "destructive" | "info";
}

interface ActivityFeedProps {
  title?: string;
  activities: Activity[];
  maxHeight?: number;
  variant?: "default" | "compact" | "timeline";
  showAvatar?: boolean;
}

const typeColors = {
  default: "bg-muted",
  success: "bg-success/20",
  warning: "bg-warning/20",
  destructive: "bg-destructive/20",
  info: "bg-info/20",
};

const typeDot = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

export function ActivityFeed({
  title = "Atividade recente",
  activities,
  maxHeight = 400,
  variant = "default",
  showAvatar = true,
}: ActivityFeedProps) {
  const isTimeline = variant === "timeline";

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className={`p-4 ${isTimeline ? "relative" : ""}`}>
          {isTimeline && (
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-border" />
          )}

          {activities.map((activity, i) => {
            const Icon = activity.icon;
            const type = activity.type || "default";

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-3 ${
                  variant === "compact" ? "py-2" : "py-3"
                } ${i < activities.length - 1 && !isTimeline ? "border-b border-border/50" : ""}`}
              >
                {isTimeline ? (
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${typeColors[type]}`}>
                    {Icon ? (
                      <Icon className="w-3 h-3" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${typeDot[type]}`} />
                    )}
                  </div>
                ) : showAvatar ? (
                  <Avatar className="w-8 h-8 shrink-0">
                    {activity.user.avatar && <AvatarImage src={activity.user.avatar} />}
                    <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                      {activity.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    <span className="text-muted-foreground"> {activity.action}</span>
                    {activity.target && (
                      <span className="font-medium"> {activity.target}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
