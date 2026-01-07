let currentData = [];
let currentPage = 1;
const itemsPerPage = 5;

// Elements
const dialectSelect = document.getElementById('dialect-select');
const splitSelect = document.getElementById('split-select');
const loadBtn = document.getElementById('load-btn');
const loadingDiv = document.getElementById('loading');
const dataDisplay = document.getElementById('data-display');
const errorMessage = document.getElementById('error-message');
const dataBody = document.getElementById('data-body');
const currentInfo = document.getElementById('current-info');
const pageInfo = document.getElementById('page-info');
const paginationText = document.getElementById('pagination-text');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Event Listeners
loadBtn.addEventListener('click', loadData);
prevBtn.addEventListener('click', () => changePage(-1));
nextBtn.addEventListener('click', () => changePage(1));

async function loadData() {
    const dialect = dialectSelect.value;
    const split = parseInt(splitSelect.value);

    if (!dialect) {
        showError('Please select a dialect');
        return;
    }

    hideError();
    showLoading();
    hideDataDisplay();

    try {
        const fileName = `${dialect} Test Translation.csv`;
        const filePath = `Vashantor_Simplified/Test/${fileName}`;
        
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status}`);
        }

        const text = await response.text();
        const rows = parseCSV(text);
        
        // Calculate split range
        const startIndex = (split - 1) * 250;
        const endIndex = split * 250;
        
        currentData = rows.slice(startIndex, endIndex);
        
        if (currentData.length === 0) {
            throw new Error('No data available for this split');
        }

        currentPage = 1;
        currentInfo.textContent = `${dialect} (Split ${split})`;
        renderTable();
        hideLoading();
        showDataDisplay();

    } catch (error) {
        hideLoading();
        showError(`Error loading data: ${error.message}`);
    }
}

function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles basic cases)
        const match = line.match(/^([^,]*),([^,]*),([^,]*)$/);
        if (match) {
            result.push({
                standard: match[1].trim(),
                dialect: match[2].trim(),
                dialectName: match[3].trim()
            });
        } else {
            // More complex parsing for quoted fields
            const parts = parseCSVLine(line);
            if (parts.length >= 3) {
                result.push({
                    standard: parts[0].trim(),
                    dialect: parts[1].trim(),
                    dialectName: parts[2].trim()
                });
            }
        }
    }
    
    return result;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = currentData.slice(startIndex, endIndex);
    
    dataBody.innerHTML = '';
    
    pageData.forEach((row, index) => {
        const globalIndex = startIndex + index + 1;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${globalIndex}</td>
            <td>${escapeHtml(row.dialect)}</td>
            <td>${escapeHtml(row.standard)}</td>
        `;
        dataBody.appendChild(tr);
    });
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, currentData.length);
    
    pageInfo.textContent = `Showing ${startItem}-${endItem} of ${currentData.length}`;
    paginationText.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
        
        // Smooth scroll to top of table
        document.querySelector('.table-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showDataDisplay() {
    dataDisplay.style.display = 'block';
}

function hideDataDisplay() {
    dataDisplay.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
