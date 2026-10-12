import { TelegramSecretTokenScheme } from './telegram-secret-token-scheme.js';

describe('TelegramSecretTokenScheme', () => {
  const scheme = new TelegramSecretTokenScheme();
  const keys = [scheme.key('the-secret-token-given-to-setWebhook')];
  const rawBody = Buffer.from('{"update_id":1001}');

  it('accepts the secret token given to setWebhook', () => {
    expect(scheme.verify({ headers: { 'x-telegram-bot-api-secret-token': 'the-secret-token-given-to-setWebhook' }, rawBody }, keys)).toEqual({ valid: true });
  });

  it('refuses another token, a missing one, and a repeated header', () => {
    expect(scheme.verify({ headers: { 'x-telegram-bot-api-secret-token': 'a-guessed-token' }, rawBody }, keys)).toMatchObject({
      valid: false,
      reason: 'invalid-signature',
    });
    expect(scheme.verify({ headers: {}, rawBody }, keys)).toMatchObject({ valid: false, reason: 'missing-header' });
    expect(scheme.verify({ headers: { 'x-telegram-bot-api-secret-token': ['a', 'b'] }, rawBody }, keys)).toMatchObject({
      valid: false,
      reason: 'malformed-header',
    });
  });

  it('deduplicates on the update id', () => {
    expect(scheme.idFromPayload({ update_id: 1001, message: {} }, {})).toBe('1001');
    expect(scheme.idFromPayload({ message: {} }, {})).toBeUndefined();
  });
});
