(function () {
  var button = document.getElementById('pay-button');
  var status = document.getElementById('flow-status');
  if (!button || !status) return;
  button.addEventListener('click', async function () {
    var query = new URLSearchParams(window.location.search);
    var sku = query.get('sku') || '';
    var quantity = Number(document.getElementById('quantity')?.textContent || 1);
    if (!sku) {
      status.textContent = '商品情報を確認できません。商品ページからもう一度お試しください。';
      status.classList.add('is-visible');
      return;
    }
    button.disabled = true;
    status.textContent = '安全な決済ページを準備しています…';
    status.classList.add('is-visible');
    try {
      var response = await fetch('/api/jp/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: sku, quantity: quantity })
      });
      var result = await response.json();
      if (!response.ok || !result.paymentUrl) throw new Error(result.error || '決済ページを作成できませんでした。');
      window.location.assign(result.paymentUrl);
    } catch (error) {
      status.textContent = error.message || '決済ページを作成できませんでした。';
      button.disabled = false;
    }
  });
}());
