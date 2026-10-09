import { Injectable } from '@nestjs/common';
import type { MemberContact } from './member-contact.interface.js';
import { MemberContactDirectory } from './member-contact-directory.js';

/**
 * Until Identity exists, a member id is the member's email address (unverified), so that is where
 * they're reached. The name is the address's local part.
 */
@Injectable()
export class DevelopmentMemberContactDirectory extends MemberContactDirectory {
  async contactOf(memberId: string): Promise<MemberContact> {
    const [localPart] = memberId.split('@');
    return { name: localPart.charAt(0).toUpperCase() + localPart.slice(1), address: memberId };
  }
}
