import { describe, it, expect } from 'vitest';
import { validateOfferGate } from '@/lib/business-rules/offer-gate';
import { validateDocumentGate } from '@/lib/business-rules/document-gate';

describe('validateOfferGate', () => {
  it('blocks when no offer exists', () => {
    const result = validateOfferGate(null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No offer has been recorded');
  });

  it('blocks when offer exists but acceptedAt is null', () => {
    const result = validateOfferGate({ acceptedAt: null });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('has not accepted their offer');
  });

  it('blocks when offer is undefined', () => {
    const result = validateOfferGate(undefined);
    expect(result.allowed).toBe(false);
  });

  it('allows when offer has acceptedAt set', () => {
    const result = validateOfferGate({ acceptedAt: new Date('2025-08-01') });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('validateDocumentGate', () => {
  it('allows when no documents exist', () => {
    const result = validateDocumentGate([]);
    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('allows when all required documents are received', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: true, isWaived: false, documentType: { name: 'Passport' } },
      { isRequired: true, isReceived: true, isWaived: false, documentType: { name: 'DBS Certificate' } },
    ]);
    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('allows when required document is waived', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: false, isWaived: true, documentType: { name: 'Passport' } },
    ]);
    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('blocks when one mandatory document is outstanding', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: false, isWaived: false, documentType: { name: 'DBS Certificate' } },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('DBS Certificate');
  });

  it('blocks and lists all missing mandatory documents', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: false, isWaived: false, documentType: { name: 'Passport' } },
      { isRequired: true, isReceived: false, isWaived: false, documentType: { name: 'DBS Certificate' } },
      { isRequired: false, isReceived: false, isWaived: false, documentType: { name: 'Optional Reference' } },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toHaveLength(2);
    expect(result.missingDocuments).toContain('Passport');
    expect(result.missingDocuments).toContain('DBS Certificate');
    expect(result.missingDocuments).not.toContain('Optional Reference');
  });

  it('allows when mix of received and waived, all required docs satisfied', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: true, isWaived: false, documentType: { name: 'Passport' } },
      { isRequired: true, isReceived: false, isWaived: true, documentType: { name: 'DBS Certificate' } },
      { isRequired: false, isReceived: false, isWaived: false, documentType: { name: 'Optional Reference' } },
    ]);
    expect(result.allowed).toBe(true);
    expect(result.missingDocuments).toHaveLength(0);
  });

  it('uses fileName as fallback when documentType is null', () => {
    const result = validateDocumentGate([
      { isRequired: true, isReceived: false, isWaived: false, documentType: null, fileName: 'medical_certificate.pdf' },
    ]);
    expect(result.allowed).toBe(false);
    expect(result.missingDocuments).toContain('medical_certificate.pdf');
  });
});
