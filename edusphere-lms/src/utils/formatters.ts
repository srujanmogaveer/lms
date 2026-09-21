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

/**
 * Format individual lesson duration in minutes (e.g. 15m, 45m, 1h 15m).
 */
export function formatLessonDuration(durationMinutes?: number, lessonType?: string): string {
  const normType = lessonType?.toLowerCase();
  if (normType === 'pdf') return 'PDF Document';
  if (normType === 'resource') return 'Resource File';
  if (normType === 'text') return durationMinutes && durationMinutes > 0 ? `${durationMinutes} min read` : 'Article';

  if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) {
    return '10 mins';
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} mins`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }

  return `${hours} hr ${mins} mins`;
}

/**
 * Calculate earned learning hours with high precision rounded to 1 decimal place.
 */
export function calculateEarnedLearningHours(
  courseDurationHours: number,
  completedLessons: number,
  totalLessons: number,
  isCompleted?: boolean,
  progressPercentage?: number
): number {
  const duration = Math.max(0, courseDurationHours || 0);
  if (duration === 0) return 0;

  if (isCompleted) {
    return Number(duration.toFixed(1));
  }

  if (totalLessons > 0) {
    const earned = (Math.min(completedLessons, totalLessons) / totalLessons) * duration;
    return Math.round(earned * 10) / 10;
  }

  if (progressPercentage !== undefined && progressPercentage > 0) {
    const earned = (Math.min(progressPercentage, 100) / 100) * duration;
    return Math.round(earned * 10) / 10;
  }

  return 0;
}

