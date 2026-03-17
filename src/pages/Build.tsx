import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import PreviewMode from "@/components/PreviewMode";

export interface PreviewData {
  title: string;
  html: string;
}

const BuildPage = () => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || undefined;

  if (preview) {
    return <PreviewMode data={preview} onBack={() => setPreview(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface onOpenPreview={setPreview} initialPrompt={initialPrompt} />
    </div>
  );
};

export default BuildPage;
