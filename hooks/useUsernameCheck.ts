/**
 * useUsernameCheck — real-time username availability + format validation
 *
 * Returns a `status` value that drives the sign-up and profile-edit UIs:
 *   'idle'      — field is empty / below min length (no call fired)
 *   'invalid'   — fails format regex (shown immediately, no API call)
 *   'checking'  — debounced RPC call is in flight
 *   'available' — RPC returned true  → green ✅
 *   'taken'     — RPC returned false → red ❌
 *   'error'     — network / unexpected RPC error
 *
 * Format rules (Instagram-style):
 *   - Allowed: a–z, 0–9, underscore (_)
 *   - Min 3, max 30 characters
 *   - Cannot start or end with _
 *   - No consecutive __ (double underscore)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';

export type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_]{1,28}[a-z0-9]$|^[a-z0-9]{3}$/;
// Rejects consecutive underscores
const NO_DOUBLE_UNDERSCORE = /^(?!.*__)/;

export function validateUsernameFormat(username: string): boolean {
  const u = username.toLowerCase();
  return u.length >= 3 && u.length <= 30 && USERNAME_REGEX.test(u) && NO_DOUBLE_UNDERSCORE.test(u);
}

export function useUsernameCheck(
  username: string,
  /** Skip checking against this value (pass the user's current username so
   *  they can re-save their own handle without it appearing as "taken"). */
  skipIfEquals?: string,
): { status: UsernameStatus } {
  const trimmed = username.trim().toLowerCase();
  const debouncedUsername = useDebounce(trimmed, 350);

  // Determine if we should run the RPC at all
  const isFormatValid = validateUsernameFormat(trimmed);
  const isUnchanged = !!skipIfEquals && trimmed.toLowerCase() === skipIfEquals.toLowerCase();

  const shouldQuery =
    isFormatValid &&
    !isUnchanged &&
    debouncedUsername === trimmed && // only fire after debounce settles
    debouncedUsername.length >= 3;

  const { data, isFetching, isError } = useQuery<boolean>({
    queryKey: ['usernameCheck', debouncedUsername],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_username_available', {
        p_username: debouncedUsername,
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: shouldQuery,
    staleTime: 1000 * 10, // 10 s — fresh enough for signup flow
    retry: 1,
  });

  // Derive a single status value for the UI
  let status: UsernameStatus = 'idle';

  if (trimmed.length === 0) {
    status = 'idle';
  } else if (!isFormatValid) {
    status = 'invalid';
  } else if (isUnchanged) {
    // User hasn't changed their existing username — treat as available
    status = 'available';
  } else if (isFetching || debouncedUsername !== trimmed) {
    status = 'checking';
  } else if (isError) {
    status = 'error';
  } else if (data === true) {
    status = 'available';
  } else if (data === false) {
    status = 'taken';
  } else {
    // Query not yet run (e.g. debounce hasn't fired yet)
    status = 'checking';
  }

  return { status };
}

/** Human-readable hint for each status — use below the username input */
export function getUsernameHint(status: UsernameStatus): {
  text: string;
  color: 'neutral' | 'green' | 'red' | 'amber';
} {
  switch (status) {
    case 'idle':
      return { text: '3–30 chars. Letters, numbers and _ only.', color: 'neutral' };
    case 'invalid':
      return {
        text: 'Letters, numbers and _ only. 3–30 chars, no leading/trailing _.',
        color: 'red',
      };
    case 'checking':
      return { text: 'Checking availability…', color: 'neutral' };
    case 'available':
      return { text: 'Username is available ✓', color: 'green' };
    case 'taken':
      return { text: 'Username is already taken.', color: 'red' };
    case 'error':
      return { text: 'Could not verify availability. Try again.', color: 'amber' };
  }
}
