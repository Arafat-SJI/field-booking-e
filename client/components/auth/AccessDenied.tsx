'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  message: string;
  onLogout: () => void;
}

export function AccessDenied({ message, onLogout }: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Access restricted</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={onLogout}>
          Back to login
        </Button>
      </div>
    </div>
  );
}
