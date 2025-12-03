document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.otp-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });
    });
});

function verifyOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    let otp = '';
    
    inputs.forEach(input => {
        otp += input.value;
    });

    // Here you would typically make an API call to verify the OTP
    fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/dashboard.html';
        } else {
            alert('Invalid OTP. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error verifying OTP. Please try again.');
    });
}

function resendOTP() {
    // Implement resend OTP functionality
    fetch('/api/resend-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('New OTP has been sent!');
        } else {
            alert('Failed to resend OTP. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error resending OTP. Please try again.');
    });
}
