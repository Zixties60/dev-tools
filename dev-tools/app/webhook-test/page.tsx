"use client";

import MainLayout from "@/components/layout/MainLayout";
import WebhookTestTool from "@/components/tools/WebhookTestTool";

export default function WebhookTestPage() {
  return (
    <MainLayout activeTool="webhook-test">
      <WebhookTestTool />
    </MainLayout>
  );
}