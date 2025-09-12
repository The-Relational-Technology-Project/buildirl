export const getDayOfWeek = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}