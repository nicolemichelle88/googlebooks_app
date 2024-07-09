# Google Books Search App

This is a simple web application that allows users to search for books using the Google Books API. The application displays the search results with pagination and provides additional information such as the total number of results, the most common author, the earliest publication date, the latest publication date, and the server response time.

## Features

- Search for books using the Google Books API
- Display search results with pagination
- Show additional information about the search results
- Responsive and accessible design

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Python 3.x](https://www.python.org/downloads/)
- [pip (Python package installer)](https://pip.pypa.io/en/stable/installation/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Clone the Repository

```bash
git clone git@github.com:nicolemichelle88/googlebooks_app.git
cd googlebooks_app
```

### Set Up the Backend

1. **Create a Virtual Environment** (optional but recommended):

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

2. **Install Flask and Requests**:

    ```bash
    pip3 install Flask requests flask-cors
    ```

3. **Run the Flask App**:

    ```bash
    python3 app.py
    ```

    The backend server will start on `http://127.0.0.1:5000`.

### Set Up the Frontend

1. **Open `index.html`**:

    Open the `index.html` file in your preferred web browser. You can also use a simple HTTP server to serve the file:

    ```bash
    python3 -m http.server
    ```

    Then, navigate to `http://localhost:8000` in your web browser.

### Search for Books

1. **Enter a Search Query**:

    In the search input, type the name of a book, author, or any keyword you want to search for.

2. **Click Search**:

    Click the "Search" button or press Enter to start the search. The search results will be displayed with pagination controls.

3. **Navigate Through Pages**:

    Use the "Previous" and "Next" buttons to navigate through the pages of search results. Click on the page numbers to jump to a specific page.

### Additional Information

- The `results-info` section displays the total number of results, the most common author, the earliest publication date, the latest publication date, and the server response time.


