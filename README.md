# stepup-wordbank-content
=======
# Step Up — Wordbank (Content Words)

Banco **solo de palabras de contenido** (contenido léxico) para *Inglés desde cero*.

## Archivos
- `data/wordbank_content.json`: banco minimalista (id, en, es, example_en)
- `data/topics.json` (opcional): lista de temas (si se incluyó en el CSV)
- `data/topic_map.json` (opcional): ids por tema
- `tests/test_blueprints.json`: ideas de tipos de evaluación (plantillas)

## Filosofía
Este repo es **minimalista**: se alimenta ocasionalmente y se usa para generar tests y seguimiento.
Las palabras de función van en un repo aparte.

git add README.md
git commit -m "Document CSV as source of truth"
git push
