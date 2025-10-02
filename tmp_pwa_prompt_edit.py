from pathlib import Path
from textwrap import dedent

path = Path('src/components/PWAInstallPrompt.tsx')
text = path.read_text(encoding='utf-8')

text = text.replace('import { useState, useEffect } from \'react\';\n\ninterface BeforeInstallPromptEvent extends Event {\n  prompt: () => Promise<void>;\n  userChoice: Promise<{ outcome: \'accepted\' | \'dismissed\' }>;\n}\n\nfunction PWAInstallPrompt() {\n  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);\n  const [showPrompt, setShowPrompt] = useState(false);',
"import { useState, useEffect } from 'react';\nimport { useStore } from '../store/useStore';\n\nfunction PWAInstallPrompt() {\n  const pwaInstallPrompt = useStore((state) => state.pwaInstallPrompt);\n  const setPwaInstallPrompt = useStore((state) => state.setPwaInstallPrompt);\n  const [showPrompt, setShowPrompt] = useState(false);")

text = text.replace('(e: Event) => {\n      e.preventDefault();\n      setDeferredPrompt(e as BeforeInstallPromptEvent);\n      setShowPrompt(true);',
"(e: Event) => {\n      e.preventDefault();\n      setPwaInstallPrompt(e as any);\n      setShowPrompt(true);")

text = text.replace('    window.addEventListener(\'beforeinstallprompt\', handler);', "    window.addEventListener('beforeinstallprompt', handler as EventListener);")

text = text.replace('    return () => window.removeEventListener(\'beforeinstallprompt\', handler);', "    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);")

text = text.replace('    if (!deferredPrompt) return;\n\n    deferredPrompt.prompt();\n    const { outcome } = await deferredPrompt.userChoice;\n\n    if (outcome === \'accepted\') {\n      console.log('✅ User accepted PWA install');\n    } else {\n      console.log('⚠️ User dismissed PWA install');\n    }\n\n    setDeferredPrompt(null);\n    setShowPrompt(false);',
"    if (!pwaInstallPrompt) return;\n\n    setShowPrompt(false);\n    await pwaInstallPrompt.prompt();\n    const { outcome } = await pwaInstallPrompt.userChoice;\n\n    if (outcome === 'accepted') {\n      console.log('✅ User accepted PWA install');\n      setPwaInstallPrompt(null);\n    } else {\n      console.log('⚠️ User dismissed PWA install');\n      setPwaInstallPrompt(pwaInstallPrompt);\n    }")

text = text.replace('    setShowPrompt(false);\n    // Show again after 7 days\n    localStorage.setItem(\'pwa-install-dismissed\', Date.now().toString());',
"    setShowPrompt(false);\n    localStorage.setItem('pwa-install-dismissed', Date.now().toString());")

text = text.replace('    const dismissed = localStorage.getItem(\'pwa-install-dismissed\');\n    if (dismissed) {\n      const dismissedTime = parseInt(dismissed);\n      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);\n      if (daysSinceDismissed < 7) {\n        setShowPrompt(false);\n      }\n    }\n  }, []);',
"    const dismissed = localStorage.getItem('pwa-install-dismissed');\n    if (dismissed) {\n      const dismissedTime = parseInt(dismissed, 10);\n      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);\n      if (daysSinceDismissed < 7) {\n        setShowPrompt(false);\n      }\n    }\n  }, []);")

text = text.replace('  if (!showPrompt) return null;',
"  useEffect(() => {\n    if (pwaInstallPrompt) {\n      const dismissed = localStorage.getItem('pwa-install-dismissed');\n      if (!dismissed) {\n        setShowPrompt(true);\n      }\n    }\n  }, [pwaInstallPrompt]);\n\n  if (!showPrompt || !pwaInstallPrompt) return null;")

path.write_text(text, encoding='utf-8')
