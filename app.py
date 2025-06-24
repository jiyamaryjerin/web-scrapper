from flask import Flask, render_template, request, jsonify, send_file
import os
from scrape import process_input  # updated function now returns text, not file path

app = Flask(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DEFAULT_FILE = os.path.join(BASE_DIR, "text.txt")

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/scrape', methods=['POST'])
def scrape_route():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        scraped_text = process_input(url)  # Now returns text directly

        if scraped_text:
            # Write to file in Flask app
            with open(DEFAULT_FILE, "w", encoding='utf-8') as f:
                f.write(scraped_text)

            #preview = scraped_text[:500] + "..." if len(scraped_text) > 500 else scraped_text
            filename = os.path.basename(DEFAULT_FILE)
            download_url = f"/download-file?filename={filename}"
            return jsonify({"preview": scraped_text, "download_url": download_url, "filename": filename})
        else:
            return jsonify({"error": "No content scraped"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download-file')
def download_file():
    filename = request.args.get('filename', 'text.txt')
    if '..' in filename or '/' in filename or '\\' in filename:
        return jsonify({"error": "Invalid filename"}), 400

    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        filepath,
        as_attachment=True,
        mimetype='text/plain; charset=utf-8',
        download_name=filename
    )

if __name__ == '__main__':
    app.run(debug=True)
