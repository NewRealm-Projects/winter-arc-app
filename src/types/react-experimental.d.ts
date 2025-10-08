import 'react'

declare module 'react' {
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS {
    experimentalFormAction?: (formData: FormData, event?: unknown) => void | Promise<void>
  }

  export function useActionState<State, Payload = void>(
    action: (
      state: State,
      payload: Payload,
      event?: unknown,
    ) => State | Promise<State>,
    initialState: State,
    permalink?: string,
  ): [State, (payload: Payload, event?: unknown) => void, boolean]

  export function useOptimistic<State, Update = State>(
    state: State,
    updateFn?: (state: State, update: Update) => State,
  ): [State, (update: Update) => void]

}
