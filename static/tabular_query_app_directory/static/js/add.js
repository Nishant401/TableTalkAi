$(document).ready(function() {
    $('#add-form').submit(function(e) {
        e.preventDefault();
        
        const formData = $(this).serialize();
        
        $.ajax({
            url: '/add',
            method: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    alert('New actor added successfully!');
                    window.location.href = '/';
                }
            },
            error: function(xhr, status, error) {
                alert('An error occurred: ' + error);
            }
        });
    });
});