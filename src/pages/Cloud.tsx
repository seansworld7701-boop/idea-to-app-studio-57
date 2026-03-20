import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, MessageSquare, Database, HardDrive, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CloudChat from "@/components/cloud/CloudChat";
import CloudData from "@/components/cloud/CloudData";
import CloudFiles from "@/components/cloud/CloudFiles";
import CloudApiKeys from "@/components/cloud/CloudApiKeys";
import logo from "@/assets/logo.png";

const CloudPage = () => {
  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary border border-border">
            <Cloud size={20} className="text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Dust Cloud</h1>
            <p className="text-xs text-muted-foreground">Your personal cloud platform</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="px-5">
          <TabsList className="w-full bg-secondary/50 border border-border">
            <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs">
              <MessageSquare size={14} />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-1 gap-1.5 text-xs">
              <Database size={14} />
              Data
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-1 gap-1.5 text-xs">
              <HardDrive size={14} />
              Files
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex-1 gap-1.5 text-xs">
              <Key size={14} />
              API Keys
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 mt-0">
          <CloudChat />
        </TabsContent>
        <TabsContent value="data" className="flex-1 mt-0 px-5">
          <CloudData />
        </TabsContent>
        <TabsContent value="files" className="flex-1 mt-0 px-5">
          <CloudFiles />
        </TabsContent>
        <TabsContent value="keys" className="flex-1 mt-0 px-5">
          <CloudApiKeys />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CloudPage;
