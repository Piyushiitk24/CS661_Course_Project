from flask import Flask, render_template, request, jsonify
import pandas as pd
import helpers

app = Flask(__name__, template_folder='templates', static_folder='static')

# Load data once at startup
df_full = helpers.load_and_prepare_data()
ACTUAL_MIN_YEAR = df_full['date'].dt.year.min() if not df_full.empty else 2010
ACTUAL_MAX_YEAR = df_full['date'].dt.year.max() if not df_full.empty else 2023
DOMAIN_TYPES = ['all'] + sorted([dt for dt in df_full['domain_type'].unique() if pd.notna(dt)])

@app.route('/')
def index():
    return render_template('index.html',
                           min_year=ACTUAL_MIN_YEAR,
                           max_year=ACTUAL_MAX_YEAR,
                           domain_types=DOMAIN_TYPES)

@app.route('/api/word-data')
def get_word_data():
    try:
        source = request.args.get('source', 'both')
        news_type = request.args.get('type', 'both')
        sentiment = request.args.get('sentiment', 'all')
        min_freq = request.args.get('min_freq', 5, type=int)

        df_filtered = df_full.copy()
        if source != 'both':
            df_filtered = df_filtered[df_filtered['source'] == source]
        if news_type != 'both':
            df_filtered = df_filtered[df_filtered['type'] == news_type]
        if sentiment == 'negative':
            df_filtered = df_filtered[df_filtered['sentiment'] < 0]
        elif sentiment == 'neutral':
            df_filtered = df_filtered[df_filtered['sentiment'] == 0]
        elif sentiment == 'positive':
            df_filtered = df_filtered[df_filtered['sentiment'] > 0]

        print(f"Word data rows after filtering: {len(df_filtered)}")
        word_data = helpers.get_word_frequency_data(df_filtered, min_freq=min_freq, top_n=150)
        print(f"Word data items: {len(word_data)}")
        return jsonify(word_data)
    except Exception as e:
        print(f"--- ERROR in /api/word-data ---")
        import traceback
        traceback.print_exc()
        print(f"--- End Error Traceback ---")
        return jsonify({"error": "Internal server error processing word data", "details": str(e)}), 500

@app.route('/api/heatmap-data')
def get_heatmap_data():
    source = request.args.get('source', 'both')
    type_filter = request.args.get('type', 'both')
    selected_word = request.args.get('selected_word', None)
    month_filter = request.args.get('month', 'all')
    # --- Get Year Range Params ---
    min_year = request.args.get('min_year', default=ACTUAL_MIN_YEAR, type=int)
    max_year = request.args.get('max_year', default=ACTUAL_MAX_YEAR, type=int)

    print(f"API Heatmap: source={source}, type={type_filter}, word={selected_word}, month={month_filter}, year_range=[{min_year}-{max_year}]")

    df_filtered = df_full.copy()

    # Apply source and type filters
    if source != 'both':
        df_filtered = df_filtered[df_filtered['source'] == source]
    if type_filter != 'both':
        df_filtered = df_filtered[df_filtered['type'] == type_filter]

    # Apply word filter if provided
    if selected_word and selected_word not in ['null', 'None', 'undefined', '']:
         if 'clean_title' in df_filtered.columns:
              df_filtered = df_filtered[df_filtered['clean_title'].str.contains(r'\b' + selected_word + r'\b', regex=True, na=False)]
         else:
              print("Warning: 'clean_title' column not found for word filtering.")
              df_filtered = pd.DataFrame()

    # --- Apply Year Range Filter ---
    if 'date' in df_filtered.columns:
         df_filtered = df_filtered[
             (df_filtered['date'].dt.year >= min_year) &
             (df_filtered['date'].dt.year <= max_year)
         ]
    else:
         print("Warning: 'date' column not found for year filtering.")
         df_filtered = pd.DataFrame()

    # --- Apply Month Filter (if not 'all') ---
    if month_filter != 'all':
        try:
            month_int = int(month_filter)
            if 1 <= month_int <= 12 and 'date' in df_filtered.columns:
                df_filtered = df_filtered[df_filtered['date'].dt.month == month_int]
            elif 'date' not in df_filtered.columns:
                 print("Warning: 'date' column not found for month filtering.")
                 df_filtered = pd.DataFrame()
        except ValueError:
            print(f"Warning: Invalid month filter value '{month_filter}'.")
            df_filtered = pd.DataFrame()

    # Aggregate data and prepare heatmap response
    if not df_filtered.empty and 'date' in df_filtered.columns and 'type' in df_filtered.columns:
        heatmap_data = df_filtered.groupby([
            df_filtered['date'].dt.year.rename('year'),
            df_filtered['date'].dt.month.rename('month'),
            'type'
        ]).size().unstack(fill_value=0).reset_index()

        if 'fake' not in heatmap_data.columns:
            heatmap_data['fake'] = 0
        if 'real' not in heatmap_data.columns:
            heatmap_data['real'] = 0

        heatmap_data = heatmap_data[['year', 'month', 'fake', 'real']]
        results = heatmap_data.to_dict('records')
    else:
        results = []

    return jsonify(results)

@app.route('/api/domain-data')
def get_domain_data():
    try:
        source = request.args.get('source', 'both')
        news_type = request.args.get('type', 'both')
        selected_word = request.args.get('selected_word', None)
        domain_type = request.args.get('domain_type', 'all')
        min_articles = request.args.get('min_articles', 5, type=int)

        if selected_word == 'null' or selected_word == 'undefined' or selected_word == '':
            selected_word = None

        df_filtered = df_full.copy()
        if source != 'both':
            df_filtered = df_filtered[df_filtered['source'] == source]
        if news_type != 'both':
            df_filtered = df_filtered[df_filtered['type'] == news_type]
        if domain_type != 'all':
            df_filtered = df_filtered[df_filtered['domain_type'] == domain_type]
        if selected_word:
            df_filtered = df_filtered[df_filtered['clean_title'].str.contains(selected_word, na=False, regex=False)]

        if df_filtered.empty:
            print("Domain: No data after filtering.")
            return jsonify([])

        domain_agg = (df_filtered.groupby('domain')
                      .agg(count=('title', 'nunique'),
                           url=('news_url', 'first'),
                           type=('domain_type', 'first')))

        domain_agg = domain_agg[domain_agg['count'] >= min_articles].reset_index()

        if domain_agg.empty:
            print(f"Domain: No data after min_articles filter ({min_articles}).")
            return jsonify([])

        domain_data = domain_agg.sort_values('count', ascending=False).head(20)
        print(f"Domain: Returning {len(domain_data)} rows.")
        return jsonify(domain_data.to_dict(orient='records'))
    except Exception as e:
        print(f"--- ERROR in /api/domain-data ---")
        import traceback
        traceback.print_exc()
        print(f"--- End Error Traceback ---")
        return jsonify({"error": "Internal server error processing domain data", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)