# Real-model semantic retrieval observations

AI-generated test notes, not the student's required README wording.

Tested on the default deterministic **1000-movie CMU subset, seed 113**, using Chroma 1.5.9 and local ONNX all-MiniLM-L6-v2. No user additions, preferences, or watched exclusions were present. Repeat with the same dataset/settings; changed data can change rankings.

## Example 1: memory loss described with different words

```bash
python -m movie_mood search "An amnesiac piecing together their identity"
```

Observed rank **1**: **Man in the Dark**, ID `cmu:7641358`.

Its source plot describes a freed prisoner whose surgery erases his memory, followed by a struggle over hidden money and his former associates. None of the query's words appear in this stored plot, case-insensitively. The model connects “amnesiac” with lost memory and the question of remembering one's past, rather than matching literal words. The identity element is an interpretation of the premise, not a verified description of every scene.

## Example 2: confinement and horror described as a feeling

```bash
python -m movie_mood search "A claustrophobic nightmare"
```

Observed rank **2**: **Dr. Moreau's House of Pain**, ID `cmu:26007286`.

Its short plot describes friends trapped in a house at the mercy of a strange doctor and his creations. Neither “claustrophobic” nor “nightmare” appears anywhere in its stored plot. The only shared query word is the article “a.” Literal keyword matching cannot connect those content words to the confinement/horror premise.

This is not claimed to be the first result: **Büyü** ranked first, and the third result, **Somewhere in Dreamland**, is a weaker fit. This illustrates why the app provides source evidence instead of claiming every recommendation is correct.

## Check the full source plots yourself

```bash
python -m movie_mood show cmu:7641358
python -m movie_mood show cmu:26007286
```

A word-overlap test checks exact tokens, not all word stems or synonyms. The first example had no token overlap; the second had only “a.” Human inspection is still necessary to judge semantic relevance.

## An idea that did not work well

The planned query “Someone discovers that their surroundings were manufactured” did not convincingly find the intended constructed-reality theme in this random sample. It returned a computer invention plot instead. Do not use it as a successful assignment demonstration. Likewise, “An unlikely friendship on a long journey” returned relationship stories that did not consistently capture the journey theme.

## Your assignment

Run these yourself, inspect their source text, and write the required README explanation in your own words. Demonstrate at least one verified example in your video. Choose your own examples if these do not reflect what you want to show.
