# Training Load Berechnung v1

Die Trainingslast ("DailyTrainingLoad") wird pro Tag je Nutzer*in berechnet und in
`users/{uid}/trainingLoad/{yyyy-MM-dd}` persistiert. Grundlage ist das Workout- und
Push-up-Tracking des Tages kombiniert mit dem manuellen Check-in.

## Check-in Modal (Erweitert)

Das Training Load Check-in Modal bietet folgende Funktionen:
- **Schlafqualität**: Bewertung von 1-10
- **Recovery**: Bewertung von 1-10
- **Krankheits-Status**: Toggle für Krankheit
- **Trainingsaktivitäten**: Dynamische Liste mit bis zu 5 Aktivitäten
  - Typ: Laufen, Radfahren, Krafttraining, HIIT, Mobilität, Sonstiges
  - Dauer in Minuten (>0)
  - Intensität: 1-10 Skala
- **Presets**: Vordefinierte Konfigurationen (z.B. "Lockerer Lauf", "Krafttraining", "Krankheit")
- **Live-Vorschau**: Echtzeit-Berechnung der Trainingslast mit Aufschlüsselung der Komponenten

## Eingangsdaten

| Parameter | Quelle | Beschreibung |
|-----------|--------|--------------|
| `workouts[]` | Tracking (`sports`) | Dauer in Minuten und Intensität (1–10) je Session |
| `pushupsReps` | Tracking (`pushups.total` oder Summe der Sets) | Gesamtzahl Liegestütze |
| `sleepScore` | Daily Check-in | Schlafbewertung 1–10 |
| `recoveryScore` | Daily Check-in | Recovery-Bewertung 1–10 |
| `sick` | Daily Check-in | Krank-Status (boolean) |

## Formel

1. **Basislast aus Workouts**

   ```ts
   const intensityFactor = (i: number) => 0.6 + 0.1 * clamp(i, 1, 10);
   const workoutLoad = sum(durationMinutes * intensityFactor(intensity));

   const pushupMinutes = pushupsReps * 0.015; // 0.15 Minuten pro 10 Wdh.
   const pushupLoad = pushupMinutes * 0.9;     // Pushups als konstante Intensität 0.9

   const baseFromWorkouts = workoutLoad + pushupLoad;
   ```

2. **Modifikatoren**

   ```ts
   const modifierSleep = 0.8 + 0.04 * sleepScore;      // 0.84 … 1.2
   const modifierRecovery = 0.7 + 0.03 * recoveryScore; // 0.73 … 1.0
   const modifierSick = sick ? 0.5 : 1.0;

   let load = baseFromWorkouts * modifierSleep * modifierRecovery * modifierSick;
   load = Math.round(clamp(load, 0, 1000));
   ```

3. **Persistierte Felder**

   ```ts
   DailyTrainingLoad = {
     date,
     load,
     components: {
       baseFromWorkouts,
       modifierSleep,
       modifierRecovery,
       modifierSick,
     },
     inputs: { sleepScore, recoveryScore, sick },
     calcVersion: 'v1',
     createdAt,
     updatedAt,
   };
   ```

## Beispiele

| Szenario | Workouts | Push-ups | Schlaf | Recovery | Krank | Resultat |
|----------|----------|----------|--------|----------|-------|----------|
| Basis | 45 min @ Intensität 6 | 0 | 5 | 5 | nein | ~41 |
| Erholt | 60 min @ Intensität 7 | 30 | 9 | 9 | nein | ~74 |
| Krank | 60 min @ Intensität 7 | 30 | 7 | 7 | ja | ~37 |
| Limit | 300 min @ Intensität 10 | 500 | 10 | 10 | nein | 1000 (Cap) |

## Grenzen & Hinweise

- Die Werte spiegeln subjektive Angaben wider; Anpassungen erfolgen nur über den Check-in.
- Workouts ohne Dauer oder Intensität fließen nicht ein.
- Die Last ist bei 1000 gedeckelt, um Ausreißer zu vermeiden.
- Änderungen an der Formel müssen über eine neue `calcVersion` erfolgen.
