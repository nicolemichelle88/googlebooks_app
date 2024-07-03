document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const resultsContainer = document.getElementById('results');
    const pageNumbersContainer = document.getElementById('page-numbers');
    let currentPage = 1;
    let currentQuery = '';
    let totalResults = 0;
    let totalPages = 0;
    let allResults = {};

    searchButton.addEventListener('click', () => {
        currentPage = 1;
        currentQuery = searchInput.value;
        fetchInitialResults();
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            currentPage = 1;
            currentQuery = searchInput.value;
            fetchInitialResults();
        }
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPageResults(currentPage);
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPageResults(currentPage);
        }
    });

    pageNumbersContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'SPAN') {
            currentPage = parseInt(event.target.textContent);
            fetchPageResults(currentPage);
        }
    });

    function fetchInitialResults() {
        console.log(`Fetching initial results for: ${currentQuery}`);
        const startTime = performance.now();
        fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(currentQuery)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const endTime = performance.now();
                console.log('Data received:', data);

                allResults[currentPage] = data.books;
                totalResults = data.totalItems;
                totalPages = Math.ceil(totalResults / 10);

                console.log(`Total results: ${totalResults}, Total pages: ${totalPages}`);

                document.getElementById('total-results').textContent = totalResults;
                document.getElementById('common-author').textContent = data.mostCommonAuthor;
                document.getElementById('earliest-date').textContent = data.earliestPubDate;
                document.getElementById('latest-date').textContent = data.latestPubDate;
                document.getElementById('response-time').textContent = ((endTime - startTime) / 1000).toFixed(2);

                displayResults();
                updatePagination();
            })
            .catch(error => {
                console.error('Error fetching results:', error);
            });
    }

    function fetchPageResults(page) {
        const startIndex = (page - 1) * 10;
        if (allResults[page]) {
            displayResults();
            updatePagination();
            return;
        }
        console.log(`Fetching results for page ${page}, start index ${startIndex}`);
        fetch(`http://127.0.0.1:5000/fetch_page?q=${encodeURIComponent(currentQuery)}&startIndex=${startIndex}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(`Data received for page ${page}:`, data);
                allResults[page] = data.books;
                displayResults();
                updatePagination();
            })
            .catch(error => {
                console.error('Error fetching page results:', error);
            });
    }

    function displayResults() {
        console.log(`Displaying results for page: ${currentPage}`);
        resultsContainer.innerHTML = '';

        const books = allResults[currentPage];
        for (let book of books) {
            const li = document.createElement('li');
            li.textContent = `${book.authors} - ${book.title}`;

            const description = document.createElement('div');
            description.className = 'description';
            description.textContent = book.description ? book.description : 'No description available.';
            description.style.display = 'none';

            li.appendChild(description);
            li.addEventListener('click', () => {
                description.style.display = description.style.display === 'none' ? 'block' : 'none';
            });

            resultsContainer.appendChild(li);
        }
    }

    function updatePagination() {
        console.log('Updating pagination:', { currentPage, totalPages });
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;

        pageNumbersContainer.innerHTML = '';
        const pageRange = getPageRange(currentPage, totalPages, 7);

        console.log('Page range:', pageRange);

        pageRange.forEach(page => {
            const span = document.createElement('span');
            span.textContent = page;
            if (page === currentPage) {
                span.classList.add('active');
            }
            pageNumbersContainer.appendChild(span);
        });
    }

    function getPageRange(currentPage, totalPages, maxPages) {
        const half = Math.floor(maxPages / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, currentPage + half);

        if (end - start < maxPages - 1) {
            if (start === 1) {
                end = Math.min(totalPages, start + maxPages - 1);
            } else if (end === totalPages) {
                start = Math.max(1, end - maxPages + 1);
            }
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }
});
