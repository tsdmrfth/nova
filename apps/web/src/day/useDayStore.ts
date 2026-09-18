import { useContext } from "react";
import { DayStoreContext, type DayStoreValue } from "./dayStoreContext";

export function useDayStore(): DayStoreValue {
  const value = useContext(DayStoreContext);
  if (!value) {
    throw new Error("useDayStore must be used within DayStoreProvider");
  }
  return value;
}
