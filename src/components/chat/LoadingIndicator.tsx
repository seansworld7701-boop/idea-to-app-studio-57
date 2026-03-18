import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface LoadingIndicatorProps {
  text?: string;
}

const LoadingIndicator = ({ text }: LoadingIndicatorProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-4">
    <img src={logo} alt="" className="w-7 h-7 animate-pulse brightness-200 contrast-200" />
    <span className="text-sm text-muted-foreground">{text || "Thinking..."}</span>
  </motion.div>
);

export default LoadingIndicator;
