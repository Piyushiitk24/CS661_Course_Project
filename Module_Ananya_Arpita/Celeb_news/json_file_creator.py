import pandas as pd
from collections import defaultdict
import json
import os
import spacy

# Load SpaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm")
    raise

# Load dataset
try:
    df = pd.read_csv(r"C:\Users\user\CS661_Course_Project\data\master_dataset.csv")
    print("Dataset loaded successfully.")
except FileNotFoundError:
    raise FileNotFoundError("The dataset file 'master_dataset.csv' was not found. Please check the file path.")

# Ensure required columns exist
required_columns = ['clean_title', 'tweet_count', 'news_url', 'source', 'type']
missing_columns = [col for col in required_columns if col not in df.columns]
if missing_columns:
    raise ValueError(f"The following required columns are missing from the dataset: {missing_columns}")

# Drop rows with missing values in required columns
df = df.dropna(subset=['clean_title', 'tweet_count', 'news_url', 'source', 'type'])
if df.empty:
    raise ValueError("The dataset is empty after filtering. Please check the data.")

# Filter rows containing 'selena gomez', 'selena', or 'gomez'
selena_df = df[df['clean_title'].str.contains(r'\b(selena gomez|selena|gomez)\b', case=False, na=False, regex=True)]
print(f"Number of rows after filtering for Selena Gomez: {len(selena_df)}")

# Initialize noun tweet count and URL dictionary
noun_data_dict = defaultdict(lambda: {"count": 0, "urls": []})

# Iterate and extract nouns
for _, row in selena_df.iterrows():
    text = row['clean_title']
    tweet_count = row['tweet_count'] if not pd.isna(row['tweet_count']) else 0
    news_url = row['news_url']
    source = row['source']
    url_type = row['type']  # Extract the type (e.g., fake/real)

    if pd.isna(text):
        continue

    doc = nlp(text)

    for token in doc:
        if token.pos_ == "NOUN":
            noun = token.lemma_.lower()
            if noun not in {"selena", "gomez"}:  # Skip target name
                noun_data_dict[noun]["count"] += tweet_count
                # Add URL, source, and type as a dictionary
                noun_data_dict[noun]["urls"].append({
                    "url": news_url,
                    "source": source,
                    "type": url_type
                })

# Convert data to JSON serializable format, excluding nouns with count < 50
noun_data = [
    {"noun": noun, "count": data["count"], "urls": data["urls"]}
    for noun, data in noun_data_dict.items()
    if data["count"] >= 50  # Only include nouns with count >= 50
]

output_dir = os.path.join(os.getcwd(), "celeb_json")
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "selena.json")

try:
    with open(output_file, "w") as f:
        json.dump(noun_data, f, indent=2)
    print(f"Output saved to {output_file}")
except IOError as e:
    print(f"Error writing to file {output_file}: {e}")

# Preview a few
for noun_entry in noun_data[:10]:
    print(f"{noun_entry['noun']}: {noun_entry['count']} URLs: {noun_entry['urls']}")