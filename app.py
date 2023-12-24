from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)
app.debug = True


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/config.json')
def config():
    return jsonify({"openai": os.getenv("OPENAI_KEY")})

if __name__ == '__main__':
    app.run(debug=True)
