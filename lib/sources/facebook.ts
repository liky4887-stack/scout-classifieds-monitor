import type { NormalizedListing, SourceSession } from '../types';
import type { SourceAdapter } from './interface';

export class FacebookAdapter implements SourceAdapter {
  readonly id = 'facebook';
  readonly name = 'Facebook Groups';
  readonly nameAr = 'مجموعات فيسبوك';
  readonly baseUrl = 'https://www.facebook.com';
  readonly disabledByDefault = true;
  async fetchNewPosts(_session: SourceSession): Promise<NormalizedListing[]> { return []; }
  parsePost(_raw: unknown): NormalizedListing { throw new Error('Facebook adapter is disabled and not implemented.'); }
}

export const facebookAdapter = new FacebookAdapter();
