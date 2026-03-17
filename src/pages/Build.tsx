import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import PreviewMode from "@/components/PreviewMode";

export interface PreviewData {
  title: string;
  html: string;
}

const BuildPage = () => {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  if (preview) {
    return <PreviewMode data={preview} onBack={() => setPreview(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface onOpenPreview={setPreview} />
    </div>
  );
};

export default BuildPage;
