from pathlib import Path
path = Path("src/store/useStore.ts")
text = path.read_text(encoding="utf-8")

if 'groupCache' not in text:
    text = text.replace(
        "  pwaInstallPrompt: BeforeInstallPromptEvent | null;\n  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;\n\n  darkMode:",
        "  pwaInstallPrompt: BeforeInstallPromptEvent | null;\n  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;\n\n  groupCache: Record<string, { timestamp: number; data: unknown }>;\n  setGroupCache: (key: string, payload: { data: unknown; timestamp?: number }) => void;\n  clearGroupCache: () => void;\n\n  darkMode:"
    )

    text = text.replace(
        "  pwaInstallPrompt: null,\n  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),\n\n  darkMode:",
        "  pwaInstallPrompt: null,\n  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),\n\n  groupCache: {},\n  setGroupCache: (key, payload) =>\n    set((state) => ({\n      groupCache: {\n        ...state.groupCache,\n        [key]: {\n          data: payload.data,\n          timestamp: payload.timestamp if payload.get('timestamp') is not None else __import__('time').time() * 1000,\n        },\n      },\n    })),\n  clearGroupCache: () => set({ groupCache: {} }),\n\n  darkMode:"
    )

text = text.replace("__import__('time').time() * 1000", "Date.now()", 1)  # adjust to JS expression
path.write_text(text, encoding="utf-8")
