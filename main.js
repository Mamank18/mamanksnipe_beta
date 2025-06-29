const gmgnChains = {
  solana: 'sol',
  ethereum: 'eth',
  bsc: 'bsc',
  tron: 'tron'
};

let latestChainId = "";
let latestTokenAddresses = "";
let latestPairData = {};

function formatState(state) {
  if (!state.id) return state.text;
  const imageUrl = $(state.element).data('image');
  return $(`<span style="display: flex; align-items: center;"><img src="${imageUrl}" style="width: 20px; height: 20px; margin-right: 8px; vertical-align: middle;"/>${state.text}</span>`);
}

$(document).ready(function () {
  $('#chainId').select2({
    templateResult: formatState,
    templateSelection: formatState,
    minimumResultsForSearch: -1
  });

  document.getElementById("fetchBtn").addEventListener("click", fetchTokenData);
  document.getElementById("tokenAddresses").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("fetchBtn").click();
    }
  });
});

function renderCard(pair) {
  const priceChange = parseFloat(pair.priceChange?.h24 ?? 0);
  const changeClass = priceChange > 0 ? "positive" : priceChange < 0 ? "negative" : "";

  return `
    <img class="token-image" src="${pair.info?.imageUrl || 'https://via.placeholder.com/48'}" alt="icon"
      onerror="this.onerror=null;
               if (this.src.includes('placeholder.com')) {
                 this.src='https://raw.githubusercontent.com/Mamank18/mamanksnipe_beta/main/assets/favicon.png';
               } else {
                 this.src='https://via.placeholder.com/48';
               }">
    <div>
      <div class="value">
        <span><strong>${pair.baseToken.name}</strong> (${pair.baseToken.symbol}) | ${pair.baseToken.address} | ${pair.baseToken.symbol}/${pair.quoteToken.symbol} | ${pair.dexId}</span>
      </div>
      <div class="value ${changeClass}">
        MC: $${parseFloat(pair.marketCap || 0).toLocaleString()} |
        24h Change: ${priceChange}% | 
        Volume: $${parseFloat(pair.volume?.h24 || 0).toLocaleString()} | 
        Liquidity: $${parseFloat(pair.liquidity?.usd || 0).toLocaleString()} | 
        FDV: $${parseFloat(pair.fdv || 0).toLocaleString()} |  
        USD: $${parseFloat(pair.priceUsd).toFixed(6)} |
      </div>
    </div>
  `;
}

async function fetchTokenData() {
  latestChainId = document.getElementById("chainId").value.trim();
  const rawInput = document.getElementById("tokenAddresses").value.trim();
  latestTokenAddresses = rawInput.split(",").map(addr => addr.trim()).join(",");
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "Loading...";

  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/${latestChainId}/${latestTokenAddresses}`);
    const data = await res.json();
    resultDiv.innerHTML = "";

    data.forEach(pair => {
      latestPairData[pair.baseToken.address] = pair;

      const wrapper = document.createElement("div");
      wrapper.className = "pair-container";
      wrapper.id = `wrapper-${pair.baseToken.address}`;

      const tokenBox = document.createElement("div");
      tokenBox.className = "token-box";

      const card = document.createElement("div");
      card.className = "card";
      card.id = `card-${pair.baseToken.address}`;
      card.innerHTML = renderCard(pair);
      card.addEventListener("click", () => refreshSingleToken(pair.baseToken.address));

      const chartBox = document.createElement("div");
      chartBox.className = "charts-per-token";
      const chartId = `chart-${pair.baseToken.address}`;
      chartBox.id = chartId;

      tokenBox.appendChild(card);
      tokenBox.appendChild(chartBox);
      wrapper.appendChild(tokenBox);
      resultDiv.appendChild(wrapper);

      loadCharts(pair.baseToken.address, latestChainId, 'dark', chartId);
    });
  } catch (err) {
    resultDiv.innerHTML = "Terjadi kesalahan saat mengambil data.";
    console.error(err);
  }
}

async function refreshSingleToken(address) {
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/${latestChainId}/${address}`);
    const data = await res.json();
    const pair = data[0];
    latestPairData[pair.baseToken.address] = pair;
    const cardEl = document.getElementById(`card-${pair.baseToken.address}`);
    if (cardEl) cardEl.innerHTML = renderCard(pair);
  } catch (err) {
    console.error("Gagal refresh data:", err);
  }
}

function loadCharts(ca, chain, theme, containerId) {
  const timeframes = ['1', '5', '15', '60'];
  const gmgnChain = gmgnChains[chain] || chain;
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  timeframes.forEach(tf => {
    const url = `https://www.gmgn.cc/kline/${gmgnChain}/${ca}?interval=${tf}&theme=${theme}`;
    const div = document.createElement('div');
    div.innerHTML = `<iframe src="${url}"></iframe>`;
    container.appendChild(div);
  });
}
