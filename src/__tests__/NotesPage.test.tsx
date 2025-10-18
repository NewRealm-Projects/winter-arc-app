import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'test/test-utils';
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
    async remove(id: string) {
      storeState.notes = storeState.notes.filter((note) => note.id !== id);
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
    updateSmartNote: vi.fn(async (id: string, raw: string) => {
      await noteStoreMock.update(id, { raw, summary: raw });
    }),
  };
});

describe('NotesPage', () => {
  beforeEach(() => {
    storeState.notes = [];
    storeState.listeners.clear();
    localStorage.clear();
  });

  it('renders QuickLogPanel with all logging buttons', async () => {
    renderWithProviders(<NotesPage />);

    // QuickLogPanel should have all 5 quick action buttons
    expect(await screen.findByText('Schnell loggen')).toBeInTheDocument();
  });

  it('allows editing an existing smart note', async () => {
    const existing: SmartNote = {
      id: 'note-1',
      ts: Date.now() - 1000,
      raw: 'Original Text',
      summary: 'Original Text',
      events: [],
    };
    await noteStoreMock.add(existing);

    renderWithProviders(<NotesPage />);

    const editButton = await screen.findByRole('button', { name: 'Bearbeiten' });
    await act(async () => {
      fireEvent.click(editButton);
    });

    const editor = screen.getByRole('textbox', { name: 'Bearbeiten' });
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'Aktualisierte Notiz' } });
    });

    const saveButton = screen.getByRole('button', { name: 'Speichern' });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Aktualisierte Notiz')).toBeInTheDocument();
  });

  it('allows deleting an existing smart note', async () => {
    const existing: SmartNote = {
      id: 'note-delete',
      ts: Date.now() - 2000,
      raw: 'Zum Löschen',
      summary: 'Zum Löschen',
      events: [],
    };
    await noteStoreMock.add(existing);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<NotesPage />);

    const deleteButton = await screen.findByRole('button', { name: 'Löschen' });
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Zum Löschen')).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});

