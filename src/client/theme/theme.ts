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
    }
  }
});
