import { superheroData, adjectives } from '@/superhero';

/**
 * Generates a unique referral code for sellers using superhero names and adjectives
 * @param sellerId - The unique identifier of the seller
 * @returns A unique referral code in the format: "Adjective-Superhero"
 * 
 * @example
 * generateReferralCode("seller-123") // Returns: "Alpha-Batman"
 * generateReferralCode("seller-456") // Returns: "Quantum-Superman"
 */
export function generateReferralCode(sellerId: string): string {
  // Create a hash from the seller ID to ensure consistency
  let hash = 0;
  for (let i = 0; i < sellerId.length; i++) {
    const charCode = sellerId.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to get consistent indices
  const adjectiveIndex = Math.abs(hash % adjectives.length);
  const superheroIndex = Math.abs(Math.floor(hash / adjectives.length) % superheroData.length);

  const selectedAdjective = adjectives[adjectiveIndex];
  const selectedSuperhero = superheroData[superheroIndex];

  return `${selectedAdjective}-${selectedSuperhero}`;
}

/**
 * Generates multiple unique referral codes (useful for batch operations)
 * @param sellerIds - Array of seller IDs
 * @returns Object with sellerId as key and referral code as value
 * 
 * @example
 * generateReferralCodes(["seller-1", "seller-2", "seller-3"])
 * // Returns: {
 * //   "seller-1": "Alpha-Batman",
 * //   "seller-2": "Quantum-Superman",
 * //   "seller-3": "Nova-Goku"
 * // }
 */
export function generateReferralCodes(sellerIds: string[]): Record<string, string> {
  return sellerIds.reduce((acc, sellerId) => {
    acc[sellerId] = generateReferralCode(sellerId);
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Validates if a referral code is in the correct format
 * @param code - The referral code to validate
 * @returns true if valid, false otherwise
 */
export function isValidReferralCode(code: string): boolean {
  const parts = code.split('-');
  if (parts.length !== 2) return false;

  const [adjective, superhero] = parts;
  return adjectives.includes(adjective) && superheroData.includes(superhero);
}

/**
 * Decodes a referral code back to its components
 * @param code - The referral code to decode
 * @returns Object with adjective and superhero properties
 */
export function decodeReferralCode(code: string): { adjective: string; superhero: string } | null {
  if (!isValidReferralCode(code)) return null;

  const [adjective, superhero] = code.split('-');
  return { adjective, superhero };
}
