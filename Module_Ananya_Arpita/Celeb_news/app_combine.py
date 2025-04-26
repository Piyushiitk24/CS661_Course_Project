from flask import Flask, render_template, jsonify, request
import json
import os
from flask_cors import CORS
import pandas as pd 
app = Flask(__name__)
#CORS(app)
# Load the dataset (assuming it's in the same directory as app.py)
# Load the dataset (update the path to the dataset)
base_dir = os.path.dirname(__file__)
data_path = os.path.join(base_dir, "..", "..", "data", "master_dataset.csv")  # Correct relative path to the dataset
df = pd.read_csv(data_path)  # Load the dataset into a pandas DataFrame
@app.route('/')
def index():
    return render_template('index_combine.html')

@app.route('/data')
def data():
    json_path = os.path.join(base_dir, "celeb_json", "selena.json")
    with open(json_path, "r") as f:
        data = json.load(f)
    return jsonify(data)

#msjnjfinjnojjsnnoi

  

# API endpoint to get tweet activity for a celebrity
#@app.route('/get_tweet_activity', methods=['GET'])


if __name__ == '__main__':
    app.run(debug=True)
