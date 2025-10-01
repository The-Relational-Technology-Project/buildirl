import { Rhythm } from "~/server/club/types";

export const getRhythmDescription = (rhythm: Rhythm) => {
  if (!rhythm.frequency || !rhythm.startDate || !rhythm.startTime) {
    return null;
  }
  return (
    <>
      {rhythm.frequency} on{" "}
      {new Date(rhythm.startDate).toLocaleDateString("en-US", {
        weekday: "long"
      })}
      s @{" "}
      {new Date(`1970-01-01T${rhythm.startTime}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })}
    </>
  );
};
