import { useCallback, useEffect, useRef, useState } from 'react';

type OptimisticReducer<State, Update> = (state: State, update: Update) => State;

type OptimisticReturn<State, Update> = readonly [State, (update: Update) => void];

export function useOptimistic<State, Update>(
  state: State,
  reducer: OptimisticReducer<State, Update>,
): OptimisticReturn<State, Update> {
  const [optimisticState, setOptimisticState] = useState(state);
  const baseRef = useRef(state);

  useEffect(() => {
    if (baseRef.current !== state) {
      baseRef.current = state;
      setOptimisticState(state);
    }
  }, [state]);

  const applyUpdate = useCallback(
    (update: Update) => {
      setOptimisticState((current) => reducer(current, update));
    },
    [reducer],
  );

  return [optimisticState, applyUpdate];
}
