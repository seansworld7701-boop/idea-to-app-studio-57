import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
      <h1 className="text-5xl font-bold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">This page doesn't exist</p>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background active:scale-95 transition-transform"
      >
        <ArrowLeft size={14} />
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
