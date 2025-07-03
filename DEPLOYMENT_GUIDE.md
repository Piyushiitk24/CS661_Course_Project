# Deployment Preparation Checklist

## 1. Update Flask Apps for Production

### Module_Piyush_Ravi/app.py
- Change `app.run(debug=True, port=5001)` to:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
```

### Similar changes needed for:
- Module_Ananya_Arpita/Celeb_news/app.py
- Module_Disha_Khushi/app.py

## 2. Update Frontend API URLs

### In React components, change localhost URLs to production URLs:
- From: `http://localhost:5001/api/...`
- To: Environment-based URLs or relative paths

## 3. Environment Variables

### Create production environment files:
- `.env.production` for React apps
- Environment variables for Flask apps

## 4. CORS Configuration

### Add CORS headers to Flask apps:
```python
from flask_cors import CORS
CORS(app)
```

## 5. Static File Handling

### Ensure static files are properly served in production

## 6. Database/Data Files

### Consider moving CSV files to:
- Cloud storage (AWS S3, Google Cloud Storage)
- Or include them in the deployment package
