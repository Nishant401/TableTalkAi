document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const previewSection = document.getElementById('preview-section');
    const tablePreview = document.getElementById('table-preview');
    const rowCount = document.getElementById('row-count');
    const querySection = document.getElementById('query-section');
    const queryForm = document.getElementById('query-form');
    const queryInput = document.getElementById('query-input');
    const queryStatus = document.getElementById('query-status');
    const queryResult = document.getElementById('query-result');
    
    // Store current file ID
    let currentFileId = null;
    
    // Handle file upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];
        
        if (!file) {
            showStatus(uploadStatus, 'Please select a file.', 'error');
            return;
        }
        
        if (!file.name.endsWith('.csv')) {
            showStatus(uploadStatus, 'Only CSV files are supported.', 'error');
            return;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Show loading status
        showStatus(uploadStatus, 'Uploading file...', 'loading');
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStatus(uploadStatus, data.message, 'success');
                currentFileId = data.file_id;
                
                // Show preview
                renderTablePreview(data.preview);
                previewSection.classList.remove('hidden');
                
                // Show query section
                querySection.classList.remove('hidden');
                queryInput.focus();
            } else {
                showStatus(uploadStatus, data.message, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showStatus(uploadStatus, 'Error uploading file. Please try again.', 'error');
        }
    });
    
    // Handle query submission
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = queryInput.value.trim();
        
        if (!query) {
            showStatus(queryStatus, 'Please enter a query.', 'error');
            return;
        }
        
        if (!currentFileId) {
            showStatus(queryStatus, 'No file uploaded. Please upload a CSV file first.', 'error');
            return;
        }
        
        // Show loading status
        showStatus(queryStatus, 'Processing query...', 'loading');
        
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    file_id: currentFileId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showStatus(queryStatus, 'Query processed successfully.', 'success');
                renderQueryResult(data);
            } else {
                showStatus(queryStatus, data.message, 'error');
                queryResult.innerHTML = '';
            }
        } catch (error) {
            console.error('Query error:', error);
            showStatus(queryStatus, 'Error processing query. Please try again.', 'error');
        }
    });
    
    // Utility function to show status messages
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = 'status-message';
        
        if (type === 'success') {
            element.classList.add('status-success');
        } else if (type === 'error') {
            element.classList.add('status-error');
        } else if (type === 'loading') {
            element.classList.add('status-loading');
        }
    }
    
    // Render table preview
    function renderTablePreview(preview) {
        if (!preview || !preview.columns || !preview.rows) {
            tablePreview.innerHTML = '<p>No preview available</p>';
            return;
        }
        
        const table = document.createElement('div');
        table.className = 'table-container';
        
        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        ${preview.columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${preview.rows.map(row => `
                        <tr>
                            ${preview.columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        table.innerHTML = tableHTML;
        tablePreview.innerHTML = '';
        tablePreview.appendChild(table);
        
        // Update row count info
        rowCount.textContent = `Showing ${preview.displayed_rows} of ${preview.total_rows} rows`;
    }
    
    // Render query result
    function renderQueryResult(data) {
        queryResult.innerHTML = '';
        
        if (!data.success) {
            queryResult.innerHTML = `<p class="error-message">${data.message}</p>`;
            return;
        }
        
        if (data.result_type === 'answer') {
            // Simple answers
            const answers = Array.isArray(data.result) ? data.result : [data.result];
            queryResult.innerHTML = `
                <h3>Results:</h3>
                <p>${answers.join(', ')}</p>
            `;
        } else if (data.result_type === 'details') {
            // Details result (key-value pairs)
            const details = data.result;
            const detailsHTML = Object.entries(details)
                .map(([key, value]) => `
                    <div class="result-item">
                        <span class="result-key">${key}:</span> 
                        <span class="result-value">${value}</span>
                    </div>
                `)
                .join('');
            
            queryResult.innerHTML = `
                <h3>Record Details:</h3>
                <div class="details-container">
                    ${detailsHTML}
                </div>
            `;
        }
    }
});