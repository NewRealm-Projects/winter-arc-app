from pathlib import Path
path = Path('src/pages/SettingsPage.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace("import { useEffect, useRef, useState } from 'react';", "import { useEffect, useMemo, useRef, useState } from 'react';", 1)
path.write_text(text, encoding='utf-8')
