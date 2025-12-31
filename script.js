// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = this;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
});

// Handle form submission (demo only - no real authentication)
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Demo validation - accept any non-empty input
    if (username.trim() && password.trim()) {
        // Simulate login success
        const button = document.querySelector('.login-button');
        const originalText = button.textContent;
        
        button.textContent = 'Đang đăng nhập...';
        button.disabled = true;
        button.style.opacity = '0.7';
        
        setTimeout(() => {
            alert(`Đăng nhập thành công!\n\nTên đăng nhập: ${username}\n\nĐây là sản phẩm demo, không có xác thực thực sự.`);
            button.textContent = originalText;
            button.disabled = false;
            button.style.opacity = '1';
            
            // Reset form
            document.getElementById('loginForm').reset();
        }, 1000);
    } else {
        alert('Vui lòng nhập đầy đủ thông tin đăng nhập!');
    }
});

// Add some interactive effects
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});



