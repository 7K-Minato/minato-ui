"use client";

import { ThemeProvider as DesignSystemThemeProvider } from "7k-design-system/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  return (
    <DesignSystemThemeProvider defaultTheme="dark">
      {children}
    </DesignSystemThemeProvider>
  );
}
