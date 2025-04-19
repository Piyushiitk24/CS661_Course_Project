from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index_selena.html')

@app.route('/data')
def data():
    json_path = os.path.join(os.path.dirname(__file__), "celeb_jon/selena.json")
    with open(json_path, "r") as f:
        data = json.load(f)
    
    # No need to reformat the data, return it directly
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
