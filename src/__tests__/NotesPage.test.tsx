import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotesPage from '../pages/NotesPage';
import { SmartNote } from '../types/events';

const storeState = vi.hoisted(() => ({
  notes: [] as SmartNote[],
  listeners: new Set<() => void>(),
}));

const noteStoreMock = vi.hoisted(() => {
  const emit = () => {
    for (const listener of storeState.listeners) {
      listener();
    }
  };

  return {
    async add(note: SmartNote) {
      storeState.notes = [note, ...storeState.notes];
      emit();
    },
    async update(id: string, patch: Partial<SmartNote>) {
      storeState.notes = storeState.notes.map((note) => (note.id === id ? { ...note, ...patch } : note));
      emit();
    },
    async list({ limit }: { limit?: number }) {
      const safeLimit = limit ?? 20;
      const slice = storeState.notes.slice(0, safeLimit);
      return { notes: slice, hasMore: storeState.notes.length > safeLimit };
    },
    async todayAggregates() {
      return {
        waterMl: 0,
        proteinG: 0,
        pushups: 0,
        workoutsBySport: {},
        isRestDay: false,
        lastWeightKg: undefined,
        lastBfpPercent: undefined,
      };
    },
    async getRecent() {
      return storeState.notes.slice(0, 5);
    },
    async get(id: string) {
      return storeState.notes.find((note) => note.id === id);
    },
    subscribe(listener: () => void) {
      storeState.listeners.add(listener);
      return () => storeState.listeners.delete(listener);
    },
  };
});

vi.mock('../store/noteStore', () => ({ noteStore: noteStoreMock }));

vi.mock('../features/notes/pipeline', () => {
  return {
    processSmartNote: vi.fn(
      async (raw: string, options?: { autoTracking?: boolean; attachments?: SmartNote['attachments'] }) => {
        const note: SmartNote = {
          id: `note-${Math.random().toString(16).slice(2)}`,
          ts: Date.now(),
          raw,
          summary: raw,
          events: [],
          pending: true,
          attachments: options?.attachments,
        };
        await noteStoreMock.add(note);
        setTimeout(() => {
          void noteStoreMock.update(note.id, {
            summary: `Processed: ${raw}`,
            pending: false,
          });
        }, 150);
        return { noteId: note.id };
      }
    ),
    retrySmartNote: vi.fn(),
  };
});

describe('NotesPage', () => {
  beforeEach(() => {
    storeState.notes = [];
    storeState.listeners.clear();
    localStorage.clear();
  });

  it('shows optimistic note and patches after processing', async () => {
    render(<NotesPage />);

    const input = screen.getByPlaceholderText('Kurz notieren…');
    await act(async () => {
      fireEvent.change(input, { target: { value: '20 Liegestütze, 500 ml Wasser, Proteinshake' } });
    });

    const submit = screen.getByRole('button', { name: 'Hinzufügen' });
    await act(async () => {
      fireEvent.click(submit);
    });

    expect(await screen.findByTitle('Wird verarbeitet')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Processed:/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTitle('Wird verarbeitet')).not.toBeInTheDocument();
    });
  });
});

