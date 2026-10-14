// The share extension opens the app with `unlockpdf://expo-sharing`; the shared
// PDF itself is picked up by the unlock screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (new URL(path).hostname === 'expo-sharing') return '/';
  } catch {
    return '/';
  }
  return path;
}
