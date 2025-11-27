"use client";

import React, { useState, useEffect } from "react";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
};

let listeners: ((toasts: Toast[]) => void)[] = [];
let memoryToasts: Toast[] = [];

function notifyListeners() {
  listeners.forEach((l) => l(memoryToasts));
}

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export function toast({ title, description, variant = "info", action }: Omit<Toast, "id">) {
  const id = genId();
  const newToast: Toast = { id, title, description, variant, action };
  memoryToasts = [...memoryToasts, newToast];
  notifyListeners();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 900000);

  return { id };
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return { toasts, toast };
}
