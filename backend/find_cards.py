import cv2
from skimage.metrics import structural_similarity as ssim

def compare_images(img1, img2):
    img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    return ssim(img1, img2)


def find_titles(image):
    # Set a minimum width for the titles (90% of the image width in this case)
    min_width = 0.9 * image.shape[1]

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Use Canny edge detection with lowered thresholds
    edges = cv2.Canny(blur, 250, 400)

    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)



    # Filter contours based on size
    titles = [cnt for cnt in contours if cv2.boundingRect(cnt)[2] > min_width and cv2.boundingRect(cnt)[3]*100 > cv2.boundingRect(cnt)[2]]
    titles.sort(key=lambda cnt: cv2.boundingRect(cnt)[1])
    # print('num of titles = ', len(titles))
    # for t in titles: print(cv2.boundingRect(t))
    # for title in titles:
    #     x, y, w, h = cv2.boundingRect(title)
    #     cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
    # cv2.imwrite('splited.png', image)
    # cv2.imshow('Detected Titles and Cards', image)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    # Load the template image
    # Sort titles from top to bottom

    # for t in titles: print(t)
    return titles


def find_cards(image, titles, num_cards_per_row, estimated_card_height, estimated_card_width):
    # Initialize list of cards
    cards = []

    # Iterate over titles
    for i in range(len(titles) - 1):
        # Get the y-coordinate of the bottom of the current title
        y_bottom_current = cv2.boundingRect(titles[i])[1] + cv2.boundingRect(titles[i])[3]

        # Get the y-coordinate of the top of the next title
        y_top_next = cv2.boundingRect(titles[i+1])[1]

        # Estimate the number of rows
        estimated_num_rows = (y_top_next - y_bottom_current) // estimated_card_height

        # Adjust the card height if we are at the first title and there is more than one title
        if i == 0 and len(titles) > 1:
            actual_height = y_top_next - y_bottom_current
            card_height = actual_height // estimated_num_rows
        else:
            card_height = estimated_card_height

        # Split the cards
        for j in range(estimated_num_rows):
            for k in range(num_cards_per_row):
                # Compute the bounding box of the card
                x = k * estimated_card_width
                y = y_bottom_current + j * card_height
                w = estimated_card_width
                h = card_height

                # Add the bounding box to the list of cards
                cards.append((x, y, w, h))

    # Handle the last set of cards
    y_bottom_current = cv2.boundingRect(titles[-1])[1] + cv2.boundingRect(titles[-1])[3]
    y_bottom_image = image.shape[0]

    # Estimate the number of rows
    num_rows = (y_bottom_image - y_bottom_current) // card_height

    for j in range(num_rows):
        for k in range(num_cards_per_row):
            # Compute the bounding box of the card
            x = k * estimated_card_width
            y = y_bottom_current + j * card_height
            w = estimated_card_width
            h = card_height

            # Add the bounding box to the list of cards
            cards.append((x, y, w, h))

    return cards


def filter_blank_cards(image, cards, blank_card, card_height, card_width):
    non_blank_cards = []
    resized_blank = cv2.resize(blank_card, (card_width, card_height))

    # Filter out blank cards
    for card in cards:
        x, y, w, h = card
        card_image = image[y:y + h, x:x + w]

        resized_card_image = cv2.resize(card_image, (card_width, card_height))

        # If the card is not similar to the blank card, add it to the non-blank card list
        if compare_images(resized_card_image, resized_blank) < 0.85:  # You can adjust the threshold as needed
            non_blank_cards.append(card)

    return non_blank_cards


def find_card_positions(image):
    template = cv2.imread('template.png')
    template_ratio = template.shape[0] / template.shape[1]
    estimated_card_width = image.shape[1] // 10
    estimated_card_height = int(estimated_card_width * template_ratio)
    # Find titles
    titles = find_titles(image)
    """
    for title in titles:
        x, y, w, h = cv2.boundingRect(title)
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
    cv2.imwrite('splited.png', image)
    cv2.imshow('Detected Titles and Cards', image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    """
    num_cards_per_row = 10  # Number of cards per row
    cards = find_cards(image, titles, num_cards_per_row, estimated_card_height, estimated_card_width)

    # Load the blank card for comparison and resize it to the estimated card size
    blank_card = cv2.imread('blank.png')
    blank_card = cv2.resize(blank_card, (estimated_card_width, estimated_card_height))

    # Filter blank cards
    non_blank_cards = filter_blank_cards(image, cards, blank_card, estimated_card_height, estimated_card_width)
    """
    for card in non_blank_cards:
       x, y, w, h = card
       cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)
    
    cv2.imwrite('splited.png', image)
    cv2.imshow('Detected Titles and Cards', image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
"""
    return non_blank_cards


def test_find_card_positions(file_name, scale_factor =2):
    image = cv2.imread(file_name)
    image = cv2.resize(image, (image.shape[1] * scale_factor, image.shape[0] * scale_factor))
    scaled_cards = find_card_positions(image)
    original_cards = [(x // scale_factor, y // scale_factor, w // scale_factor, h // scale_factor) for (x, y, w, h) in
                      scaled_cards]
    # find_card_positions(image)




# Draw the bounding rectangles
#for title in titles:
#    x, y, w, h = cv2.boundingRect(title)
#    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
#for card in non_blank_cards:
#    x, y, w, h = card
#    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)

# Show the image with detected titles and cards
#cv2.imwrite('splited.png', image)
#cv2.imshow('Detected Titles and Cards', image)
#cv2.waitKey(0)
#cv2.destroyAllWindows()
