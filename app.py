from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from collections import Counter
import time

app = Flask(__name__, static_url_path='')
CORS(app)

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

def format_authors(authors):
    return ', '.join(authors) if authors else 'Unknown Author'

def process_books_data(items):
    books = []
    all_authors = []
    pub_dates = []
    for item in items:
        volume_info = item.get('volumeInfo', {})
        authors = volume_info.get('authors', [])
        title = volume_info.get('title', 'No Title')
        description = volume_info.get('description', 'No description available.')
        published_date = volume_info.get('publishedDate', 'Unknown Date')

        all_authors.extend(authors)
        if published_date != 'Unknown Date':
            pub_dates.append(published_date)

        books.append({
            'authors': format_authors(authors),
            'title': title,
            'description': description,
            'publishedDate': published_date
        })

    most_common_author = Counter(all_authors).most_common(1)
    most_common_author = most_common_author[0][0] if most_common_author else 'No Author'

    earliest_pub_date = min(pub_dates, default='N/A')
    latest_pub_date = max(pub_dates, default='N/A')

    return books, most_common_author, earliest_pub_date, latest_pub_date

@app.route('/search')
def search_books():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400

    try:
        start_time = time.time()
        response = requests.get(GOOGLE_BOOKS_API_URL, params={'q': query, 'startIndex': 0, 'maxResults': 10})
        if response.status_code != 200:
            print(f"Failed to fetch data from Google Books API: {response.status_code}")
            return jsonify({'error': 'Failed to fetch data from Google Books API'}), 500

        data = response.json()
        items = data.get('items', [])
        total_items = data.get('totalItems', 0)

        response_time = time.time() - start_time
        books, most_common_author, earliest_pub_date, latest_pub_date = process_books_data(items)

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
        return jsonify({'error': f'Failed to fetch data from Google Books API: {str(re)}'}), 500
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': f'An error occurred while processing the request: {str(e)}'}), 500

@app.route('/fetch_page')
def fetch_page():
    query = request.args.get('q', '')
    start_index = int(request.args.get('startIndex', 0))

    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400

    try:
        print(f"Fetching page with startIndex={start_index}")
        response = requests.get(GOOGLE_BOOKS_API_URL, params={'q': query, 'startIndex': start_index, 'maxResults': 10})
        if response.status_code != 200:
            print(f"Failed to fetch data from Google Books API: {response.status_code}")
            return jsonify({'error': 'Failed to fetch data from Google Books API'}), 500

        data = response.json()
        items = data.get('items', [])
        books, _, _, _ = process_books_data(items)

        return jsonify({
            'books': books
        })

    except requests.RequestException as re:
        print(f"Request error: {re}")
        return jsonify({'error': f'Failed to fetch data from Google Books API: {str(re)}'}), 500
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': f'An error occurred while processing the request: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
