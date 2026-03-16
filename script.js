/* ─── TRADECALC · script.js ──────────────────────────────────── */

// ── Helpers ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '-') + Math.abs(n).toFixed(2) + '%';
}

function showError(msg) {
  $('errorMsg').textContent = msg;
}

function clearError() {
  $('errorMsg').textContent = '';
}

// ── Main Calculate ─────────────────────────────────────────────
function calculate() {
  clearError();

  const margin   = parseFloat($('tradingMode').value);
  const capital  = parseFloat($('capital').value);
  const gainPct  = parseFloat($('gainPct').value);
  const slPct    = parseFloat($('slPct').value);

  // Validation
  if (isNaN(capital) || capital <= 0) {
    showError('⚠ Please enter a valid capital amount.');
    return;
  }
  if (isNaN(gainPct) || gainPct < 0) {
    showError('⚠ Please enter a valid gain percentage.');
    return;
  }
  if (isNaN(slPct) || slPct < 0) {
    showError('⚠ Please enter a valid stop loss percentage.');
    return;
  }

  // Core calculations
  const tradeSize = capital * margin;

  const gains = [gainPct, gainPct * 2, gainPct * 3];
  const profits = gains.map(g => tradeSize * (g / 100));

  const loss = tradeSize * (slPct / 100);

  const capAfterProfit = capital + profits[0];
  const capAfterLoss   = capital - loss;

  const modeName = margin === 5
    ? 'Intraday Trading · 5× Margin'
    : 'MFT / Swing Trading · 3.4× Margin';

  // ── Populate Results ─────────────────────────────────────
  $('resultsMeta').textContent =
    `${modeName}  ·  Capital: ${fmt(capital)}`;

  $('tradeSizeDisplay').textContent = fmt(tradeSize);
  $('marginNote').textContent       = `${margin}× of ${fmt(capital)}`;

  // Profit scenarios
  const scenarioContainer = $('profitScenarios');
  scenarioContainer.innerHTML = '';

  const labels = ['Base', 'Double', 'Triple'];
  gains.forEach((g, i) => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.innerHTML = `
      <div class="sc-badge">${labels[i]} · ${g.toFixed(1)}%</div>
      <div class="sc-profit">${fmt(profits[i])}</div>
      <div class="sc-sub">Trade size × ${g.toFixed(1)}%</div>
    `;
    scenarioContainer.appendChild(card);
  });

  // Loss card
  $('lossCard').innerHTML = `
    <div class="loss-main">
      <div class="loss-label">Max Loss at Stop Loss (${slPct.toFixed(2)}%)</div>
      <div class="loss-value">−${fmt(loss)}</div>
    </div>
    <div class="loss-info">
      Trade Size: ${fmt(tradeSize)}<br/>
      Risk: ${slPct.toFixed(2)}% of position
    </div>
  `;

  // Capital impact
  const capAfterProfitDelta = fmtPct((profits[0] / capital) * 100);
  const capAfterLossDelta   = fmtPct(-(loss / capital) * 100);

  $('capitalGrid').innerHTML = `
    <div class="capital-card after-gain">
      <div class="cap-label">Capital After Gain (Base)</div>
      <div class="cap-value">${fmt(capAfterProfit)}</div>
      <div class="cap-delta">${capAfterProfitDelta} on invested capital</div>
    </div>
    <div class="capital-card after-loss">
      <div class="cap-label">Capital After Stop Loss</div>
      <div class="cap-value">${fmt(capAfterLoss)}</div>
      <div class="cap-delta">${capAfterLossDelta} on invested capital</div>
    </div>
  `;

  // Risk/Reward bar
  const rrRatio = slPct > 0 ? (gainPct / slPct).toFixed(2) : '∞';
  $('rrRatio').textContent = `R:R = 1 : ${rrRatio}`;

  const total = profits[0] + loss;
  const rewardWidth = total > 0 ? ((profits[0] / total) * 100).toFixed(1) : 50;
  const riskWidth   = total > 0 ? ((loss       / total) * 100).toFixed(1) : 50;

  $('rewardBar').style.width = rewardWidth + '%';
  $('riskBar').style.width   = riskWidth   + '%';

  // ── Switch View ────────────────────────────────────────────
  $('inputView').classList.add('hidden');
  $('resultsView').classList.remove('hidden');

  // Scroll top of card
  $('calculatorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Recalculate ─────────────────────────────────────────────
function recalculate() {
  $('resultsView').classList.add('hidden');
  $('inputView').classList.remove('hidden');
  $('calculatorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Enter key support ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['capital', 'gainPct', 'slPct'].forEach(id => {
    $(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });
  });
});
