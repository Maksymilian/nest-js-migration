import { type WebhookHeaders, type WebhookSignatureCheck, type WebhookSignedRequest, WebhookSignatureScheme } from '@nestjs/webhooks';

const HEADER = 'x-telegram-bot-api-secret-token';

/**
 * Telegram's scheme: no signature, but the secret token given to `setWebhook` comes back in the
 * `X-Telegram-Bot-Api-Secret-Token` header of every update. The deduplication id is the update's
 * `update_id`, from the body: Telegram sends an update again until it gets a 2xx.
 */
export class TelegramSecretTokenScheme extends WebhookSignatureScheme {
  verify({ headers }: WebhookSignedRequest, keys: readonly Buffer[]): WebhookSignatureCheck {
    const token = headers[HEADER];
    if (token === undefined) {
      return { valid: false, reason: 'missing-header', detail: `no ${HEADER} header` };
    }
    if (typeof token !== 'string') {
      return { valid: false, reason: 'malformed-header', detail: `${HEADER} is repeated` };
    }
    // In constant time, never with ===.
    if (keys.some((key) => WebhookSignatureScheme.matches(key, [Buffer.from(token)]))) {
      return { valid: true };
    }
    return { valid: false, reason: 'invalid-signature', detail: `${HEADER} matches no configured secret` };
  }

  override idFromPayload(payload: unknown, _headers: WebhookHeaders): string | undefined {
    const id = (payload as { update_id?: unknown } | null)?.update_id;
    return Number.isSafeInteger(id) ? String(id) : undefined;
  }
}
