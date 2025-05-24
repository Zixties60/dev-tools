import React from 'react';

export const metadata = {
  title: 'Webhook Testing Tool',
  description: 'Test and debug webhooks with ease',
};

export default function WebhookTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just pass children through without additional wrapping
  return children;
}