from flask import Flask, request, jsonify, render_template
import cv2
from find_cards import find_card_positions

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/get_cards', methods=['POST'])
def get_cards():
    scale_factor = 2
    image_path = request.json['image_path']
    image = cv2.imread(image_path)
    image = cv2.resize(image, (image.shape[1]*scale_factor, image.shape[0]*scale_factor))
    scaled_cards = find_card_positions(image)
    original_cards = [(x//scale_factor, y//scale_factor, w//scale_factor, h//scale_factor) for (x, y, w, h) in scaled_cards]
    return jsonify({'original_cards': original_cards, 'scaled_cards': scaled_cards, 'scale_factor': scale_factor})

if __name__ == '__main__':
    app.run(debug=True)
