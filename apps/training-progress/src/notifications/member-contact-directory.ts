import type { MemberContact } from './member-contact.interface.js';

/**
 * Port: finds a member's contact. Its adapter translates the identity provider's user profile into
 * a member contact, so the provider's vocabulary never reaches Notifications.
 */
export abstract class MemberContactDirectory {
  abstract contactOf(memberId: string): Promise<MemberContact>;
}
