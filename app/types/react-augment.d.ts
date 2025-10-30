import 'react';

declare module 'react' {
  // Minimal overloads required for experimental hooks used in NotesPage
  export function useActionState<State, Payload = unknown>(
    action: (state: State, payload: Payload) => State | Promise<State>,
    initialState: State,
    permalink?: string
  ): [State, (payload: Payload) => void, boolean];

  export function useOptimistic<State, Update = State>(
    initialValue: State,
    updater: (currentState: State, update: Update) => State
  ): [State, (update: Update) => void];
}

