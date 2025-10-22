import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { processSmartNote } from '../features/notes/pipeline';
import { noteStore } from '../store/noteStore';

// Mock the noteStore
vi.mock('../store/noteStore', () => ({
  noteStore: {
    add: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  },
}));

describe('processSmartNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error on empty input', async () => {
    await expect(processSmartNote('')).rejects.toThrow('Empty input');
    await expect(processSmartNote('   ')).rejects.toThrow('Empty input');
  });

  it('should create note with events when auto-tracking is enabled', async () => {
    const raw = 'Did 50 pushups and drank 500ml water';

    await processSmartNote(raw, { autoTracking: true });

    expect(noteStore.add).toHaveBeenCalledOnce();
    const addedNote = vi.mocked(noteStore.add).mock.calls[0][0];

    expect(addedNote.raw).toBe(raw);
    expect(addedNote.pending).toBe(false);
    expect(Array.isArray(addedNote.events)).toBe(true);
  });

  it('should create note without events when auto-tracking is disabled', async () => {
    const raw = 'Just a regular note';

    await processSmartNote(raw, { autoTracking: false });

    expect(noteStore.add).toHaveBeenCalledOnce();
    const addedNote = vi.mocked(noteStore.add).mock.calls[0][0];

    expect(addedNote.raw).toBe(raw);
    expect(addedNote.summary).toBe(raw);
    expect(addedNote.events).toEqual([]);
  });

  it('should include attachments when provided', async () => {
    const raw = 'Note with attachment';
    const attachments = [{ id: 'att1', url: 'https://example.com/image.jpg', type: 'image' as const }];

    await processSmartNote(raw, { autoTracking: false, attachments });

    expect(noteStore.add).toHaveBeenCalledOnce();
    const addedNote = vi.mocked(noteStore.add).mock.calls[0][0];

    expect(addedNote.attachments).toEqual(attachments);
  });

  it('should create summary when raw text is long', async () => {
    const longText = 'A'.repeat(150);

    await processSmartNote(longText, { autoTracking: true });

    expect(noteStore.add).toHaveBeenCalledOnce();
    const addedNote = vi.mocked(noteStore.add).mock.calls[0][0];

    expect(addedNote.summary.length).toBeLessThan(longText.length);
    expect(addedNote.summary).toContain('...');
  });
});
