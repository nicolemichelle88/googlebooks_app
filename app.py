from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from collections import Counter
import time

# Initialize Flask application
app = Flask(__name__, static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) for the app

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"  # Google Books API URL

# Function to format authors as a comma-separated string
def format_authors(authors):
    return ', '.join(authors) if authors else 'Unknown Author'

# Function to process book data from the API response
def process_books_data(items):
    books = []  # List to store book information
    all_authors = []  # List to store all authors for counting the most common author
    pub_dates = []  # List to store publication dates for finding earliest and latest dates

    # Iterate through each item (book) in the API response
    for item in items:
        volume_info = item.get('volumeInfo', {})  # Get volume info, default to empty dict if not present
        authors = volume_info.get('authors', [])  # Get authors, default to empty list if not present
        title = volume_info.get('title', 'No Title')  # Get title, default to 'No Title' if not present
        description = volume_info.get('description', 'No description available.')  # Get description, default if not present
        published_date = volume_info.get('publishedDate', 'Unknown Date')  # Get published date, default if not present

        all_authors.extend(authors)  # Add authors to the list of all authors
        if published_date != 'Unknown Date':
            pub_dates.append(published_date)  # Add publication date to the list if it's known

        # Add book information to the books list
        books.append({
            'authors': format_authors(authors),
            'title': title,
            'description': description,
            'publishedDate': published_date
        })

    # Find the most common author
    most_common_author = Counter(all_authors).most_common(1)
    most_common_author = most_common_author[0][0] if most_common_author else 'No Author'

    # Find the earliest and latest publication dates
    earliest_pub_date = min(pub_dates, default='N/A')
    latest_pub_date = max(pub_dates, default='N/A')

    return books, most_common_author, earliest_pub_date, latest_pub_date  # Return processed data

# Route for searching books
@app.route('/search')
def search_books():
    query = request.args.get('q', '')  # Get the search query from the request

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400  # Return error if query is missing

    try:
        start_time = time.time()  # Record the start time for performance measurement
        response = requests.get(GOOGLE_BOOKS_API_URL, params={'q': query, 'startIndex': 0, 'maxResults': 10})
        if response.status_code != 200:
            print(f"Failed to fetch data from Google Books API: {response.status_code}")
            return jsonify({'error': 'Failed to fetch data from Google Books API'}), 500  # Return error if API request fails

        data = response.json()  # Parse the response JSON
        items = data.get('items', [])  # Get the list of items (books)
        total_items = data.get('totalItems', 0)  # Get the total number of items

        response_time = time.time() - start_time  # Calculate the response time
        books, most_common_author, earliest_pub_date, latest_pub_date = process_books_data(items)  # Process the book data

        # Return the processed data as JSON
        return jsonify({
            'totalItems': total_items,
            'books': books,
            'mostCommonAuthor': most_common_author,
            'earliestPubDate': earliest_pub_date,
            'latestPubDate': latest_pub_date,
            'responseTime': response_time
        })

    except requests.RequestException as re:
        print(f"Request error: {re}")
        return jsonify({'error': f'Failed to fetch data from Google Books API: {str(re)}'}), 500  # Handle request exceptions
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': f'An error occurred while processing the request: {str(e)}'}), 500  # Handle other exceptions

# Route for fetching a specific page of results
@app.route('/fetch_page')
def fetch_page():
    query = request.args.get('q', '')  # Get the search query from the request
    start_index = int(request.args.get('startIndex', 0))  # Get the start index for pagination

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400  # Return error if query is missing

    try:
        print(f"Fetching page with startIndex={start_index}")
        response = requests.get(GOOGLE_BOOKS_API_URL, params={'q': query, 'startIndex': start_index, 'maxResults': 10})
        if response.status_code != 200:
            print(f"Failed to fetch data from Google Books API: {response.status_code}")
            return jsonify({'error': 'Failed to fetch data from Google Books API'}), 500  # Return error if API request fails

        data = response.json()  # Parse the response JSON
        items = data.get('items', [])  # Get the list of items (books)
        books, _, _, _ = process_books_data(items)  # Process the book data

        # Return the books data as JSON
        return jsonify({
            'books': books
        })

    except requests.RequestException as re:
        print(f"Request error: {re}")
        return jsonify({'error': f'Failed to fetch data from Google Books API: {str(re)}'}), 500  # Handle request exceptions
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': f'An error occurred while processing the request: {str(e)}'}), 500  # Handle other exceptions

if __name__ == '__main__':
    app.run(debug=True)  # Run the Flask app in debug mode
