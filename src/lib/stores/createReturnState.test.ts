import { describe, expect, it } from 'vitest';
import {
  isCreateEntrySurface,
  isFeedDiscoveryPath
} from './createReturnState';

describe('createReturnState feed surfaces', () => {
  it('treats home and personal as discovery feeds', () => {
    expect(isFeedDiscoveryPath('/')).toBe(true);
    expect(isFeedDiscoveryPath('/personal')).toBe(true);
  });

  it('treats channel, community, and platform feeds as discovery feeds', () => {
    expect(isFeedDiscoveryPath('/channels/general')).toBe(true);
    expect(isFeedDiscoveryPath('/communities/neighbors')).toBe(true);
    expect(isFeedDiscoveryPath('/platform')).toBe(true);
  });

  it('does not treat detail pages as discovery feeds', () => {
    expect(isFeedDiscoveryPath('/threads/hello')).toBe(false);
    expect(isFeedDiscoveryPath('/channels/general/settings')).toBe(false);
    expect(isFeedDiscoveryPath('/map')).toBe(false);
  });

  it('aligns create-entry surfaces with discovery feeds', () => {
    expect(isCreateEntrySurface('/channels/general')).toBe(true);
    expect(isCreateEntrySurface('/platform')).toBe(true);
    expect(isCreateEntrySurface('/settings')).toBe(false);
  });
});
