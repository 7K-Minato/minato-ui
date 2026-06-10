declare module "7k-design-system/react" {
  import * as React from "react";

  export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;

  export interface ButtonProps {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
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
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }

  export const Input: React.FC<InputProps>;

  export interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "info";
    className?: string;
  }

  export const Badge: React.FC<BadgeProps>;
}
