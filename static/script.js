let scrapedData = null;

// DOM Elements
const form = document.getElementById('scraperForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultsCard = document.getElementById('resultsCard');
const scrapedUrl = document.getElementById('scrapedUrl');
const contentPreview = document.getElementById('contentPreview');
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toastTitle');
const toastMessage = document.getElementById('toastMessage');

// Utility Functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showToast(title, message, type = 'success') {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function setLoading(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

// API Call
async function scrapeWebsite(url) {
    const response = await fetch('/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        url,
        title: data.title || 'Untitled',
        content: data.preview || '',
        timestamp: new Date().toISOString(),
    };
}

// File Generation
function generateTextFile(data) {
    return `The below contents have been scraped from URL: ${data.url} using Jiya's web scrapper app
--------
Scraped on: ${new Date(data.timestamp).toLocaleString()}
--------

Content:


${data.content}


`;
}

function downloadTextFile(data) {
    try {
        const textContent = generateTextFile(data);
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const hostname = new URL(data.url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        link.download = `scraped_${hostname}_${timestamp}.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Download started!', 'Your scraped content has been saved as a text file.');
    } catch (error) {
        showToast('Download failed', 'There was an error downloading the file.', 'error');
    }
}

// Submit Handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    resultsCard.classList.add('hidden');

    const url = urlInput.value.trim();

    if (!url) {
        showError('Please enter a URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (include http:// or https://)');
        return;
    }

    setLoading(true);

    try {
        const data = await scrapeWebsite(url);
        scrapedData = data;

        scrapedUrl.textContent = data.url;
        contentPreview.textContent = data.content.substring(0, 200) + '...';
        resultsCard.classList.remove('hidden');

        showToast('Scraping completed!', 'Your content is ready for download.');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Scraping failed. Try again.';
        showError(message);
        showToast('Error', message, 'error');
    } finally {
        setLoading(false);
    }
});

// Download Handler
downloadBtn.addEventListener('click', () => {
    if (scrapedData) {
        downloadTextFile(scrapedData);
    }
});

// Real-time Validation
urlInput.addEventListener('input', () => {
    hideError();
});
