import pandas as pd
from collections import Counter
from textblob import TextBlob
from wordcloud import STOPWORDS
import re
from urllib.parse import urlparse
import numpy as np
import sys

TWITTER_EPOCH = 1288834974657
DEFAULT_STOPWORDS = STOPWORDS.union({'report', 'reports', 'says', 'sources', 'source'})

def get_timestamp_ms_from_tweet_id(tweet_id):
    """Attempts to extract the timestamp from a Twitter Snowflake ID."""
    try:
        tweet_id_int = int(tweet_id)
        # Basic check for potential Snowflake ID range
        if tweet_id_int < 0 or tweet_id_int > (1 << 63) - 1:
             return None
        return (tweet_id_int >> 22) + TWITTER_EPOCH
    except (ValueError, TypeError, OverflowError):
        # Catches non-numeric IDs, None, or IDs too large
        return None

def get_datetime_from_tweet_id_string(tweet_id_string):
    """
    Extracts the datetime from the *first* valid tweet ID in a space-separated string.
    Returns None if no valid ID is found or the input is invalid.
    """
    if pd.isna(tweet_id_string) or not isinstance(tweet_id_string, str):
        return None
    try:
        # Split by any whitespace and filter out empty strings
        ids = [tid for tid in tweet_id_string.split() if tid]
        if not ids:
            return None

        # Try to find the first valid timestamp
        timestamp_ms = None
        for potential_id in ids:
            timestamp_ms = get_timestamp_ms_from_tweet_id(potential_id)
            if timestamp_ms is not None:
                break # Use the first valid one

        if timestamp_ms is None:
            return None

        # Convert timestamp to datetime, coercing errors to NaT
        dt = pd.to_datetime(timestamp_ms / 1000, unit='s', errors='coerce')
        if pd.isna(dt):
             return None
        return dt
    except Exception as e:
        # Catch any other unexpected errors during processing
        print(f"Error in get_datetime_from_tweet_id_string for input '{tweet_id_string}': {e}", file=sys.stderr)
        return None


def clean_text(text):
    """Lowercase, remove non-alphabetic chars, and remove stopwords."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z ]', '', text)
    return ' '.join(word for word in text.split() if word not in DEFAULT_STOPWORDS)

def calculate_sentiment(text):
    """Calculate sentiment polarity using TextBlob."""
    if not isinstance(text, str):
        return 0.0
    return TextBlob(text).sentiment.polarity

def extract_domain(url):
    """Extracts the domain name from a URL, removing 'www.' prefix."""
    if not isinstance(url, str):
        return None
    # Handle cases like 'www.domain.com/path' which urlparse might misinterpret without scheme
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url # Add a default scheme
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        # Remove 'www.' prefix if present
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain if domain else None # Return None if domain is empty
    except Exception as e:
        print(f"Error parsing URL '{url}': {e}", file=sys.stderr)
        return None


def categorize_domain(domain):
    """Categorizes a domain into broad types."""
    if not domain:
        return 'other'
    domain = domain.lower()
    # More specific news checks first
    if any(d in domain for d in ['cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com', 'reuters.com', 'apnews.com', 'theguardian.com', 'wsj.com']):
        return 'news_major'
    elif any(x in domain for x in ['news', 'times', 'post', 'daily', 'report', 'today', 'chronicle', 'herald', 'tribune', 'journal', 'observer', 'press', 'wire']):
        return 'news_other'
    # Social Media
    elif any(d in domain for d in ['twitter.com', 'facebook.com', 'instagram.com', 'reddit.com', 't.co', 'fb.me']):
        return 'social_media'
    # Blogs
    elif any(x in domain for x in ['blog', 'wordpress', 'medium', 'blogspot', 'tumblr']):
        return 'blog'
    # Wiki
    elif 'wikipedia.org' in domain:
        return 'wiki'
    # Specific known sites from sample data
    elif any(d in domain for d in ['dailymail.co.uk', 'hollywoodlife.com', 'variety.com', 'refinery29.com', 'brides.com', 'speedtalk.com', 'politics2020.info', 'nscdscamps.org', 'howafrica.com', 'nfib-sbet.org', 'cq.com']):
         return 'specific_source'
    # Government/Org
    elif any(x in domain for x in ['.gov', '.org', '.edu']):
         return 'gov_org_edu'
    return 'other'


def get_word_frequency_data(df_filtered, min_freq=5, top_n=100):
    """Calculates word frequencies and log2 ratio for fake vs real news titles."""
    fake_df = df_filtered[df_filtered['type'] == 'fake']
    real_df = df_filtered[df_filtered['type'] == 'real']
    fake_words = ' '.join(fake_df['clean_title'].astype(str).dropna()).split()
    real_words = ' '.join(real_df['clean_title'].astype(str).dropna()).split()
    fake_freq = Counter(fake_words)
    real_freq = Counter(real_words)
    all_words = set(fake_freq.keys()).union(real_freq.keys())
    word_data = []
    for word in all_words:
        f_freq = fake_freq.get(word, 0)
        r_freq = real_freq.get(word, 0)
        total_freq = f_freq + r_freq
        if total_freq < min_freq:
            continue
        # Adjusted ratio calculation with add-1 smoothing
        if f_freq > 0 and r_freq > 0:
            ratio = np.log2((f_freq + 1) / (r_freq + 1))
        elif f_freq > 0:
            ratio = 3 # Assign a high positive value if only fake
        elif r_freq > 0:
            ratio = -3 # Assign a high negative value if only real
        else:
            ratio = 0

        word_data.append({'text': word, 'total_freq': total_freq, 'fake_freq': f_freq, 'real_freq': r_freq, 'log2_ratio': ratio})

    # Sort by total frequency and take top N
    word_data.sort(key=lambda x: x['total_freq'], reverse=True)
    return word_data[:top_n]


def load_and_prepare_data():
    """Loads data from CSVs, performs cleaning, date extraction, and feature engineering."""
    print("Loading and preparing data...")
    data_folder = 'data/' # Define base path for data files
    try:
        df_fake_gossip = pd.read_csv(data_folder + 'gossipcop_fake.csv')
        df_fake_gossip['source'] = 'gossipcop'
        df_real_gossip = pd.read_csv(data_folder + 'gossipcop_real.csv')
        df_real_gossip['source'] = 'gossipcop'
        df_fake_politi = pd.read_csv(data_folder + 'politifact_fake.csv')
        df_fake_politi['source'] = 'politifact'
        df_real_politi = pd.read_csv(data_folder + 'politifact_real.csv')
        df_real_politi['source'] = 'politifact'
    except FileNotFoundError as e:
        print(f"Error loading file: {e}. Ensure CSV files are in the '{data_folder}' subfolder.", file=sys.stderr)
        sys.exit(1) # Exit if data can't be loaded

    required_cols = ['title', 'tweet_ids', 'news_url']
    all_dfs = [df_fake_gossip, df_real_gossip, df_fake_politi, df_real_politi]
    df_names = ['gossipcop_fake', 'gossipcop_real', 'politifact_fake', 'politifact_real']

    # Check for required columns and assign 'type'
    valid_dfs = []
    for df_check, name in zip(all_dfs, df_names):
        missing_cols = [col for col in required_cols if col not in df_check.columns]
        if missing_cols:
            print(f"Error: Column(s) '{', '.join(missing_cols)}' missing in {name}.csv. Skipping this file.", file=sys.stderr)
        else:
            if 'fake' in name:
                df_check['type'] = 'fake'
            elif 'real' in name:
                df_check['type'] = 'real'
            else:
                print(f"Warning: Could not determine type for {name}.csv", file=sys.stderr)
                df_check['type'] = 'unknown'
            valid_dfs.append(df_check)

    if not valid_dfs:
        print("Error: No valid dataframes loaded. Exiting.", file=sys.stderr)
        sys.exit(1)

    df = pd.concat(valid_dfs, ignore_index=True)
    print(f"\n--- Initial Data State ---")
    print(f"Total rows loaded: {len(df)}")
    print("Initial source distribution:")
    print(df['source'].value_counts(dropna=False))
    print("--------------------------\n")

    # --- Date Conversion ---
    print("Attempting date conversion from 'tweet_ids'...")
    df['date_raw'] = df['tweet_ids'].apply(get_datetime_from_tweet_id_string)
    df['date'] = pd.to_datetime(df['date_raw'], errors='coerce')

    # Identify rows where date conversion failed
    failed_date_mask = df['date'].isna()
    num_failed = failed_date_mask.sum()
    print(f"\n--- Date Conversion Results ---")
    print(f"Number of rows where date conversion failed (resulted in NaT): {num_failed}")

    if num_failed > 0:
        print("\nSample of rows that failed date conversion (showing tweet_ids and source):")
        sample_failed = df.loc[failed_date_mask, ['tweet_ids', 'source', 'title']].head(20)
        print(sample_failed.to_string())

        print("\nSource distribution for rows that FAILED date conversion:")
        print(df.loc[failed_date_mask, 'source'].value_counts(dropna=False))
    print("-------------------------------\n")
    # --- End Date Conversion ---


    initial_rows = len(df)
    counts_before_drop = df['source'].value_counts(dropna=False)

    # Drop rows where the final 'date' column is NaT
    df = df.dropna(subset=['date'])
    rows_dropped = initial_rows - len(df)

    print(f"\n--- After Dropping NaT Dates ---")
    print(f"Removed {rows_dropped} rows due to missing/invalid dates (NaT in 'date' column).")

    counts_after_drop = df['source'].value_counts(dropna=False)

    print("\nSource distribution BEFORE dropping NaT dates:")
    print(counts_before_drop)
    print("\nSource distribution AFTER dropping NaT dates:")
    print(counts_after_drop)

    # Calculate and print the difference
    print("\nDifference in counts (Before - After):")
    diff = counts_before_drop.subtract(counts_after_drop, fill_value=0)
    print(diff[diff != 0]) # Show only sources where rows were dropped
    print("-----------------------------\n")

    # --- Feature Engineering ---
    print("Extracting domain and cleaning text...")
    df['domain'] = df['news_url'].apply(extract_domain)
    df['domain_type'] = df['domain'].apply(categorize_domain)
    df['clean_title'] = df['title'].astype(str).apply(clean_text)
    df['sentiment'] = df['title'].astype(str).apply(calculate_sentiment)

    # Drop the intermediate raw date column
    if 'date_raw' in df.columns:
        df = df.drop(columns=['date_raw'])

    print(f"\nFinal DataFrame shape: {df.shape}")
    print("Data preparation complete.")

    # --- Save Processed Data ---
    try:
        output_filename = 'combined_data_processed.csv'
        df.to_csv(output_filename, index=False)
        print(f"Fully processed data saved to {output_filename}")
    except Exception as e:
        print(f"Error saving processed data to CSV: {e}", file=sys.stderr)

    return df

# --- Example usage when running this file directly ---
if __name__ == '__main__':
    try:
        prepared_df = load_and_prepare_data()
        print("\nSample of prepared data:")
        print(prepared_df.head())
        print("\nData types:")
        print(prepared_df.info())
        print("\nDate range per source (after cleaning):")
        if not prepared_df.empty:
             print(prepared_df.groupby('source')['date'].agg(['min', 'max', 'count']))
        else:
             print("Prepared DataFrame is empty.")

    except SystemExit:
        print("\nExited due to errors during data loading/preparation.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")