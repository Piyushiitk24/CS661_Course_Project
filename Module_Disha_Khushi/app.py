from flask import Flask, render_template, send_from_directory
import dash
from dash import dcc, html
import plotly.express as px
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.decomposition import PCA
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pandas as pd
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/dataset.json')
def dataset():
    return send_from_directory('data', 'dataset.json')

external_stylesheets = ['https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css']

dash_app = dash.Dash(
    __name__,
    server=app,
    url_base_pathname='/pca/',  
    external_stylesheets=external_stylesheets
)

df = pd.read_json('./data/dataset.json')

features = ['source', 'type', 'domain', 'domain_type']
target = 'tweet_count'

X = df[features]
y = df[target]

label_encoder = LabelEncoder()
X['domain_encoded'] = label_encoder.fit_transform(X['domain'])
X = X.drop('domain', axis=1)

categorical_features = ['source', 'type', 'domain_type']

categorical_transformer = OneHotEncoder(handle_unknown='ignore')

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', categorical_transformer, categorical_features)
    ],
    remainder='passthrough'
)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('scaler', StandardScaler(with_mean=False))
])

X_processed = pipeline.fit_transform(X)

pca = PCA(n_components=10)
X_pca = pca.fit_transform(X_processed)

explained_variance_ratio = pca.explained_variance_ratio_

feature_names_cat = pipeline.named_steps['preprocessor'].transformers_[0][1].get_feature_names_out(categorical_features)
feature_names = np.concatenate([feature_names_cat, ['domain_encoded']])

pca_loadings = pd.DataFrame(pca.components_.T, columns=[f'PC{i+1}' for i in range(10)], index=feature_names)
feature_importance = pca_loadings.abs().sum(axis=1).sort_values(ascending=False)

dash_app.layout = html.Div([
    
    html.H2('PCA : Feature Importance', style={'textAlign': 'center', 'fontWeight' : '370', 'fontSize' : 33, 'backgroundColor' : '#FFFFFF'}),
    
    dcc.Graph(
        id='feature-importance-graph',
        figure=px.bar(
            x=feature_importance.index[:30],
            y=feature_importance.values[:30],
            labels={'x': 'Feature', 'y': 'Importance'},
            title='Top 13 Features Influencing Virality',
            template='plotly_white'
        ).update_layout(xaxis_tickangle=45)
    ),
    
    html.H2('PCA : Dimensionality Reduction [Scatterplot]', style={'textAlign': 'center', 'fontWeight' : '370', 'fontSize' : 33, 'backgroundColor' : '#FFFFFF'}),
    
    dcc.Graph(
        id='pca-scatter',
        figure=px.scatter(
            x=X_pca[:, 0],
            y=X_pca[:, 1],
            color=df['source'],
            labels={'x': 'First Principle Component [PC1]', 'y': 'Second Principle Component [PC2]'},
            hover_data={'title': df['title'], 'tweet_count': y},
            title='PCA of News Articles',
            template='plotly_white'
        )
    ),
    
    html.H2('PCA : Scree Plot [Variance Ratio]', style={'textAlign': 'center', 'fontWeight' : '370', 'fontSize' : 33, 'backgroundColor' : '#FFFFFF'}),

    dcc.Graph(
        id='scree-plot',
        figure=px.line(
            x=[f'PC{i+1}' for i in range(len(explained_variance_ratio))],
            y=explained_variance_ratio * 100,
            markers=True,
            labels={'x': 'Principal Components', 'y': 'Variance Explained (%)'},
            title='Scree Plot of Principal Components',
            template='plotly_white'
        )
    )
])

if __name__ == '__main__':
    app.run(debug=True, port=5004)
