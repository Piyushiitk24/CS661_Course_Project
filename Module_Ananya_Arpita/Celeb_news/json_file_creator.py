import pandas as pd
from collections import defaultdict
import json
import os # Make sure os is imported at the top
import spacy

# Load SpaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm")
    raise

# Load dataset
# Delete the old df = pd.read_csv(...) line

# Add these lines:
base_dir_script = os.path.dirname(__file__)
# Go up from Celeb_news -> Module_Ananya_Arpita -> CS661_Course_Project -> then into data
data_path_script = os.path.join(base_dir_script, "..", "..", "data", "master_dataset.csv")
try:
    df = pd.read_csv(data_path_script)
    print("Dataset loaded successfully in json_file_creator.")
except FileNotFoundError:
     print(f"Error: Could not find master_dataset.csv at expected path: {data_path_script}")
     raise # Stop the script if data isn't found

# Check required columns
required_columns = ['clean_title', 'tweet_count', 'news_url', 'source', 'type']
missing_columns = [col for col in required_columns if col not in df.columns]
if missing_columns:
    raise ValueError(f"The following required columns are missing from the dataset: {missing_columns}")

# Drop rows with missing values in required columns
df = df.dropna(subset=required_columns)
if df.empty:
    raise ValueError("The dataset is empty after filtering. Please check the data.")

# Function to extract and save noun-based JSON for a celebrity
def process_celebrity_data(df, celeb_name, output_filename):
    # Regex-safe filtering
    celeb_pattern = rf'\b({celeb_name.lower().replace(" ", "|")})\b'
    filtered_df = df[df['clean_title'].str.contains(celeb_pattern, case=False, na=False, regex=True)]
    print(f"Number of rows after filtering for {celeb_name.title()}: {len(filtered_df)}")

    noun_data_dict = defaultdict(lambda: {"count": 0, "urls": []})

    for _, row in filtered_df.iterrows():
        doc = nlp(row['clean_title'])
        tweet_count = row['tweet_count'] if not pd.isna(row['tweet_count']) else 0

        for token in doc:
            if token.pos_ == "NOUN":
                noun = token.lemma_.lower()
                if noun not in celeb_name.lower().split():  # skip parts of celeb name
                    noun_data_dict[noun]["count"] += tweet_count
                    noun_data_dict[noun]["urls"].append({
                        "url": row['news_url'],
                        "source": row['source'],
                        "type": row['type']
                    })

    # Serialize nouns with count >= 50
    noun_data = [
        {"noun": noun, "count": data["count"], "urls": data["urls"]}
        for noun, data in noun_data_dict.items()
        if data["count"] >= 50
    ]

    # Save to JSON
    # Save within the Celeb_news directory in a celeb_json subfolder
    output_dir = os.path.join(base_dir_script, "celeb_json")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, output_filename)

    try:
        with open(output_path, "w") as f:
            json.dump(noun_data, f, indent=2)
        print(f"Output saved to {output_path}")
    except IOError as e:
        print(f"Error writing to file {output_path}: {e}")

    # Preview a few
    # print("Preview of generated data:")
    # for entry in noun_data[:5]:
    #     print(f"  Noun: {entry['noun']}, Count: {entry['count']}, URLs: {len(entry['urls'])}")

# List of celebrities to process
celebrities = [
    "selena gomez", "kylie jenner", "kim kardashian", "taylor swift",
    "donald trump", "joe biden", "barack obama", "michelle obama",
    "elon musk", "jeff bezos"
]

# Process each celebrity
for celeb in celebrities:
    filename = f"{celeb.replace(' ', '_')}.json"
    print(f"\nProcessing {celeb.title()}...")
    process_celebrity_data(df, celeb, filename)

print("\nJSON file creation process completed.")
