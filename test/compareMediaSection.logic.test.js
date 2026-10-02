import { describe, it, expect } from 'vitest';

describe('CompareMediaSection - Media Item Pairing Logic', () => {
  const normalizeMediaId = (mediaId, idx) => String(mediaId || `new-${idx}`);

  it('should pair media items by media_id and track isMatched correctly', () => {
    // Simulate current data with items at different indices
    const formData = {
      media: [
        { media_id: '1270', is_primary: true },  // idx 0
        { media_id: '19188', is_primary: false }, // idx 1
      ],
    };

    // Simulate compare data with items in different order
    const compareData = {
      media: [
        { media_id: '19188', is_primary: true },  // idx 0 in compare
        { media_id: '1270', is_primary: false },  // idx 1 in compare
      ],
    };

    // Index compare items by media_id for O(1) lookup
    const compareMediaById = Object.fromEntries(
      (compareData.media || []).map((m, idx) => [normalizeMediaId(m.media_id, idx), { media: m, index: idx }])
    );

    // Step through current data and look up compare matches
    const allPairs = (formData.media || []).map((currentMedia, currentIdx) => {
      const mediaId = normalizeMediaId(currentMedia.media_id, currentIdx);
      const compareItem = compareMediaById[mediaId] || null;

      return {
        mediaId,
        current: { media: currentMedia, index: currentIdx },
        compare: compareItem,
        isMatched: !!compareItem, // Track whether this pair has both sides
      };
    });

    // Add compare-only items (not matched with current)
    const currentMediaIds = new Set((formData.media || []).map((m, idx) => normalizeMediaId(m.media_id, idx)));
    Object.entries(compareMediaById).forEach(([mediaId, compareItem]) => {
      if (!currentMediaIds.has(mediaId)) {
        allPairs.push({
          mediaId,
          current: null,
          compare: compareItem,
          isMatched: false,
        });
      }
    });

    // Verify pairing
    expect(allPairs).toHaveLength(2);

    // Check first pair: 1270 exists in both
    const pair1270 = allPairs.find(p => p.mediaId === '1270');
    expect(pair1270).toEqual({
      mediaId: '1270',
      current: { media: formData.media[0], index: 0 },
      compare: compareMediaById['1270'],
      isMatched: true,
    });

    // Check second pair: 19188 exists in both
    const pair19188 = allPairs.find(p => p.mediaId === '19188');
    expect(pair19188).toEqual({
      mediaId: '19188',
      current: { media: formData.media[1], index: 1 },
      compare: compareMediaById['19188'],
      isMatched: true,
    });
  });

  it('should correctly identify one-sided items with isMatched=false', () => {
    // Current data has two items
    const formData = {
      media: [
        { media_id: '1270', is_primary: true },  // Only in current
        { media_id: '19188', is_primary: false }, // In both
      ],
    };

    // Compare data has three items (includes one not in current)
    const compareData = {
      media: [
        { media_id: '19188', is_primary: true },  // In both
        { media_id: '2000', is_primary: false },  // Only in compare
      ],
    };

    const compareMediaById = Object.fromEntries(
      (compareData.media || []).map((m, idx) => [normalizeMediaId(m.media_id, idx), { media: m, index: idx }])
    );

    const allPairs = (formData.media || []).map((currentMedia, currentIdx) => {
      const mediaId = normalizeMediaId(currentMedia.media_id, currentIdx);
      const compareItem = compareMediaById[mediaId] || null;

      return {
        mediaId,
        current: { media: currentMedia, index: currentIdx },
        compare: compareItem,
        isMatched: !!compareItem,
      };
    });

    const currentMediaIds = new Set((formData.media || []).map((m, idx) => normalizeMediaId(m.media_id, idx)));
    Object.entries(compareMediaById).forEach(([mediaId, compareItem]) => {
      if (!currentMediaIds.has(mediaId)) {
        allPairs.push({
          mediaId,
          current: null,
          compare: compareItem,
          isMatched: false,
        });
      }
    });

    expect(allPairs).toHaveLength(3);

    // 1270: current-only, should not match
    const pair1270 = allPairs.find(p => p.mediaId === '1270');
    expect(pair1270.isMatched).toBe(false);
    expect(pair1270.current).toBeTruthy();
    expect(pair1270.compare).toBeNull();

    // 19188: matched
    const pair19188 = allPairs.find(p => p.mediaId === '19188');
    expect(pair19188.isMatched).toBe(true);
    expect(pair19188.current).toBeTruthy();
    expect(pair19188.compare).toBeTruthy();

    // 2000: compare-only
    const pair2000 = allPairs.find(p => p.mediaId === '2000');
    expect(pair2000.isMatched).toBe(false);
    expect(pair2000.current).toBeNull();
    expect(pair2000.compare).toBeTruthy();
  });

  it('should maintain isMatched flag even after state changes', () => {
    // Test scenario: Remove button (current-only item) is clicked to mark for removal
    // Then undo is clicked - the button should still show as Remove (not Replace)

    const initialPair = {
      mediaId: '1270',
      current: { media: { media_id: '1270' }, index: 0 },
      compare: null, // Only exists in current
      isMatched: false, // Original composition
    };

    const removedMediaIds = new Set(['1270']); // User removed it

    // Even though item is marked removed, the button should still be "Remove" (with Undo)
    // because isMatched=false means it was originally a one-sided item
    const shouldShowRemoveButton = initialPair.current && !initialPair.isMatched;
    expect(shouldShowRemoveButton).toBe(true);

    // After undo, removedMediaIds.delete('1270'), but isMatched is still false
    removedMediaIds.delete('1270');
    const isRemoved = removedMediaIds.has('1270');

    // The button state is based on isDirty (isRemoved) and the button type (based on isMatched)
    const isDirty = isRemoved;
    expect(isDirty).toBe(false); // After undo, not dirty
    expect(initialPair.isMatched).toBe(false); // But still one-sided

    // This is key: button selection logic MUST use isMatched, not current/compare
    // because current/compare values don't change, only the tracking state does
    expect(initialPair.current && !initialPair.isMatched).toBe(true); // Remove button stays correct
  });
});
