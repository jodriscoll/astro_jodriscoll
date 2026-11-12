import type { HostStack, Stack } from './types';
import { STACKS } from './types';

const HOST_STACKS = STACKS.filter((stack): stack is HostStack => stack !== 'canonical');

export function isStack(value: string): value is Stack {
  return (STACKS as readonly string[]).includes(value);
}

export function resolveStack(url: URL, hostHeader: string): Stack | 'invalid' {
  const requested = url.searchParams.get('stack');
  if (requested) return isStack(requested) ? requested : 'invalid';

  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? '';
  const label = hostname.split('.')[0] ?? '';
  if ((HOST_STACKS as readonly string[]).includes(label)) return label as HostStack;
  return 'astro';
}
