import { createTheme } from "@mantine/core";

export const theme = createTheme({
  colors: {
    dark: [
      "#ffffff",
      "#ffffff",
      "#8c8fa3",
      "#666980",
      "#4d4f66",
      "#34354a",
      "#2b2c3d",
      "#1d1e30",
      "#0c0d21",
      "#0c0d21"
    ],
    beige: [
      "#fffdf2",
      "#fffef3",
      "#fcf9e4",
      "#faf7dd",
      "#faf8e4",
      "#f1efd7",
      "#e7e2ca",
      "#ddd8bd",
      "#d3ceb0",
      "#c9c4a3"
    ],
    lilac: [
      "#f2eeff",
      "#e5e0ff",
      "#d7d0ff",
      "#c3b7ff",
      "#af9eff",
      "#9b85ff",
      "#7a63cb",
      "#6850b7",
      "#563da3",
      "#442a8f"
    ]
  },
  fontFamily: 'var(--font-body)',
  headings: { fontFamily: 'var(--font-heading)' },
  components: {
    Button: {
      defaultProps: {
        color: "black",
        variant: "filled"
      }
    },
    Paper: {
      defaultProps: {
        withBorder: true,
        style: {
          border: "1px solid",
          boxShadow: "2px 2px 0px"
        }
      }
    },
    Card: {
      defaultProps: {
        style: {
          border: "1px solid",
          boxShadow: "2px 2px 0px"
        }
      }
    },
    TextInput: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid",
            borderRadius: 0
          }
        }
      }
    },
    Select: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid",
            borderRadius: 0
          }
        }
      }
    },
    Textarea: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid",
            borderRadius: 0
          }
        }
      }
    },
    Checkbox: {
      defaultProps: {
        color: "black",
        styles: {
          input: {
            border: "1px solid",
            borderRadius: 0
          }
        }
      }
    },
    Radio: {
      defaultProps: {
        color: "black"
      }
    },
    Tabs: {
      defaultProps: {
        // this looks off in dark mode, we override to fix this
        color: "beige",
        variant: "pills",
        autoContrast: true,
        styles: {
          tab: {
            borderRadius: 0
          },
          list: {
            scrollbarWidth: "none",
            overflowX: "auto",
            flexWrap: "nowrap"
          }
        }
      }
    },
    Modal: {
      defaultProps: {
        styles: {
          content: {
            border: "1px solid",
            borderRadius: 4
          }
        }
      }
    },
    Menu: {
      defaultProps: {
        styles: {
          dropdown: {
            border: "1px solid",
            borderRadius: 4
          }
        }
      }
    },
    ActionIcon: {
      defaultProps: {
        variant: "transparent"
      }
    },
    ThemeIcon: {
      defaultProps: {
        variant: "transparent"
      }
    }
  }
});
