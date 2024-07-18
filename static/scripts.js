// Add an event listener for the DOMContentLoaded event to ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get references to various HTML elements by their IDs
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const resultsContainer = document.getElementById('results');
    const pageNumbersContainer = document.getElementById('page-numbers');
    let currentPage = 1; // Variable to keep track of the current page
    let currentQuery = ''; // Variable to store the current search query
    let totalResults = 0; // Variable to store the total number of search results
    let totalPages = 0; // Variable to store the total number of pages
    let allResults = {}; // Object to cache the search results for each page

    // Event listener for search button click
    searchButton.addEventListener('click', () => {
        currentPage = 1; // Reset to the first page
        currentQuery = searchInput.value; // Get the current search query from the input
        fetchInitialResults(); // Fetch search results for the initial query
    });

    // Event listener for pressing Enter in the search input
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') { // Check if the Enter key was pressed
            currentPage = 1; // Reset to the first page
            currentQuery = searchInput.value; // Get the current search query from the input
            fetchInitialResults(); // Fetch search results for the initial query
        }
    });

    // Event listener for previous page button click
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) { // Check if there is a previous page
            currentPage--; // Decrement the current page number
            fetchPageResults(currentPage); // Fetch search results for the previous page
        }
    });

    // Event listener for next page button click
    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) { // Check if there is a next page
            currentPage++; // Increment the current page number
            fetchPageResults(currentPage); // Fetch search results for the next page
        }
    });

    // Event listener for clicking page numbers
    pageNumbersContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'SPAN') { // Check if the clicked element is a span
            currentPage = parseInt(event.target.textContent); // Get the page number from the clicked span
            fetchPageResults(currentPage); // Fetch search results for the specified page
        }
    });

    // Function to fetch initial search results
    function fetchInitialResults() {
        console.log(`Fetching initial results for: ${currentQuery}`);
        const startTime = performance.now(); // Record the start time for performance measurement
        fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(currentQuery)}`) // Make a fetch request to the search endpoint
            .then(response => {
                if (!response.ok) { // Check if the response is not OK
                    throw new Error('Network response was not ok'); // Throw an error
                }
                return response.json(); // Parse the response as JSON
            })
            .then(data => {
                const endTime = performance.now(); // Record the end time for performance measurement
                console.log('Data received:', data);

                allResults[currentPage] = data.books; // Cache the results for the current page
                totalResults = data.totalItems; // Store the total number of results
                totalPages = Math.ceil(totalResults / 10); // Calculate the total number of pages

                console.log(`Total results: ${totalResults}, Total pages: ${totalPages}`);

                // Update UI elements with the received data
                document.getElementById('total-results').textContent = totalResults;
                document.getElementById('common-author').textContent = data.mostCommonAuthor;
                document.getElementById('earliest-date').textContent = data.earliestPubDate;
                document.getElementById('latest-date').textContent = data.latestPubDate;
                document.getElementById('response-time').textContent = ((endTime - startTime) / 1000).toFixed(2);

                displayResults(); // Display the search results
                updatePagination(); // Update the pagination controls
            })
            .catch(error => {
                console.error('Error fetching results:', error); // Log any errors
            });
    }

    // Function to fetch results for a specific page
    function fetchPageResults(page) {
        const startIndex = (page - 1) * 10; // Calculate the starting index for the results
        if (allResults[page]) { // Check if results for the page are already cached
            displayResults(); // Display the cached results
            updatePagination(); // Update the pagination controls
            return;
        }
        console.log(`Fetching results for page ${page}, start index ${startIndex}`);
        fetch(`http://127.0.0.1:5000/fetch_page?q=${encodeURIComponent(currentQuery)}&startIndex=${startIndex}`) // Fetch results for the specific page
            .then(response => {
                if (!response.ok) { // Check if the response is not OK
                    throw new Error('Network response was not ok'); // Throw an error
                }
                return response.json(); // Parse the response as JSON
            })
            .then(data => {
                console.log(`Data received for page ${page}:`, data);
                allResults[page] = data.books; // Cache the results for the page
                displayResults(); // Display the results
                updatePagination(); // Update the pagination controls
            })
            .catch(error => {
                console.error('Error fetching page results:', error); // Log any errors
            });
    }

    // Function to display search results
    function displayResults() {
        console.log(`Displaying results for page: ${currentPage}`);
        resultsContainer.innerHTML = ''; // Clear the current results

        const books = allResults[currentPage]; // Get the results for the current page
        for (let book of books) { // Loop through each book in the results
            const li = document.createElement('li'); // Create a new list item
            li.textContent = `${book.authors} - ${book.title}`; // Set the text content of the list item

            const description = document.createElement('div'); // Create a new div for the description
            description.className = 'description'; // Set the class of the description div
            description.textContent = book.description ? book.description : 'No description available.'; // Set the text content of the description
            description.style.display = 'none'; // Hide the description by default

            li.appendChild(description); // Add the description div to the list item
            li.addEventListener('click', () => { // Add a click event listener to toggle the description visibility
                description.style.display = description.style.display === 'none' ? 'block' : 'none';
            });

            resultsContainer.appendChild(li); // Add the list item to the results container
        }
    }

    // Function to update pagination controls
    function updatePagination() {
        console.log('Updating pagination:', { currentPage, totalPages });
        prevPageButton.disabled = currentPage === 1; // Disable the previous page button if on the first page
        nextPageButton.disabled = currentPage === totalPages; // Disable the next page button if on the last page

        pageNumbersContainer.innerHTML = ''; // Clear the current page numbers
        const pageRange = getPageRange(currentPage, totalPages, 7); // Get the range of page numbers to display

        console.log('Page range:', pageRange);

        pageRange.forEach(page => { // Loop through each page number in the range
            const span = document.createElement('span'); // Create a new span for the page number
            span.textContent = page; // Set the text content of the span
            if (page === currentPage) { // Highlight the current page number
                span.classList.add('active');
            }
            pageNumbersContainer.appendChild(span); // Add the span to the page numbers container
        });
    }

    // Function to get the range of pages to display in the pagination
    function getPageRange(currentPage, totalPages, maxPages) {
        const half = Math.floor(maxPages / 2); // Calculate half of the maximum pages to display
        let start = Math.max(1, currentPage - half); // Calculate the start of the page range
        let end = Math.min(totalPages, currentPage + half); // Calculate the end of the page range

        if (end - start < maxPages - 1) { // Adjust the start and end if the range is smaller than the maximum pages
            if (start === 1) {
                end = Math.min(totalPages, start + maxPages - 1);
            } else if (end === totalPages) {
                start = Math.max(1, end - maxPages + 1);
            }
        }

        const pages = [];
        for (let i = start; i <= end; i++) { // Add each page number in the range to the list
            pages.push(i);
        }

        return pages; // Return the list of page numbers
    }
});
