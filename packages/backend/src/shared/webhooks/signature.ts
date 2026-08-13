import { createHmac, timingSafeEqual } from 'node:crypto';

const GITHUB_SIGNATURE_PREFIX = 'sha256=';

export function verifyGitHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(GITHUB_SIGNATURE_PREFIX)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('hex');
  const providedSignature = signatureHeader.slice(GITHUB_SIGNATURE_PREFIX.length);

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(providedSignature, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function verifyGitLabToken(
  providedToken: string | undefined,
  expectedToken: string,
): boolean {
  if (!providedToken) {
    return false;
  }

  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
