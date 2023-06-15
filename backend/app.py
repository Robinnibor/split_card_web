import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template
import cv2
from find_cards import find_card_positions

app = Flask(__name__)


@app.route('/get_cards', methods=['POST'])
def get_cards():
    scale_factor = 2
    image_path = request.json['image_path']
    image = cv2.imread(image_path)
    image = cv2.resize(image, (image.shape[1]*scale_factor, image.shape[0]*scale_factor))
    scaled_cards = find_card_positions(image)
    original_cards = [(x//scale_factor, y//scale_factor, w//scale_factor, h//scale_factor) for (x, y, w, h) in scaled_cards]
    # print('orig cards = ', original_cards)
    return jsonify({'original_cards': original_cards, 'scaled_cards': scaled_cards, 'scale_factor': scale_factor})

@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No image file selected.'}), 400

    # Get the current timestamp
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')

    # Create the directory if it doesn't exist
    directory = 'media/temp_images/'
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Save the image file with the timestamp as the filename
    image_path = os.path.join(directory, f'{timestamp}.jpg')
    image_file.save(image_path)

    return jsonify({'image_path': image_path}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print('port = ',port )
    app.run(host='0.0.0.0', port=port)
