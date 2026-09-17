/**
 * Format duration in hours to a user-friendly readable string (e.g. 50 mins, 1 hr 30 mins, 2 hours).
 */
export function formatCourseDuration(durationHours?: number): string {
  if (!durationHours || isNaN(durationHours) || durationHours <= 0) {
    return '0 mins';
  }

  const totalMinutes = Math.round(durationHours * 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${hours} hr ${mins} mins`;
}

/**
 * Short duration format for cards and badges (e.g. 50m, 1.5h, 2h).
 */
export function formatCourseDurationShort(durationHours?: number): string {
  if (!durationHours || isNaN(durationHours) || durationHours <= 0) {
    return '0m';
  }

  const totalMinutes = Math.round(durationHours * 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
