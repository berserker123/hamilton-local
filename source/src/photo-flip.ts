/** Toggle the photograph and its credit face. */
export function toggleFlip(flipped: boolean): boolean {
  return !flipped;
}

/** Enter and Space flip a focused photo. Other keys do not. */
export function keyTogglesFlip(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

/** Links on the credit face navigate. They do not flip the photo. */
export function clickTogglesFlip(targetIsLink: boolean): boolean {
  return !targetIsLink;
}
