(function () {
  var query = new URLSearchParams(window.location.search);
  var plan = query.get('plan') || '7日間 50GB';
  var price = query.get('price');
  var sku = query.get('sku') || query.get('variant');
  var planEl = document.getElementById('summary-plan');
  var side = document.getElementById('summary-plan-side');
  var priceEl = document.getElementById('summary-price');
  var total = document.getElementById('summary-total');
  var spec = document.getElementById('summary-spec');
  var date = document.getElementById('departure-date');
  var form = document.getElementById('checkout-form');
  var message = document.getElementById('checkout-message');
  var submit = form.querySelector('button[type="submit"]');
  var isKorea = /^KR|^eSIM-KR/i.test(sku || '');


  planEl.textContent = plan;
  if (side) side.textContent = plan;
  var formatted = price ? '¥' + Number(price).toLocaleString('ja-JP') : '料金確認中';
  priceEl.textContent = formatted;
  if (total) total.textContent = formatted;


  if (isKorea) {
    document.title = '韓国旅行用eSIMの購入手続き | EasyGoSim';
    document.getElementById('checkout-country').textContent = 'KOREA eSIM';
    document.getElementById('checkout-title').textContent = '韓国旅行用eSIM';
    document.getElementById('summary-network').textContent = 'SKT';
    document.getElementById('summary-network-side').textContent = 'SKT';
    document.getElementById('summary-type').textContent = plan.indexOf('無制限') > -1 ? '高速無制限' : '毎日2GB高速';
  }


  var match = plan.match(/(\\d+)日間\\s*(\\d+)GB/);
  if (spec) spec.textContent = match ? match[2] + 'GB / ' + match[1] + '日間' : 'データ通信専用';
  var today = new Date();
  date.min = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');


  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!sku) { message.textContent = '商品情報を確認できません。商品ページからもう一度お試しください。'; message.classList.add('is-visible'); return; }


    submit.disabled = true;
    submit.textContent = '決済画面を準備しています…';
    message.textContent = '';
    message.classList.remove('is-visible');
    var data = new FormData(form);
    try {
      var response = await fetch('/api/jp/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: 'JP',
          countryCode: 'KR',
          // Keep the complete database SKU, e.g. eSIM-KR2G-01.
          skuId: query.get('variant') || sku,
          quantity: 1,
          customerName: data.get('name'),
          customerEmail: data.get('email')
        })
      });
      var result = await response.json();
      if (!response.ok || !result.paymentUrl) throw new Error(result.error || '決済ページを作成できませんでした。');
      window.location.assign(result.paymentUrl);
