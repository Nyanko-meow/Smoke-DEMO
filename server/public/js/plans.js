document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    // Update UI based on login status
    updateNavigation(token);

    // Fetch plans from API
    try {
        const response = await fetch('/api/memberships/plans');
        const plans = await response.json();

        // Display plans
        displayPlans(plans, token, role);
    } catch (error) {
        console.error('Error fetching plans:', error);
        showAlert('Failed to load membership plans', 'danger');
    }

    // Check if user already has a membership
    if (token) {
        try {
            const response = await fetch('/api/memberships/my-plan', {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();

            if (data.hasMembership) {
                showCurrentMembership(data.membership);
            }
        } catch (error) {
            console.error('Error checking membership:', error);
        }
    }
});

function updateNavigation(token) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');

    if (token) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (profileBtn) profileBtn.style.display = 'block';
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
    }
}

function displayPlans(plans, token, userRole) {
    const plansContainer = document.getElementById('plans-container');
    plansContainer.innerHTML = '';

    plans.forEach(plan => {
        const isGuest = plan.Name.includes('Khách') || plan.Name.includes('Miễn phí');
        const featuresHtml = plan.Features.split('\n').map(feature => `<li>${feature}</li>`).join('');

        const planCard = document.createElement('div');
        planCard.className = 'col-md-4 mb-4';
        planCard.innerHTML = `
            <div class="card h-100 ${isGuest ? 'border-success' : ''}">
                <div class="card-header ${isGuest ? 'bg-success text-white' : 'bg-primary text-white'}">
                    <h5 class="card-title mb-0">${plan.Name}</h5>
                </div>
                <div class="card-body d-flex flex-column">
                    <h2 class="card-price">${new Intl.NumberFormat('vi-VN').format(plan.Price)} VNĐ</h2>
                    <p class="card-duration">${plan.Duration} ngày</p>
                    <ul class="plan-features">
                        ${featuresHtml}
                    </ul>
                    <div class="mt-auto">
                        ${userRole === 'member' && !isGuest
                ? `<button class="btn btn-primary btn-block purchase-btn" data-plan-id="${plan.PlanID}">Nâng cấp</button>`
                : isGuest
                    ? `<button class="btn btn-success btn-block" disabled>Miễn phí</button>`
                    : `<button class="btn btn-primary btn-block purchase-btn" data-plan-id="${plan.PlanID}">Đăng ký</button>`
            }
                    </div>
                </div>
            </div>
        `;

        plansContainer.appendChild(planCard);
    });

    // Add event listeners to purchase buttons
    document.querySelectorAll('.purchase-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const planId = e.target.dataset.planId;

            if (!token) {
                // Redirect to login if not logged in
                window.location.href = '/login.html?redirect=plans';
                return;
            }

            // Show payment modal
            showPaymentModal(planId);
        });
    });
}

function showPaymentModal(planId) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="paymentModal" tabindex="-1" role="dialog" aria-labelledby="paymentModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="paymentModalLabel">Thanh toán gói dịch vụ</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="payment-form">
                            <div class="form-group">
                                <label for="payment-method">Phương thức thanh toán</label>
                                <select class="form-control" id="payment-method">
                                    <option value="Credit Card">Thẻ tín dụng</option>
                                    <option value="Bank Transfer">Chuyển khoản ngân hàng</option>
                                    <option value="Momo">Ví MoMo</option>
                                    <option value="ZaloPay">ZaloPay</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="card-number">Số thẻ</label>
                                <input type="text" class="form-control" id="card-number" placeholder="XXXX XXXX XXXX XXXX">
                            </div>
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="expiry-date">Ngày hết hạn</label>
                                    <input type="text" class="form-control" id="expiry-date" placeholder="MM/YY">
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="cvv">CVV</label>
                                    <input type="text" class="form-control" id="cvv" placeholder="XXX">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary" id="confirm-payment">Xác nhận thanh toán</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    $('#paymentModal').modal('show');

    // Handle confirm payment
    document.getElementById('confirm-payment').addEventListener('click', async () => {
        const paymentMethod = document.getElementById('payment-method').value;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/memberships/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    planId,
                    paymentMethod
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Close modal
                $('#paymentModal').modal('hide');

                // Show success message
                showAlert(`Đăng ký gói ${data.plan} thành công!`, 'success');

                // Update user role to member
                localStorage.setItem('userRole', 'member');

                // Reload page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showAlert(data.error || 'Thanh toán thất bại', 'danger');
            }
        } catch (error) {
            console.error('Error during payment:', error);
            showAlert('Đã có lỗi xảy ra', 'danger');
        }
    });

    // Clean up when modal is closed
    $('#paymentModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

function showCurrentMembership(membership) {
    const alertContainer = document.getElementById('alert-container');

    const endDate = new Date(membership.EndDate).toLocaleDateString('vi-VN');

    alertContainer.innerHTML = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <strong>Gói hiện tại:</strong> Bạn đang sử dụng gói ${membership.Name}, có hiệu lực đến ngày ${endDate}.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        $(alert).alert('close');
    }, 5000);
} 