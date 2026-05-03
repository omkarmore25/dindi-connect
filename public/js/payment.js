document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const groupName = urlParams.get('groupName') || 'Vandan Community (General)';
  const groupId = urlParams.get('groupId') || '';

  // Set UI
  document.getElementById('paymentTargetName').textContent = groupName;
  document.getElementById('donateGroupId').value = groupId;

  // Amount selection logic
  window.selectAmount = (amount, btn) => {
    document.getElementById('donateAmount').value = amount;
    
    // Reset all buttons to default state
    document.querySelectorAll('.amount-btn').forEach(b => {
      b.classList.remove('bg-brand-500', 'text-white', 'shadow-lg', 'shadow-brand-500/20');
      b.classList.add('glass-input', 'text-slate-600', 'dark:text-white', 'border-transparent');
    });

    // Highlight selected button
    btn.classList.add('bg-brand-500', 'text-white', 'shadow-lg', 'shadow-brand-500/20');
    btn.classList.remove('glass-input', 'text-slate-600', 'dark:text-white', 'border-transparent');
  };

  // Close logic
  window.handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  // Payment logic
  const paymentForm = document.getElementById('paymentForm');
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('donateSubmitBtn');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = '<span class="animate-pulse">Processing...</span>';
    btn.disabled = true;

    const data = {
      amount: document.getElementById('donateAmount').value,
      groupId: document.getElementById('donateGroupId').value || null,
      groupName: document.getElementById('paymentTargetName').textContent,
      donorName: document.getElementById('donateName').value,
      donorEmail: document.getElementById('donateEmail').value,
      donorPhone: document.getElementById('donatePhone').value,
      message: document.getElementById('donateMessage').value,
    };

    try {
      const orderRes = await fetch('/api/donations/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const configRes = await fetch('/api/donations/config');
      const { keyId } = await configRes.json();

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dindi Platform",
        description: `Support for ${data.groupName}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          btn.innerHTML = '<span class="animate-pulse">Verifying...</span>';
          const verifyRes = await fetch('/api/donations/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donationId: orderData.donationId
            })
          });
          
          if (verifyRes.ok) {
             alert('Thank you for your support! Your payment was successful.');
             window.location.href = `/group.html?id=${data.groupId}` || '/';
          } else {
             const errorData = await verifyRes.json();
             alert(`Payment verification failed: ${errorData.error || 'Unknown error'}. Please contact support.`);
             btn.innerHTML = originalContent;
             btn.disabled = false;
          }
        },
        prefill: {
          name: data.donorName,
          email: data.donorEmail,
          contact: data.donorPhone
        },
        theme: { color: "#f97316" },
        modal: {
          ondismiss: function() {
            btn.innerHTML = originalContent;
            btn.disabled = false;
          }
        }
      };
      const rzp1 = new Razorpay(options);
      rzp1.open();

    } catch (err) {
      alert(err.message || 'Payment initiation failed.');
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  });

  // Handle custom amount input
  document.getElementById('donateAmount').addEventListener('input', () => {
    // Reset buttons when custom amount is typed
    document.querySelectorAll('.amount-btn').forEach(b => {
      b.classList.remove('bg-brand-500', 'text-white', 'shadow-lg', 'shadow-brand-500/20');
      b.classList.add('glass-input', 'text-slate-600', 'dark:text-white', 'border-transparent');
    });
  });
});
