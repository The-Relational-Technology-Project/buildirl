"use client";

import { Button, ButtonProps } from "@mantine/core";
import { TablerIcon } from "@tabler/icons-react";
import React from "react";

interface CTAButtonProps extends ButtonProps {
  children: string;
  icon?: TablerIcon;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
}

export default function CTAButton({
  children,
  icon: Icon,
  variant = "primary",
  size = "lg",
  onClick,
  ...props
}: CTAButtonProps) {
  const getStyles = () => {
    const baseStyles = {
      borderRadius: 360,
      fontWeight: 600,
      transition: "all 0.3s ease"
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyles,
          background: "linear-gradient(135deg, #7A3EDA, #9b6eea, #FFC857)",
          color: "white",
          border: "1px solid black",
          boxShadow: "3px 3px 0px #5c2fb8, 6px 6px 12px rgba(122, 62, 218, 0.3)",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 20px rgba(122, 62, 218, 0.4)"
          }
        };
      case "secondary":
        return {
          ...baseStyles,
          border: "2px solid #FFC857",
          color: "#FFC857",
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "#FFC857",
            color: "white",
            transform: "scale(1.05)",
            boxShadow: "0 8px 25px -5px rgba(255, 200, 87, 0.25)"
          }
        };
      case "outline":
        return {
          ...baseStyles,
          border: "1px solid rgba(122, 62, 218, 0.3)",
          color: "#7A3EDA",
          backgroundColor: "rgba(122, 62, 218, 0.05)",
          "&:hover": {
            backgroundColor: "#7A3EDA",
            color: "white",
            transform: "scale(1.05)"
          }
        };
    }
  };

  return (
    <Button
      size={size}
      leftSection={Icon && <Icon size={18} />}
      onClick={onClick}
      styles={{
        root: getStyles()
      }}
      {...props}
    >
      {children}
    </Button>
  );
}