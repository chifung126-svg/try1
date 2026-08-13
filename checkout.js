(function () {
  var query = new URLSearchParams(window.location.search);
  var days = Number(query.get('days') || 7);
  var plans = {
    7: { label: '7日間 50GB', price: 1980, data: '50GB' },
    15: { label: '15日間 150GB', price: 2640, data: '150GB' },
    30: { label: '30日間 300GB', price: 3840, data: '300GB' }
  };
  var current = plans[days] || plans[7];
  var plan = query.get('plan') || current.label;
  var price = Number(query.get('price') || current.price);
  var planEl = document.getElementById('summary-plan');
  var side = document.getElementById('summary-plan-side');
  var priceEl = document.getElementById('summary-price');
  var total = document.getElementById('summary-total');
  var spec = document.getElementById('summary-spec');
  var date = document.getElementById('departure-date');
  var form = document.getElementById('checkout-form');
  var message = document.getElementById('checkout-message');
  var submit = form.querySelector('button[type="submit"]');

  planEl.textContent = plan;
  if (side) side.textContent = plan;
  var formatted = '¥' + price.toLocaleString('ja-JP');
  priceEl.textContent = formatted;
  if (total) total.textContent = formatted;
  if (spec) spec.textContent = current.data + ' / ' + days + '日間';

  var today = new Date();
  date.min = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    submit.disabled = true;
    message.textContent = '';
    message.classList.remove('is-visible');
    var data = new FormData(form);
    try {
      var response = await fetch('https://easygosim-japan-production.up.railway.app/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_key: 'malaysia_manual',
          days: days,
          email: data.get('email'),
          name: data.get('name'),
          departure_date: data.get('departure_date')
        })
      });
      var result = await response.json();
      if (!response.ok || !result.payment_url) throw new Error(result.error || '決済ページを作成できませんでした。');
      window.location.assign(result.payment_url);
    } catch (error) {
      message.textContent = error.message || '決済ページを作成できませんでした。';
      message.classList.add('is-visible');
      submit.disabled = false;
    }
  });
}());
