import { motion } from "framer-motion";
import { FolderOpen, Clock } from "lucide-react";

const ProjectsPage = () => {
  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="text-xs text-muted-foreground mt-1">Your generated projects</p>
      </div>

      {/* Empty state */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center flex-1 gap-3 py-16"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 border border-border">
          <FolderOpen size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No projects yet</p>
        <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">
          Start building to see your projects here
        </p>
      </motion.div>
    </div>
  );
};

export default ProjectsPage;
