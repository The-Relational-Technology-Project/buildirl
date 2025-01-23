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
          borderColor: "black"
        }
      }
    }
  }
});
