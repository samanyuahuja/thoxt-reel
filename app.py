from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime
import base64
import requests

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = 'reels.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema"""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS reels (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            duration INTEGER,
            thumbnail TEXT,
            video_blob TEXT,
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Routes
@app.route('/')
def index():
    """Home page - options menu"""
    return render_template('index.html')

@app.route('/recorder')
def recorder():
    """Video recorder page"""
    return render_template('recorder.html')

@app.route('/saved-reels')
def saved_reels():
    """Saved reels page"""
    return render_template('saved-reels.html')

@app.route('/editor')
def editor():
    """Video editor page"""
    return render_template('editor.html')

@app.route('/upload')
def upload():
    """Video upload page"""
    return render_template('upload.html')

@app.route('/ai-script')
def ai_script():
    """AI script generator page"""
    return render_template('ai-script.html')

# API Routes
@app.route('/api/reels', methods=['GET'])
def get_reels():
    """Get all reels"""
    conn = get_db()
    reels = conn.execute('SELECT * FROM reels ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(reel) for reel in reels])

@app.route('/api/reels', methods=['POST'])
def create_reel():
    """Create new reel"""
    data = request.json or {}
    conn = get_db()
    conn.execute(
        'INSERT INTO reels (id, title, duration, thumbnail, video_blob, views, likes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (data.get('id', ''), data.get('title', ''), data.get('duration', 0), data.get('thumbnail'), data.get('video_blob'), 0, 0)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'id': data.get('id', '')})

@app.route('/api/reels/<reel_id>', methods=['DELETE'])
def delete_reel(reel_id):
    """Delete a reel"""
    conn = get_db()
    conn.execute('DELETE FROM reels WHERE id = ?', (reel_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/reels/<reel_id>/views', methods=['PATCH'])
def update_views(reel_id):
    """Update reel views"""
    conn = get_db()
    conn.execute('UPDATE reels SET views = views + 1 WHERE id = ?', (reel_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/reels/<reel_id>/likes', methods=['PATCH'])
def update_likes(reel_id):
    """Update reel likes"""
    conn = get_db()
    conn.execute('UPDATE reels SET likes = likes + 1 WHERE id = ?', (reel_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/generate-script', methods=['POST'])
def generate_script():
    """Generate script using LM Studio local AI"""
    data = request.json or {}
    topic = data.get('topic', '')
    duration = data.get('duration', 30)
    tone = data.get('tone', 'engaging')
    
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400
    
    # Create prompt based on parameters
    prompt = f"""Generate a {duration}-second video script about: {topic}

Requirements:
- Tone: {tone}
- Duration: approximately {duration} seconds when spoken
- Format: Just the script text, no extra formatting
- Make it perfect for a social media reel/short video
- Keep it concise and engaging

Script:"""
    
    try:
        # Call LM Studio API (OpenAI-compatible)
        response = requests.post(
            'http://localhost:1234/v1/chat/completions',
            json={
                'model': 'llama-3.2-1b-instruct',
                'messages': [
                    {'role': 'system', 'content': 'You are a professional script writer for social media videos. Create concise, engaging scripts.'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.7,
                'max_tokens': 300
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            script = result['choices'][0]['message']['content'].strip()
            return jsonify({'script': script})
        else:
            return jsonify({'error': f'LM Studio API error: {response.status_code}'}), 500
            
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Cannot connect to LM Studio. Make sure it is running on localhost:1234'}), 500
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out. LM Studio may be busy.'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Static files
@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
