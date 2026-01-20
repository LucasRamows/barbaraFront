import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const calculateReminderTime = (
  eventDate: string,
  type: string
): string | undefined => {
  if (!eventDate || !type) return undefined;

  const date = new Date(eventDate);

  switch (type) {
    case "3days":
      date.setDate(date.getDate() - 3);
      break;

    case "1day":
      date.setDate(date.getDate() - 1);
      break;

    case "1week":
      date.setDate(date.getDate() - 7);
      break;

    case "1month":
      date.setMonth(date.getMonth() - 1);
      break;

    default:
      return undefined;
  }

  return date.toISOString();
};

export { calculateReminderTime };