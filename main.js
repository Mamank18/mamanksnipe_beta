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

function showCopiedPopup() {
  const popup = document.createElement("div");
  popup.innerText = "Copied";
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.backgroundColor = "#2b3846";
  popup.style.color = "#00ffcc";
  popup.style.padding = "6px 12px";
  popup.style.borderRadius = "6px";
  popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  popup.style.fontSize = "14px";
  popup.style.zIndex = 9999;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showCopiedPopup();
  }, () => {
    alert("Gagal menyalin alamat token.");
  });
}

function renderCard(pair) {
  const priceChange = parseFloat(pair.priceChange?.h24 ?? 0);
  const changeClass = priceChange > 0 ? "positive" : priceChange < 0 ? "negative" : "";
  const solscanUrl = `https://solscan.io/token/${pair.baseToken.address}#holders`;
  const gmgnUrl = `https://gmgn.ai/${gmgnChains[latestChainId]}/token/${pair.baseToken.address}`;
  const solscanIcon = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png`;
  const gmgnIcon = "https://raw.githubusercontent.com/Mamank18/mamanksnipe_beta/main/assets/gmgn.png";
  const shortCA = `${pair.baseToken.address.slice(0, 6)}...${pair.baseToken.address.slice(-4)}`;

  return `
    <div class="image-wrapper">
      <img class="token-image" src="${pair.info?.imageUrl || 'https://via.placeholder.com/48'}" alt="icon"
        onclick="refreshSingleToken('${pair.baseToken.address}')"
        onerror="this.onerror=null;
                 if (this.src.includes('placeholder.com')) {
                   this.src='https://raw.githubusercontent.com/Mamank18/mamanksnipe_beta/main/assets/favicon.png';
                 } else {
                   this.src='https://via.placeholder.com/48';
                 }">
    </div>
    <div>
      <div class="value">
        <span><strong>${pair.baseToken.name}</strong> (${pair.baseToken.symbol}) | 
          <span style="text-decoration: underline; cursor: pointer;" onclick="copyToClipboard('${pair.baseToken.address}')">
            ${shortCA}
          </span>
          <a href="${solscanUrl}" target="_blank" style="margin-left: 8px;">
            <img src="${solscanIcon}" alt="Solscan" style="width: 16px; height: 16px; vertical-align: middle;" />
          </a> |
          ${pair.baseToken.symbol}/${pair.quoteToken.symbol} | ${pair.dexId}
          <a href="${gmgnUrl}" target="_blank" style="margin-left: 8px;">
            <img src="${gmgnIcon}" alt="GMGN" style="width: 16px; height: 16px; vertical-align: middle;" />
          </a>
        </span>
      </div>
      <div class="value ${changeClass}">
        MC: $${parseFloat(pair.marketCap || 0).toLocaleString()} |
        24h Change: ${priceChange}% | 
        V24h: $${parseFloat(pair.volume?.h24 || 0).toLocaleString()} | 
        Liq: $${parseFloat(pair.liquidity?.usd || 0).toLocaleString()} |   
        USD: $${parseFloat(pair.priceUsd).toFixed(6)}
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

      const chartBox = document.createElement("div");
      chartBox.className = "charts-per-token";

      const timeframes = ['1', '5', '15'];
      timeframes.forEach(tf => {
        const url = `https://www.gmgn.cc/kline/${gmgnChains[latestChainId]}/${pair.baseToken.address}?interval=${tf}&theme=dark`;
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.style.width = "100%";
        iframe.style.height = "300px";
        iframe.style.border = "none";
        chartBox.appendChild(iframe);
      });

      tokenBox.appendChild(card);
      tokenBox.appendChild(chartBox);
      wrapper.appendChild(tokenBox);
      resultDiv.appendChild(wrapper);
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
