import { PDFDocument } from '@cantoo/pdf-lib';
import { File, Paths } from 'expo-file-system';

export class NotEncryptedError extends Error {
  constructor() {
    super('This PDF is not password-protected — nothing to unlock.');
    this.name = 'NotEncryptedError';
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super('Incorrect password. Please try again.');
    this.name = 'WrongPasswordError';
  }
}

export interface UnlockResult {
  uri: string;
  name: string;
}

/**
 * Decrypts a password-protected PDF and writes an unlocked copy to the app's
 * cache directory. Fully offline — the file never leaves the device.
 */
export async function unlockPdf(
  sourceUri: string,
  sourceName: string,
  password: string,
): Promise<UnlockResult> {
  const bytes = await new File(sourceUri).bytes();

  // First pass: detect whether the document is encrypted at all.
  const probe = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (!probe.isEncrypted) {
    throw new NotEncryptedError();
  }

  // Second pass: decrypt with the user's password.
  let document: PDFDocument;
  try {
    document = await PDFDocument.load(bytes, { ignoreEncryption: true, password });
  } catch {
    throw new WrongPasswordError();
  }

  // Re-saving the decrypted document produces an unencrypted copy.
  const unlockedBytes = await document.save();

  const baseName = sourceName.replace(/\.pdf$/i, '') || 'document';
  const output = uniqueOutputFile(baseName);
  output.create();
  output.write(unlockedBytes);

  return { uri: output.uri, name: output.name };
}

/**
 * Always writes a new copy named "<name> (unlocked).pdf" — never the source
 * file itself. If that name is already taken, appends a counter instead of
 * overwriting: "<name> (unlocked 2).pdf", "<name> (unlocked 3).pdf", …
 */
function uniqueOutputFile(baseName: string): File {
  let candidate = new File(Paths.cache, `${baseName} (unlocked).pdf`);
  for (let counter = 2; candidate.exists; counter++) {
    candidate = new File(Paths.cache, `${baseName} (unlocked ${counter}).pdf`);
  }
  return candidate;
}
