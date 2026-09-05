const IST_TIME_ZONE = "Asia/Kolkata";

export function getCurrentDateTimeIST(): Date {
  return new Date();
}

export function getCurrentDateIST(date = getCurrentDateTimeIST()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getCurrentTimeIST(date = getCurrentDateTimeIST()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}