import { createTheme } from "@mantine/core";

export const index = createTheme({
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
          borderColor: "gray.2"
        }
      }
    }
  }
});
