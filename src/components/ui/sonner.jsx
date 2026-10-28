import React from "react";
import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  return <Sonner theme="dark" richColors position="bottom-right" {...props} />;
}