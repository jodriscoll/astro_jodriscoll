export type BackgroundSegment = {
  id: string;
  label: string;
  weight: number;
};

/**
 * Rounded share of public roles and projects that name the platform.
 * A record counts once per bucket. JavaScript includes an explicit
 * language mention or a JavaScript UI framework (Angular, React, Vue),
 * which is also counted in the framework bucket.
 * Counted: JavaScript 14, frameworks 8, WordPress 8, PHP 5, Drupal 3,
 * Python 3, Ruby 2. Largest-remainder rounding. Not the GitHub language API.
 */
export const background: BackgroundSegment[] = [
  { id: 'javascript', label: 'JavaScript / TypeScript', weight: 32 },
  { id: 'frameworks', label: 'Angular, React, Vue', weight: 19 },
  { id: 'wordpress', label: 'WordPress', weight: 18 },
  { id: 'php', label: 'PHP', weight: 12 },
  { id: 'drupal', label: 'Drupal', weight: 7 },
  { id: 'python', label: 'Python', weight: 7 },
  { id: 'ruby', label: 'Ruby', weight: 5 },
];
