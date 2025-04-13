# Markdown Formatting Guide

## Headings
- `# Heading 1`
- `## Heading 2`
- `### Heading 3`
- `#### Heading 4`
- `##### Heading 5`
- `###### Heading 6`

## Text Formatting
- **Bold**: `**text**` or `__text__`
- *Italic*: `*text*` or `_text_`
- ~~Strikethrough~~: `~~text~~`
- **_Bold and Italic_**: `***text***`

## Lists
- **Unordered List**: 
    - `- Item`
    - `* Item`
- **Ordered List**: 
    - `1. Item`
    - `2. Item`

## Links
- `[Link Text](URL)`

## Images
- `![Alt Text](Image URL)`

## Blockquotes
- `> Blockquote`

## Code
- Inline Code: `` `code` ``
- Code Block:
    ````
    ```
    Code
    ```
    ````

## Horizontal Rule
- `---` or `***` or `___`

## Tables
```
| Header 1 | Header 2 |
|----------|----------|
| Content  | Content  |
```

## Task Lists
- `[ ] Task`
- `[x] Completed Task`

## Escaping Characters
- Use `\` before special characters (e.g., `\*`).

## Footnotes
- `[^1]` for reference and `[^1]: Footnote text` for definition.

## Emojis
- Use `:emoji_name:` (e.g., `:smile:`).

## HTML Support
- `<b>Bold</b>` or `<i>Italic</i>` for inline HTML.


## Missing values
- 1246/22140 Gossipcop rows have missing tweet_ids.
- 255/1056 Politifact rows have missing tweet_ids.

## Feature Engineering: Creating new, useful columns from the raw data, such as:
- date: Extracting usable datetime objects.
- domain: Parsing the news URL.
- domain_type: Categorizing the domain.
- clean_title: Preparing text for analysis.
- sentiment: Calculating sentiment score.