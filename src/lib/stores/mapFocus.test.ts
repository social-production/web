import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { clearMapFocusRequest, mapFocusRequest, openPlaceOnMap } from './mapFocus';

describe('openPlaceOnMap', () => {
  it('asks the shell to show a named place and ignores blank names', () => {
    clearMapFocusRequest();
    openPlaceOnMap('   ');
    expect(get(mapFocusRequest)).toBeNull();

    openPlaceOnMap(' St Kilda Beach ', 'loc-1');
    expect(get(mapFocusRequest)).toMatchObject({ label: 'St Kilda Beach', locationId: 'loc-1' });

    clearMapFocusRequest();
    expect(get(mapFocusRequest)).toBeNull();
  });
});
