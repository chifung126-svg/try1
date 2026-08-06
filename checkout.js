(function(){
  var query=new URLSearchParams(window.location.search), plan=query.get('plan')||'7日間 50GB', price=query.get('price');
  var planEl=document.getElementById('summary-plan'), side=document.getElementById('summary-plan-side'), priceEl=document.getElementById('summary-price'), total=document.getElementById('summary-total'), spec=document.getElementById('summary-spec'), date=document.getElementById('departure-date'), form=document.getElementById('checkout-form'), message=document.getElementById('checkout-message');
  var isKorea=(query.get('sku')||'').indexOf('eSIM-')===0;planEl.textContent=plan;if(side)side.textContent=plan;var formatted=price?'¥'+Number(price).toLocaleString('ja-JP'):'料金未設定';priceEl.textContent=formatted;if(total)total.textContent=formatted;
  if(isKorea){document.title='韓国旅行用eSIMの購入手続き | EasyGoSim';document.getElementById('checkout-country').textContent='KOREA eSIM';document.getElementById('checkout-title').textContent='韓国旅行用eSIM';document.getElementById('summary-network').textContent='SKT';document.getElementById('summary-network-side').textContent='SKT';document.getElementById('summary-type').textContent=plan.indexOf('無制限')>-1?'高速無制限':'毎日2GB高速';}
  var match=plan.match(/(\d+)日間\s*(\d+)GB/);if(spec)spec.textContent=match?match[2]+'GB / '+match[1]+'日間':'プランを選択してください';
  var today=new Date();date.min=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  form.addEventListener('submit',function(event){event.preventDefault();if(!form.checkValidity()){form.reportValidity();return;}message.textContent='入力内容を確認しました。決済画面へ進みます。';message.classList.add('is-visible');});
})();
