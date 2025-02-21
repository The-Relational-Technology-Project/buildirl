import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Manrope",
  headings: { fontFamily: "Manrope" },
  components: {
    Button: {
      defaultProps: {
        color: "black",
        variant: "filled"
      }
    },
    Paper: {
      defaultProps: {
        style: {
          border: "2px solid black",
          boxShadow: "4px 4px 0px black"
        }
      }
    },
    Card: {
      defaultProps: {
        style: {
          border: "2px solid black",
          boxShadow: "4px 4px 0px black"
        }
      }
    },
    TextInput: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid black",
            borderRadius: 0
          }
        }
      }
    },
    Select: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid black",
            borderRadius: 0
          }
        }
      }
    },
    Textarea: {
      defaultProps: {
        styles: {
          input: {
            border: "1px solid black",
            borderRadius: 0
          }
        }
      }
    },
    Tabs: {
      defaultProps: {
        color: "#e7e2ca",
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
    }
  }
});
