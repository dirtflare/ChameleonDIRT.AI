// FIX: Import React to use React.ReactNode type.
import React from 'react';

// This declares the JSZip class globally for TypeScript to recognize it from the CDN script
// FIX: Use `declare global` because adding an import turns this file into a module,
// which would otherwise scope this declaration locally instead of globally.
declare global {
  // FIX: Resolved a TypeScript error by defining a named interface `AIStudio` for the `window.aistudio` object.
  // The original inline type caused a declaration conflict because a global type `AIStudio` is expected for this property.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  // Add aistudio to the window object for API key selection
  interface Window {
    // FIX: Make `aistudio` optional to resolve the "All declarations of 'aistudio' must have identical modifiers" error.
    // This can happen if another part of the environment (e.g., a global .d.ts file) also declares this property on Window, but as optional.
    // The application code already checks for its existence, so this change is safe.
    aistudio?: AIStudio;
  }

  class JSZip {
    file(name: string, data: any, options?: any): this;
    generateAsync(options?: { type: 'blob' }): Promise<Blob>;
  }
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string; // This will be a base64 data URL
}

export interface ColorTemplate {
  category: string;
  color: string;
  enabled: boolean;
}

export interface ExportPreset {
  name: string;
  key: string;
  width: number;
  height: number;
  icon: React.ReactNode;
}