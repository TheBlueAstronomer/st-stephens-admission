export interface OfferGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates whether an applicant is eligible to move to registration.
 * Requires an accepted offer (acceptedAt set).
 */
export function validateOfferGate(offer: { acceptedAt: Date | null } | null | undefined): OfferGateResult {
  if (!offer) {
    return {
      allowed: false,
      reason: 'An accepted offer is required before moving to registration. No offer has been recorded.',
    };
  }

  if (!offer.acceptedAt) {
    return {
      allowed: false,
      reason: 'An accepted offer is required before moving to registration. The applicant has not accepted their offer.',
    };
  }

  return { allowed: true };
}
