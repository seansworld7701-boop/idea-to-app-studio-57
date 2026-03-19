import { Construction } from "lucide-react";

const MaintenanceMode = () => (
  <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-6">
    <div className="text-center max-w-md space-y-6">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Construction size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Under Maintenance</h1>
      <p className="text-muted-foreground leading-relaxed">
        Dust AI is currently undergoing scheduled maintenance. We're working hard to bring you an even better experience. Please check back soon!
      </p>
      <div className="flex items-center justify-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
      </div>
      <p className="text-xs text-muted-foreground/60">We'll be back shortly</p>
    </div>
  </div>
);

export default MaintenanceMode;
