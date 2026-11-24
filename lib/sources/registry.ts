import type { SourceAdapter } from './interface';
import { opensooqAdapter } from './opensooq';
import { facebookAdapter } from './facebook';

export const ADAPTERS: SourceAdapter[] = [opensooqAdapter, facebookAdapter];
export function getAdapter(id: string): SourceAdapter | undefined { return ADAPTERS.find((a) => a.id === id); }
export { opensooqAdapter, facebookAdapter };
