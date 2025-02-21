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
        color: "black",
        styles: {
          // TODO in mobile view, the bottom divider of the list doesn't
          //  extend when scrolling. It's been too tricky to figure out for now
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
