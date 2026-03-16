/* ─── TradeCalc · script.js ──────────────────────────────────── */

const $ = id => document.getElementById(id);

// ── Formatting helpers ────────────────────────────────────────
function fmtINR(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtDelta(n, capital) {
  const pct = ((n / capital) * 100).toFixed(2);
  return (n >= 0 ? '+' : '−') + fmtINR(Math.abs(n)) + ' (' + (n >= 0 ? '+' : '−') + Math.abs(pct) + '% on capital)';
}

function showError(msg) { $('errorMsg').textContent = msg; }
function clearError()   { $('errorMsg').textContent = ''; }

// ── Mode tab selection ────────────────────────────────────────
function selectMode(btn) {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const isCustom = btn.dataset.value === 'custom';
  $('customMarginWrap').classList.toggle('hidden', !isCustom);
  if (isCustom) $('customMargin').focus();
}

// ── Get active margin ─────────────────────────────────────────
function getMargin() {
  const activeTab = document.querySelector('.mode-tab.active');
  if (!activeTab) return null;

  const val = activeTab.dataset.value;
  if (val === 'custom') {
    const cm = parseFloat($('customMargin').value);
    if (isNaN(cm) || cm < 1 || cm > 20) return null;
    return { value: cm, label: `Custom · ${cm}× Margin` };
  }
  const num = parseFloat(val);
  const label = num === 5
    ? 'Intraday Trading · 5× Margin'
    : 'MFT / Swing Trading · 3.4× Margin';
  return { value: num, label };
}

// ── Main calculate ────────────────────────────────────────────
function calculate() {
  clearError();

  const marginData = getMargin();
  if (!marginData) {
    showError('⚠ Please enter a valid custom margin between 1× and 20×.');
    return;
  }

  const capital = parseFloat($('capital').value);
  const gainPct = parseFloat($('gainPct').value);
  const slPct   = parseFloat($('slPct').value);

  if (isNaN(capital) || capital <= 0) {
    showError('⚠ Please enter a valid capital amount.'); return;
  }
  if (isNaN(gainPct) || gainPct < 0) {
    showError('⚠ Please enter a valid expected gain %.'); return;
  }
  if (isNaN(slPct) || slPct < 0) {
    showError('⚠ Please enter a valid stop loss %.'); return;
  }

  const { value: margin, label: modeName } = marginData;
  const tradeSize = capital * margin;

  // Profit scenarios
  const gains   = [gainPct, gainPct * 2, gainPct * 3];
  const profits = gains.map(g => tradeSize * (g / 100));

  // Loss
  const loss = tradeSize * (slPct / 100);

  // Capital impact
  const capGain = capital + profits[0];
  const capLoss = capital - loss;

  // ── Populate DOM ─────────────────────────────────────────

  $('ridMode').textContent = modeName;

  $('tradeSizeVal').textContent = fmtINR(tradeSize);
  $('tradeSizeSub').textContent = `${margin}× leverage on ${fmtINR(capital)}`;
  $('capitalStat').textContent  = fmtINR(capital);
  $('leverageStat').textContent = `${margin}×`;

  // Profit cards
  const labels = ['Base', 'Double', 'Triple'];
  $('profitScenarios').innerHTML = gains.map((g, i) => `
    <div class="profit-card">
      <div class="pc-badge">${labels[i]} · +${g.toFixed(1)}%</div>
      <div class="pc-value">${fmtINR(profits[i])}</div>
      <div class="pc-sub">On ${fmtINR(tradeSize)} position</div>
    </div>
  `).join('');

  // Loss block
  $('lossBlock').innerHTML = `
    <div class="loss-top">
      <span class="bl-dot loss-dot"></span>Stop Loss Hit · ${slPct.toFixed(2)}%
    </div>
    <div class="loss-amt">−${fmtINR(loss)}</div>
    <div class="loss-detail">
      Position: ${fmtINR(tradeSize)}<br/>
      Risk: ${slPct.toFixed(2)}% of trade size
    </div>
  `;

  // R:R block
  const rrVal = slPct > 0 ? (gainPct / slPct).toFixed(2) : '∞';
  const total = profits[0] + loss;
  const gw = total > 0 ? ((profits[0] / total) * 100).toFixed(1) : 50;
  const lw = total > 0 ? ((loss / total) * 100).toFixed(1) : 50;

  $('rrBlock').innerHTML = `
    <div>
      <div class="rr-top">Risk / Reward Ratio</div>
      <div class="rr-ratio">1 : ${rrVal}</div>
    </div>
    <div>
      <div class="rr-track">
        <div class="rr-gain-bar" style="width:${gw}%"></div>
        <div class="rr-loss-bar" style="width:${lw}%"></div>
      </div>
      <div class="rr-labels">
        <span style="color:var(--gain)">Reward ${gw}%</span>
        <span style="color:var(--loss)">Risk ${lw}%</span>
      </div>
    </div>
  `;

  // Capital row
  $('capitalRow').innerHTML = `
    <div class="cap-card gain-cap">
      <div class="cap-label">Capital After Gain (Base)</div>
      <div class="cap-value">${fmtINR(capGain)}</div>
      <div class="cap-delta">${fmtDelta(profits[0], capital)}</div>
    </div>
    <div class="cap-card loss-cap">
      <div class="cap-label">Capital After Stop Loss</div>
      <div class="cap-value">${fmtINR(capLoss)}</div>
      <div class="cap-delta">${fmtDelta(-loss, capital)}</div>
    </div>
  `;

  // Switch view
  $('inputView').classList.add('hidden');
  $('resultsView').classList.remove('hidden');
  $('calculatorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Recalculate ───────────────────────────────────────────────
function recalculate() {
  $('resultsView').classList.add('hidden');
  $('inputView').classList.remove('hidden');
  $('calculatorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Enter key ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['capital', 'gainPct', 'slPct', 'customMargin'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });
  });
});
