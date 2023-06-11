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



# authority = 'https://www.nyckel.com'
# client_id = '589rtm3be0a5detrfsse0h85chk61abx'
# client_secret = '953w8ubtsmhgsy4fv0ewcj3nz4fb2w94ocw7awjkhymd0sddc4b0vflq2gw3fzqv'
# access_token = create_access_token(authority, client_id, client_secret)
# print("access_tokein = ", access_token)

# Use the access token to create an image sample
# image_sample = create_image_sample(access_token, 'first_card2.png', 'first2')
# image_sample = create_image_sample(access_token, 'second_card2.png', 'second2')

# print(image_sample)
# a = search_image_samples(access_token, 'first_card2.png', 2, False)
# print(a)