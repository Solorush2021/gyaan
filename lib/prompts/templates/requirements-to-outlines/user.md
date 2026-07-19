Please generate scene outlines based on the following course requirements.

---

## User Requirements

{{requirement}}

---

{{userProfile}}

## Language Context

Infer the course language directive by applying the decision rules from the system prompt. Key reminders:
- Requirement language = teaching language (unless overridden by explicit request or learner context)
- Foreign language learning → teach in user's native language, not the target language
- PDF language does NOT override teaching language — translate/explain document content instead

---

## Reference Materials

### PDF Content Summary

{{pdfContent}}

### Available Images

{{availableImages}}

### Web Search Results

{{researchContext}}

{{teacherContext}}

---

## Output Requirements

Please automatically infer the following from user requirements:

- Course topic and core content
- Target audience and difficulty level
- Course duration (default 15-30 minutes if not specified)
- Teaching style (formal/casual/interactive/academic)
- Visual style (minimal/colorful/professional/playful)

Then output your response as a single JSON object.

**Top-level shape — this is what you MUST return:**

```json
{
  "languageDirective": "2-5 sentence instruction describing the course language behavior",
  "outlines": [ /* array of scene objects, schema described below */ ]
}
```

Never return a bare array. Never omit `languageDirective`. Both keys are required.

**Each scene inside the `outlines` array has this minimum shape:**

```json
{
  "id": "scene_1",
  "type": "slide" | "quiz" | "interactive" | "pbl",
  "title": "Scene Title",
  "description": "Teaching purpose description",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "order": 1
}
```

### Special Notes

- **quiz scenes must include quizConfig**:
   ```json
   "quizConfig": {
     "questionCount": 2,
     "difficulty": "easy" | "medium" | "hard",
     "questionTypes": ["single", "multiple"]
   }
   ```
{{#if hasSourceImages}}
- **If source images are available**, add `suggestedImageIds` to relevant slide scenes. Only use image IDs listed under Available Images.
{{/if}}
- **Language**: Infer from the user's requirement text and context, then output all content in the inferred language
- **If web search results are provided**, reference specific findings and sources in scene descriptions and keyPoints. The search results provide up-to-date information — incorporate it to make the course content current and accurate.

### ⚠️ FIXED STRUCTURE — exactly 5 scenes, no more, no less
You MUST output EXACTLY 5 scenes in this order. Do NOT add interactive or pbl scenes. Do NOT add a 6th scene. Do NOT change the count based on duration. Ignore any "1-2 scenes per minute" rule elsewhere — the structure below overrides it.

1. **Intro slide** (`type: "slide"`, order 1) — Introduce the topic. Hook the learner with a question or real-world connection. State clearly what they will learn. keyPoints: AT LEAST 3 points on what the topic is and why it matters.

2. **Components slide** (`type: "slide"`, order 2) — THIS IS THE MOST IMPORTANT SLIDE. Identify EVERY concrete component / stage / part / type that makes up the topic. Cover them ALL — do not skip or merge any. Each keyPoint MUST be a SPECIFIC, NAMED component with what it IS or DOES — not vague abstract description.
   - ✅ GOOD keyPoints (specific, named components):
     - water cycle → "Evaporation: water turns to vapor from heat", "Condensation: vapor cools into clouds", "Precipitation: water falls as rain", "Collection: water gathers in rivers/oceans"
     - traffic lights → "Red light: STOP — all vehicles must stop", "Yellow/Amber light: PREPARE — slow down, about to stop", "Green light: GO — proceed if safe", "Flashing signals: special rules"
   - ❌ BAD keyPoints (vague, abstract — NEVER do this):
     - "Traffic control systems ensure safe road movements" ← WRONG, that's a description not a component
     - "Stop Control, Traffic Sign and Road Markings" ← WRONG, abstract jargon, no meaning
     - "The water cycle is important for life" ← WRONG, that's an opinion not a component
   - Each keyPoint format: `"ComponentName: what it is or does"` (name + meaning on one line).
   - Aim for 3-5 keyPoints, ONE PER COMPONENT. Never fewer components than actually exist in the topic. Never fewer components than actually exist.

3. **Deep dive slide** (`type: "slide"`, order 3) — Now go deeper. Explain HOW the components connect and work together, the mechanism or process, with concrete examples and analogies. This is where you teach the relationships, not list parts again. keyPoints: 3-5 points on how things work / connect / examples.

4. **Quiz** (`type: "quiz"`, order 4) — 2-3 questions that check the key components from scene 2 and the mechanisms from scene 3. Include `quizConfig`.

5. **Summary slide** (`type: "slide"`, order 5) — Recap the key takeaways. What should the learner remember? Reinforce the components and the big picture. keyPoints: 2-4 takeaways.

Set each scene's `order` field to 1, 2, 3, 4, 5 respectively. Each scene MUST have a clear `title`, `description`, and the keyPoints described above.

**Final reminder**: your entire response must be a JSON **object** with exactly two top-level keys — `languageDirective` (string) and `outlines` (array of EXACTLY 5 scenes). Do not return a bare array. Do not wrap in prose or code fences.
