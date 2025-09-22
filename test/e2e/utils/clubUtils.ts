import { date } from "fast-check";

// "YYYY-MM-DD"
export const dateStringArbitrary = date().map((d) =>
  d.toISOString().slice(0, 10)
);

// "HH:mm"
export const timeStringArbitrary = date().map((d) =>
  d.toISOString().slice(11, 16)
);
