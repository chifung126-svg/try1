(function () {
  var plans = [].slice.call(document.querySelectorAll('.plan'));
  var labels = [].slice.call(document.querySelectorAll('.selected-plan'));
  var prices = [].slice.call(document.querySelectorAll('.price'));
  var note = document.querySelector('[data-price-note]');
  function yen(value) { return value ? '¥' + Number(value).toLocaleString('ja-JP') : '料金未設定'; }
  function select(plan) {
    plans.forEach(function (item) {
      var active = item === plan;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    labels.forEach(function (item) { item.textContent = plan.dataset.plan; });
    prices.forEach(function (item) { item.textContent = yen(plan.dataset.price); });
    if (note) note.textContent = '税込・追加料金なし';
  }
  plans.forEach(function (plan) { plan.addEventListener('click', function () { select(plan); }); });
  var mobileBuy = document.querySelector('.mobile-buy');
  var hero = document.querySelector('.hero');
  if (mobileBuy && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      mobileBuy.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }
  document.querySelectorAll('[data-buy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var selected = document.querySelector('.plan.is-selected');
      if (!selected) return;
      var params = new URLSearchParams({
        days: selected.dataset.days || '7',
        product: 'malaysia_manual',
        plan: selected.dataset.plan || '',
        price: selected.dataset.price || '',
        variant: 'malaysia_manual'
      });
      window.location.href = 'checkout.html?' + params.toString();
    });
  });
}());
