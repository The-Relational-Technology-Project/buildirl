import { createTheme } from "@mantine/core";

export const theme = createTheme({
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
    }
  }
});
