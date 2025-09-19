document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('bookingForm');
    const formMessage = document.getElementById('formMessage');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Simple client-side validation
        if (!form.name.value || !form.email.value || !form.phone.value || !form.checkin.value || !form.checkout.value || !form.guests.value) {
            formMessage.innerHTML = '<p style="color: red;">Please fill in all required fields.</p>';
            return;
        }

        // Prepare data for server submission
        const formData = {
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value,
            checkin: form.checkin.value,
            checkout: form.checkout.value,
            guests: form.guests.value,
            requests: form.requests.value
        };

        fetch('/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                formMessage.innerHTML = '<p style="color: green;">Booking submitted successfully! We will contact you soon.</p>';
                form.reset();
            } else {
                formMessage.innerHTML = '<p style="color: red;">Error submitting booking. Please try again.</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            formMessage.innerHTML = '<p style="color: red;">Error submitting booking. Please try again.</p>';
        });
    });
});
