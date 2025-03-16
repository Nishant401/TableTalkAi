$(document).ready(function() {
    // Form submission for queries
    $('#query-form').submit(function(e) {
        e.preventDefault();
        
        const query = $('#query-input').val().trim();
        if (!query) return;
        
        $.ajax({
            url: '/query',
            method: 'POST',
            data: { query: query },
            success: function(response) {
                // Display the query and result section
                $('#results-card').show();
                $('#query-text').text(response.query);
                
                // Handle different types of responses
                if (response.result === 'redirect_add') {
                    window.location.href = '/add';
                    return;
                }
                
                if (response.result === 'table') {
                    // Display table result
                    $('#text-result').hide();
                    $('#table-result').show();
                    
                    // Clear previous results
                    $('#result-table thead').empty();
                    $('#result-table tbody').empty();
                    
                    // Build table header
                    const headerRow = $('<tr>');
                    response.columns.forEach(function(column) {
                        headerRow.append($('<th>').text(column));
                    });
                    $('#result-table thead').append(headerRow);
                    
                    // Build table body
                    response.data.forEach(function(row) {
                        const tableRow = $('<tr>');
                        response.columns.forEach(function(column) {
                            tableRow.append($('<td>').text(row[column]));
                        });
                        $('#result-table tbody').append(tableRow);
                    });
                } else {
                    // Display text result
                    $('#table-result').hide();
                    $('#text-result').show().text(response.result);
                }
                
                // Clear the input for the next query
                $('#query-input').val('');
            },
            error: function(xhr, status, error) {
                alert('An error occurred: ' + error);
            }
        });
    });
    
    // Add button click
    $('#add-btn').click(function() {
        window.location.href = '/add';
    });
    
    // Reset button click
    $('#reset-btn').click(function() {
        if (confirm('Are you sure you want to reset the table to its initial state?')) {
            $.ajax({
                url: '/reset',
                method: 'POST',
                success: function(response) {
                    if (response.success) {
                        alert('Table has been reset successfully.');
                        window.location.reload();
                    }
                }
            });
        }
    });
});