declare module "7k-design-system/react" {
  import * as React from "react";

  export type Theme = "dark" | "light";

  export interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
  }

  export const useTheme: () => ThemeContextValue;

  export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;

  export type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "glow"
    | "glow-cyan"
    | "glow-grid"
    | "danger";

  export type ButtonSize = "sm" | "md" | "lg";

  export interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
  }

  export const Button: React.FC<ButtonProps>;

  export interface InputProps {
    id?: string;
    name?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
  }

  export const Input: React.FC<InputProps>;

  export type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral";

  export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
  }

  export const Badge: React.FC<BadgeProps>;

  export interface ThemeToggleProps {
    className?: string;
  }

  export const ThemeToggle: React.FC<ThemeToggleProps>;
}
