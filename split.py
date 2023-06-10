import cv2
from find_cards import find_card_positions

import requests

def create_access_token(authority, client_id, client_secret):
    token_url = 'https://www.nyckel.com/connect/token'
    data = {'authority': authority, 'client_id': client_id, 'client_secret': client_secret, 'grant_type': 'client_credentials'}
    result = requests.post(token_url, data = data)
    return result.json()['access_token']


def search_image_samples(accessToken, image_file_path, sampleCount=1, includeData=True):
    url = f'https://www.nyckel.com/v0.9/functions/sw3j7knfy7fqfko1/search?sampleCount={sampleCount}&includeData={includeData}'
    headers = {'Authorization': 'Bearer ' + accessToken}

    with open(image_file_path, 'rb') as image_file:
        image_data = image_file.read()

    files = {'data': image_data}
    result = requests.post(url, headers=headers, files=files)

    return result.json()


def create_image_sample(accessToken, image_file_path, externalId=None):
    url = 'https://www.nyckel.com/v1/functions/sw3j7knfy7fqfko1/samples'
    headers = {'Authorization': 'Bearer ' + accessToken}

    with open(image_file_path, 'rb') as image_file:
        image_data = image_file.read()

    files = {'data': image_data}
    if externalId:
        data = {'externalId': externalId}
        result = requests.post(url, headers=headers, files=files, data=data)
    else:
        result = requests.post(url, headers=headers, files=files)

    return result.json()





# Read the image and find the titles
deck_image = 'test14.png'
scale_factor = 2
image = cv2.imread(deck_image)
image = cv2.resize(image, (image.shape[1]*scale_factor, image.shape[0]*scale_factor)) # double the size of the image


# Call the function
image_path = 'test14.png'
image = cv2.imread(image_path)
# Define a scale factor
scale_factor = 2
# Enlarge the image based on the scale factor
image = cv2.resize(image, (image.shape[1]*scale_factor, image.shape[0]*scale_factor))
non_blank_cards = find_card_positions(image)


# Save the first non-blank card as an image
first_card = non_blank_cards[0]
x, y, w, h = first_card
first_card_img = image[y:y + h, x:x + w]
cv2.imwrite('first_card.png', first_card_img)

authority = 'https://www.nyckel.com'
client_id = '589rtm3be0a5detrfsse0h85chk61abx'
client_secret = '953w8ubtsmhgsy4fv0ewcj3nz4fb2w94ocw7awjkhymd0sddc4b0vflq2gw3fzqv'
access_token = create_access_token(authority, client_id, client_secret)
print("access_tokein = ", access_token)

# Use the access token to create an image sample
image_sample = create_image_sample(access_token, 'first_card.png', 'first')

print(image_sample)


# Draw the bounding rectangles
#for title in titles:
#    x, y, w, h = cv2.boundingRect(title)
#    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
for card in non_blank_cards:
    x, y, w, h = card
    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)

# Show the image with detected titles and cards
cv2.imwrite('splited.png', image)
cv2.imshow('Detected Titles and Cards', image)
cv2.waitKey(0)
cv2.destroyAllWindows()

