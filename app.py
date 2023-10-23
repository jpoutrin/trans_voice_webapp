import logging
import tempfile
from logging import StreamHandler
from logging.handlers import RotatingFileHandler
import os
import sys
import shutil

import webview
from flask import Flask, render_template, request, redirect
from inaSpeechSegmenter import Segmenter
from inaSpeechSegmenter.export_funcs import seg2csv, seg2textgrid

os.environ['QT_API'] ='pyqt5'
os.environ['FORCE_QT_API'] ='pyqt5'


app = Flask(__name__)

# Configure logging
log_dir = os.path.expanduser('~/.transvoice')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
log_file = os.path.join(log_dir, 'app.log')
file_handler = RotatingFileHandler(log_file, maxBytes=1000000, backupCount=10)
file_handler.setLevel(logging.DEBUG)
handler = StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
# handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.DEBUG)
app.logger.debug("Logging configured")


# Get path to bundled files
if hasattr(sys, '_MEIPASS'):
    bundle_dir = sys._MEIPASS
    app.logger.debug(f"bundle_dir: {bundle_dir}")
    ffmpeg_path = os.path.join(bundle_dir, 'ffmpeg')
else:
    bundle_dir = os.path.dirname(os.path.abspath(__file__))
    app.logger.debug(f"bundle_dir: {bundle_dir}")
    ffmpeg_path = shutil.which("ffmpeg")
# Get path to bundled ffmpeg binary

app.logger.debug(f"ffmpeg binary path: {ffmpeg_path}")
# Check if ffmpeg binary exists
if not os.path.exists(ffmpeg_path):
    raise FileNotFoundError(f"Could not find bundled ffmpeg binary at {ffmpeg_path}")




@app.route("/")
def index():
    return render_template('index.html')


@app.route("/record")
def record_page():
    return render_template('record.html')


@app.route("/<media>")
def voice_analysis(media):
    seg = Segmenter()
    segmentation = seg(media)
    segmentation_dispayed = ', '.join(map(str, segmentation))
    return segmentation_dispayed


@app.route("/result", methods=["GET", "POST"])
def result():
    segmentation = "pending"
    if request.method == "POST":
        app.logger.debug("POST request received")
        print("AUDIO DATA RECEIVED")
        if "file" not in request.files:
            app.logger.debug("No file part")
            return redirect(request.url)

        file = request.files["file"]
        if file.filename == "":
            app.logger.debug("No filename")
            return redirect(request.url)

        if file:
            app.logger.debug("starting to analyse file")
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                file.save(temp_file.name)
                seg = Segmenter(ffmpeg=ffmpeg_path)
                segmentation = seg(temp_file.name)
                segmentation_dispayed = ', '.join(map(str, segmentation))
                app.logger.debug("Segmentation: " + segmentation_dispayed)
                return render_template('result.html', segmentation=segmentation)
    return render_template('result.html', segmentation=segmentation)


if __name__ == '__main__':
    webview.create_window('Trans Voice', app)
    webview.start(http_server=True, gui='qt', private_mode=False)


# if __name__ == "__main__":
#     app.run(host="127.0.0.1", port=5001, debug=True)

