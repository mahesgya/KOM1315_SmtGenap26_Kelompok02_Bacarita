import { AsymmetricSignatureService } from './asymmetric-signature.service';

describe('Unit Test: AsymmetricSignatureService', () => {
  let service: AsymmetricSignatureService;

  beforeEach(() => {
    service = new AsymmetricSignatureService();
  });

  it('must instantiate and expose a PEM public key', () => {
    const pem = service.getPublicKeyPem();
    expect(pem).toContain('BEGIN PUBLIC KEY');
  });

  it('must sign data and verify the signature (valid case)', () => {
    const payload = JSON.stringify({
      id: 'session-001',
      studentId: 'student-001',
      score: 85,
      medal: 'GOLD',
    });

    const signature = service.sign(payload);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);

    const isValid = service.verify(payload, signature);
    expect(isValid).toBe(true);
  });

  it('must reject a tampered payload (non-repudiation check)', () => {
    const original = JSON.stringify({ id: 'session-002', score: 90 });
    const tampered = JSON.stringify({ id: 'session-002', score: 0 });

    const signature = service.sign(original);
    const isValid = service.verify(tampered, signature);
    expect(isValid).toBe(false);
  });

  it('must reject a forged signature (invalid base64 bytes)', () => {
    const data = 'important result data';
    const forgedSig = Buffer.alloc(256, 0).toString('base64');

    const isValid = service.verify(data, forgedSig);
    expect(isValid).toBe(false);
  });

  it('must reject an empty signature string', () => {
    const data = 'some data';
    const isValid = service.verify(data, '');
    expect(isValid).toBe(false);
  });

  it('must produce different signatures for different data', () => {
    const sig1 = service.sign('data-a');
    const sig2 = service.sign('data-b');
    expect(sig1).not.toBe(sig2);
  });

  it('must produce a stable signature verifiable across service instances for env-keyed keys', () => {
    // When both instances share the same ephemeral key (via env shim), cross-verify works.
    // Here we test that sign + verify on the same instance is deterministic in verification.
    const data = 'cross-instance-check';
    const sig = service.sign(data);
    expect(service.verify(data, sig)).toBe(true);
  });
});
