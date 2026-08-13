import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyGitHubSignature, verifyGitLabToken } from './signature.js';

describe('verifyGitHubSignature', () => {
  const secret = 'test-secret';
  const body = Buffer.from(JSON.stringify({ hello: 'world' }));

  it('aceita uma assinatura HMAC-SHA256 valida', () => {
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    expect(verifyGitHubSignature(body, signature, secret)).toBe(true);
  });

  it('rejeita assinatura invalida', () => {
    expect(verifyGitHubSignature(body, 'sha256=deadbeef', secret)).toBe(false);
  });

  it('rejeita quando o header esta ausente ou sem prefixo sha256=', () => {
    expect(verifyGitHubSignature(body, undefined, secret)).toBe(false);
    expect(verifyGitHubSignature(body, 'md5=abc', secret)).toBe(false);
  });

  it('rejeita quando body foi alterado', () => {
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const tamperedBody = Buffer.from(JSON.stringify({ hello: 'tampered' }));
    expect(verifyGitHubSignature(tamperedBody, signature, secret)).toBe(false);
  });
});

describe('verifyGitLabToken', () => {
  it('aceita quando o token corresponde', () => {
    expect(verifyGitLabToken('secret-token', 'secret-token')).toBe(true);
  });

  it('rejeita quando o token nao corresponde ou esta ausente', () => {
    expect(verifyGitLabToken('wrong-token', 'secret-token')).toBe(false);
    expect(verifyGitLabToken(undefined, 'secret-token')).toBe(false);
  });
});
