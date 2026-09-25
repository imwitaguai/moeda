const currencies = {
  BRL: {
    country: "Brasil",
    flag: "🇧🇷",
    image: "flag1.png",
    name: "Real",
    capital: "Brasília",
    region: "América do Sul",
    symbol: "R$",
    perBRL: 1,
    color: "#e0f9e8",
  },
  MXN: {
    country: "México",
    flag: "🇲🇽",
    image: "flag2.png",
    name: "Peso mexicano",
    capital: "Cidade do México",
    region: "América do Norte",
    symbol: "$",
    perBRL: 3.5,
    color: "#ffe2ec",
  },
  ARS: {
    country: "Argentina",
    flag: "🇦🇷",
    image: "flag3.png",
    name: "Peso argentino",
    capital: "Buenos Aires",
    region: "América do Sul",
    symbol: "$",
    perBRL: 200,
    color: "#e9dfff",
  },
  USD: {
    country: "Estados Unidos",
    flag: "🇺🇸",
    image: "flag4.png",
    name: "Dólar americano",
    capital: "Washington, D.C.",
    region: "América do Norte",
    symbol: "US$",
    perBRL: 0.2,
    color: "#dfefff",
  },
  CAD: {
    country: "Canadá",
    flag: "🇨🇦",
    image: "flag5.png",
    name: "Dólar canadense",
    capital: "Ottawa",
    region: "América do Norte",
    symbol: "C$",
    perBRL: 0.27,
    color: "#fff0d2",
  },
  CLP: {
    country: "Chile",
    flag: "🇨🇱",
    image: "flag6.png",
    name: "Peso chileno",
    capital: "Santiago",
    region: "América do Sul",
    symbol: "$",
    perBRL: 180,
    color: "#ffe0e9",
  },
  EGP: {
    country: "Egito",
    flag: "🇪🇬",
    image: "egito.png",
    name: "Libra egípcia",
    capital: "Cairo",
    region: "África",
    symbol: "E£",
    perBRL: 9,
    color: "#fff0d2",
  },
  JPY: {
    country: "Japão",
    flag: "🇯🇵",
    image: "japan.png",
    name: "Iene japonês",
    capital: "Tóquio",
    region: "Ásia",
    symbol: "¥",
    perBRL: 30,
    color: "#e9dfff",
  },
  EUR: {
    country: "França",
    flag: "🇫🇷",
    image: "france.png",
    name: "Euro",
    capital: "Paris",
    region: "Europa",
    symbol: "€",
    perBRL: 0.16,
    color: "#dfefff",
  },
  AUD: {
    country: "Austrália",
    flag: "🇦🇺",
    image: "australia.png",
    name: "Dólar australiano",
    capital: "Canberra",
    region: "Oceania",
    symbol: "A$",
    perBRL: 0.27,
    color: "#e0f9e8",
  },
  GBP: {
    country: "Reino Unido",
    flag: "🇬🇧",
    image: "reino.png",
    name: "Libra esterlina",
    capital: "Londres",
    region: "Europa",
    symbol: "£",
    perBRL: 0.14,
    color: "#e6e0ff",
  },
  ANT: {
    country: "Antártida",
    flag: "🇦🇶",
    name: "Não possui moeda oficial",
    capital: "Não possui capital",
    region: "Antártida",
    symbol: "—",
    color: "#e6f6ff",
    convertible: false,
  },
};

const convertibleCodes = Object.keys(currencies).filter(
  (code) => currencies[code].convertible !== false,
);
const educationalRates = Object.freeze(
  Object.fromEntries(
    convertibleCodes.map((code) => [code, currencies[code].perBRL]),
  ),
);
const amount = document.querySelector("#amount");
const from = document.querySelector("#from");
const to = document.querySelector("#to");
const coin = "&#x1FA99;";
const rateState = {
  status: "loading",
  liveCodes: new Set(),
  updatedAtByCode: {},
};
const PUBLIC_AWESOME_URL = `https://economia.awesomeapi.com.br/json/last/${convertibleCodes
  .filter((code) => code !== "BRL")
  .map((code) => `${code}-BRL`)
  .join(",")}`;
let ratesRequestId = 0;
let ratesAbortController;

const fmt = (value) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const currencyWords = {
  BRL: ["real", "reais"],
  MXN: ["peso mexicano", "pesos mexicanos"],
  ARS: ["peso argentino", "pesos argentinos"],
  USD: ["dólar americano", "dólares americanos"],
  CAD: ["dólar canadense", "dólares canadenses"],
  CLP: ["peso chileno", "pesos chilenos"],
  EGP: ["libra egípcia", "libras egípcias"],
  JPY: ["iene japonês", "ienes japoneses"],
  EUR: ["euro", "euros"],
  AUD: ["dólar australiano", "dólares australianos"],
  GBP: ["libra esterlina", "libras esterlinas"],
};

const isValidRate = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 1e-9 &&
  value <= 1e12;

function options(select, chosen) {
  select.innerHTML = Object.entries(currencies)
    .filter(([, currency]) => currency.convertible !== false)
    .map(
      ([code, currency]) =>
        `<option value="${code}" ${code === chosen ? "selected" : ""}>${currency.country} &middot; ${code}</option>`,
    )
    .join("");
}

function updateSelectFlag(select) {
  const currency = currencies[select.value];
  const box = select.closest(".currency-box");
  const trigger = box.querySelector(".flag-select-btn");
  const flagImg = trigger.querySelector(".flag-select-btn-flag");
  if (flagImg) {
    flagImg.src = currency.image;
    flagImg.alt = `Bandeira do ${currency.country}`;
  }
  const countryEl = trigger.querySelector(".flag-select-country");
  const codeEl = trigger.querySelector(".flag-select-code");
  if (countryEl && codeEl) {
    countryEl.textContent = currency.country;
    codeEl.textContent = select.value;
  } else {
    const label = trigger.querySelector(".flag-select-btn-label");
    if (label) label.textContent = `${currency.country} · ${select.value}`;
  }
  const roleLabel = box.querySelector("label")?.textContent || "Moeda";
  trigger.setAttribute(
    "aria-label",
    `${roleLabel}: ${currency.country} (${select.value}) - ${currency.name}`,
  );
  box.querySelectorAll(".flag-select-list li[data-code]").forEach((item) => {
    item.setAttribute(
      "aria-selected",
      String(item.dataset.code === select.value),
    );
  });
}

function closeFlagSelect(box) {
  const list = box.querySelector(".flag-select-list");
  const trigger = box.querySelector(".flag-select-btn");
  list.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function openFlagSelect(box) {
  document.querySelectorAll(".currency-box").forEach((other) => {
    if (other !== box) closeFlagSelect(other);
  });
  const list = box.querySelector(".flag-select-list");
  const trigger = box.querySelector(".flag-select-btn");
  list.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  list
    .querySelector('[aria-selected="true"]')
    ?.scrollIntoView({ block: "nearest" });
}

function initFlagSelect(select) {
  const box = select.closest(".currency-box");
  const trigger = box.querySelector(".flag-select-btn");
  const list = box.querySelector(".flag-select-list");

  list.innerHTML = Object.entries(currencies)
    .filter(([, currency]) => currency.convertible !== false)
    .map(
      ([code, currency]) =>
        `<li role="option" tabindex="0" data-code="${code}" aria-selected="${code === select.value}"><img src="${currency.image}" alt="Bandeira do ${currency.country}"><span>${currency.country} &middot; ${code}</span></li>`,
    )
    .join("");

  trigger.addEventListener("click", () => {
    if (list.hidden) openFlagSelect(box);
    else closeFlagSelect(box);
  });

  trigger.addEventListener("keydown", (event) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openFlagSelect(box);
      (
        list.querySelector('[aria-selected="true"]') || list.firstElementChild
      )?.focus();
    } else if (event.key === "Escape") {
      closeFlagSelect(box);
    }
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest("li[data-code]");
    if (!item) return;
    select.value = item.dataset.code;
    select.dispatchEvent(new Event("change"));
    closeFlagSelect(box);
    trigger.focus();
  });

  list.addEventListener("keydown", (event) => {
    const items = [...list.querySelectorAll("li[data-code]")];
    const index = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      (items[index + 1] || items[0]).focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      (items[index - 1] || items[items.length - 1]).focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.activeElement.click();
    } else if (event.key === "Escape") {
      closeFlagSelect(box);
      trigger.focus();
    }
  });
}

function getPairRateState(originCode, destinationCode) {
  if (originCode === destinationCode) return { kind: "neutral" };
  if (rateState.status === "loading") return { kind: "loading" };

  const foreignCodes = [
    ...new Set([originCode, destinationCode].filter((code) => code !== "BRL")),
  ];
  const isLive =
    foreignCodes.length > 0 &&
    foreignCodes.every((code) => rateState.liveCodes.has(code));
  if (isLive) {
    const timestamps = foreignCodes.map((code) =>
      new Date(rateState.updatedAtByCode[code]).getTime(),
    );
    return { kind: "live", updatedAt: new Date(Math.min(...timestamps)) };
  }
  return { kind: rateState.status === "error" ? "error" : "fallback" };
}

function rateCopy(pairState) {
  if (pairState.kind === "live") {
    const updated = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(pairState.updatedAt);
    return {
      summary: "📈 Mercado · Cotação real",
      badge: "Cotação real",
      detail: `AwesomeAPI · atualizada em ${updated}`,
      daily: `Conversão calculada com cotação de mercado atualizada em ${updated}.`,
      footer: "Conversor usando cotação de mercado da AwesomeAPI",
    };
  }
  if (pairState.kind === "neutral") {
    return {
      summary: "↔️ Selecione moedas diferentes",
      badge: "Mesma moeda",
      detail: "Sem conversão de mercado",
      daily: "Escolha moedas diferentes para fazer uma conversão.",
      footer: "Selecione moedas diferentes para consultar o mercado",
    };
  }
  if (pairState.kind === "loading") {
    return {
      summary: "⏳ Carregando cotação...",
      badge: "Carregando...",
      detail: "Consultando o mercado",
      daily: "Consultando a cotação atual...",
      footer: "Aguardando fonte da cotação do conversor",
    };
  }
  return {
    summary:
      pairState.kind === "error"
        ? "⚠️ Mercado indisponível"
        : "🎓 Modo educativo",
    badge: "Taxa educativa temporária",
    detail:
      pairState.kind === "error"
        ? "Não foi possível atualizar agora"
        : "Par sem cotação disponível",
    daily:
      "Taxa educativa temporária; tente atualizar para consultar o mercado.",
    footer: "Conversor em modo educativo temporário",
  };
}

function updateRateSurfaces(pairState) {
  const copy = rateCopy(pairState);
  const summary = document.querySelector("#rate-status-summary");
  const badge = document.querySelector("#quote-badge");
  const updated = document.querySelector("#quote-updated");
  const retry = document.querySelector("#rate-retry");
  const footer = document.querySelector(".edu-note");
  if (summary) summary.textContent = copy.summary;
  if (badge) badge.textContent = copy.badge;
  if (updated) updated.textContent = copy.detail;
  if (retry) retry.hidden = pairState.kind !== "error";
  if (footer) footer.textContent = copy.footer;
  document
    .querySelector("#quote-card")
    ?.setAttribute("data-rate-state", pairState.kind);
  return copy;
}

function updateQuote(
  origin,
  destination,
  originCode,
  destinationCode,
  unitRate,
) {
  let card = document.querySelector("#quote-card");
  if (!card) {
    card = document.createElement("section");
    card.id = "quote-card";
    card.className = "quote-card";
    card.innerHTML =
      '<div class="quote-header"><div class="quote-title-group"><span class="quote-icon" aria-hidden="true"><svg viewBox="0 0 20 20" width="18" height="18" fill="none"><rect x="2" y="9" width="3.5" height="9" rx="1.75" fill="#059669"/><rect x="8" y="4" width="3.5" height="14" rx="1.75" fill="#059669"/><rect x="14" y="7" width="3.5" height="11" rx="1.75" fill="#10B981"/></svg></span><strong class="quote-title">Cotação utilizada</strong></div><div class="quote-actions"><b id="quote-badge" class="quote-badge">Cotação real</b><button id="rate-retry" type="button" class="rate-retry-btn" hidden>Tentar novamente</button></div></div><div class="quote-rates"><div class="quote-line-primary" id="quote-primary"></div><div class="quote-line-secondary" id="quote-secondary"></div></div><div class="quote-footer"><small id="quote-updated"></small></div>';
    const converterCard = document.querySelector(".converter-card");
    if (converterCard) converterCard.before(card);
    else document.querySelector(".content-grid")?.prepend(card);
    document
      .querySelector("#rate-retry")
      ?.addEventListener("click", loadLiveRates);
  }
  const quotePrimary = document.querySelector("#quote-primary");
  if (quotePrimary) {
    quotePrimary.innerHTML =
      `<b>${destination.symbol} 1,00</b> <span class="quote-curr-name">${destination.name}</span> = <b>${origin.symbol} ${fmt(1 / unitRate)}</b> <span class="quote-curr-name">${origin.name}</span>`;
  }
  const quoteSecondary = document.querySelector("#quote-secondary");
  if (quoteSecondary) {
    quoteSecondary.innerHTML =
      `<span>${origin.symbol} 1,00</span> <span class="quote-curr-name">${origin.name}</span> = <span>${destination.symbol} ${fmt(unitRate)}</span> <span class="quote-curr-name">${destination.name}</span>`;
  }
  const pairState = getPairRateState(originCode, destinationCode);
  const copy = updateRateSurfaces(pairState);
  card.setAttribute(
    "aria-label",
    `Cotação: 1 ${origin.name} equivale a ${fmt(unitRate)} ${destination.name}. ${copy.badge}.`,
  );
  return copy;
}

function getAmountValue() {
  const raw = String(amount.value || "").trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function formatLiveInput(rawValue) {
  if (!rawValue) return { display: "", number: 0 };
  let val = String(rawValue).trim().replace(/\./g, "");

  const parts = val.split(",");
  let intPart = parts[0].replace(/\D/g, "");
  let decPart = null;

  if (parts.length > 1) {
    decPart = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);
  }

  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+(?=\d)/, "");
  }

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let display = formattedInt;
  if (decPart !== null) {
    display += "," + decPart;
  }

  const numVal = parseFloat((intPart || "0") + "." + (decPart || "0")) || 0;
  return { display, number: numVal };
}

function onAmountInput() {
  const prevValue = amount.value;
  const cursorPosition = amount.selectionStart || 0;
  const digitsBeforeCursor = prevValue
    .slice(0, cursorPosition)
    .replace(/\D/g, "").length;

  const { display } = formatLiveInput(prevValue);
  amount.value = display;

  if (digitsBeforeCursor === 0) {
    amount.setSelectionRange(0, 0);
  } else {
    let newCursor = 0;
    let digitCount = 0;
    for (let i = 0; i < display.length; i++) {
      if (/\d/.test(display[i])) digitCount++;
      if (digitCount === digitsBeforeCursor) {
        newCursor = i + 1;
        break;
      }
    }
    amount.setSelectionRange(newCursor, newCursor);
  }

  convert();
}

function onAmountBlur() {
  const num = getAmountValue();
  amount.value = num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  convert();
}

function convert() {
  const origin = currencies[from.value];
  const destination = currencies[to.value];
  const input = getAmountValue();
  const value = (input / origin.perBRL) * destination.perBRL;
  const unitRate = destination.perBRL / origin.perBRL;
  updateSelectFlag(from);
  updateSelectFlag(to);
  const copy = updateQuote(origin, destination, from.value, to.value, unitRate);
  const inputSymbol = document.querySelector("#input-symbol");
  if (inputSymbol) inputSymbol.textContent = origin.symbol;

  const amountInWords = document.querySelector("#amount-in-words");
  const writtenAmount = formatAmountInWords(input, from.value);
  if (amountInWords) {
    amountInWords.textContent = writtenAmount;
    amountInWords.title = writtenAmount;
  }

  const convertedVal = document.querySelector("#converted-val");
  const convertedCode = document.querySelector("#converted-code");
  const destBadge = document.querySelector("#dest-currency-badge");
  if (convertedVal) convertedVal.textContent = fmt(value);
  if (convertedCode) convertedCode.textContent = to.value;
  if (destBadge) destBadge.textContent = destination.name;

  const converted = document.querySelector("#converted");
  if (converted) {
    converted.innerHTML =
      `${fmt(value)} <small>${to.value}</small> <span class="dest-currency-badge">${destination.name}</span>`;
  }

  const equation = document.querySelector("#equation");
  if (equation) {
    equation.innerHTML =
      `<b>${fmt(input)} ${origin.name} (${from.value})</b> = <b>${fmt(value)} ${destination.name} (${to.value})</b>`;
  }

  const convertedInWords = document.querySelector("#converted-in-words");
  if (convertedInWords) {
    const writtenConverted = formatAmountInWords(value, to.value);
    convertedInWords.textContent = writtenConverted;
    convertedInWords.title = writtenConverted;
  }

  let dailyRate = document.querySelector("#daily-rate");
  if (dailyRate) {
    dailyRate.textContent = copy.daily;
  }
  miniCards();
}

function go(page) {
  document.body.classList.toggle("theme-mexico", page === "home");
  document
    .querySelectorAll(".page")
    .forEach((item) => item.classList.remove("active"));
  document.querySelector(`#${page}-page`).classList.add("active");
  document
    .querySelectorAll(".menu button, .bottom-nav button")
    .forEach((button) => {
      const isActive = button.dataset.page === page;
      button.classList.toggle("active", isActive);
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function flagMarkup(currency, className) {
  return currency.image
    ? `<img class="${className}" src="${currency.image}" alt="Bandeira do ${currency.country}">`
    : `<span class="${className}-emoji">${currency.flag}</span>`;
}

function countryGrid() {
  document.querySelector("#country-grid").innerHTML = Object.entries(currencies)
    .map(([code, currency]) => {
      const isUnavailable = currency.convertible === false;
      return `<article class="country-card${isUnavailable ? " country-card-unavailable" : ""}" data-region="${currency.region}" style="--card:${currency.color}"><div class="card-flag">${flagMarkup(currency, "country-flag-image")}<span class="card-coin">${isUnavailable ? "🧊" : coin}</span></div><div class="country-details"><h2>${currency.country}</h2><p class="region">${currency.region}</p><p class="country-currency">${coin} <span>Moeda:</span> <b>${currency.name}</b></p><p class="country-capital">📍 <span>Capital:</span> <b>${currency.capital}</b></p></div><div class="country-actions"><code>${isUnavailable ? "—" : code}</code>${isUnavailable ? '<button type="button" disabled>Sem moeda oficial</button>' : `<button data-convert="${code}">Converter <span aria-hidden="true">➜</span></button>`}</div></article>`;
    })
    .join("");
}

function miniCards() {
  const origin = currencies[from.value] || currencies.BRL;
  const destinationCode = to.value;
  const input = getAmountValue();
  document.querySelector("#mini-title").innerHTML =
    `${origin.country} &times; outros pa&iacute;ses`;
  document.querySelector("#mini-desc").textContent =
    `Conversão automática de ${origin.symbol} ${fmt(input)} (${from.value}) para as demais moedas:`;
  document.querySelector("#mini-list").innerHTML = Object.entries(currencies)
    .filter(
      ([code, currency]) =>
        code !== from.value && currency.convertible !== false,
    )
    .map(([code, currency]) => {
      const convertedValue = (input / origin.perBRL) * currency.perBRL;
      const isSelected = code === destinationCode;
      const state = getPairRateState(from.value, code).kind;
      const source =
        state === "live"
          ? "Cotação real"
          : state === "loading"
            ? "Carregando..."
            : "Taxa educativa";
      return `<article class="mini ${isSelected ? "mini-active-target" : ""}" style="--card:${currency.color}" onclick="selectDestinationCurrency('${code}')" title="Clique para definir ${currency.name} como moeda de destino">${isSelected ? '<span class="mini-target-badge">🎯 Moeda selecionada</span>' : ""}<span class="mini-rate-source" data-rate-state="${state}">${source}</span><h3>${origin.country} &times; ${currency.country}</h3><div class="mini-info">${currency.image ? flagMarkup(currency, "mini-flag-image") : `<span class="mini-flag-emoji">${currency.flag}</span>`}<span class="mini-currency">${currency.name} &middot; ${code}</span></div><strong>${coin} ${fmt(convertedValue)} ${code}</strong></article>`;
    })
    .join("");
}

function selectDestinationCurrency(code) {
  if (
    currencies[code] &&
    currencies[code].convertible !== false &&
    code !== from.value
  ) {
    to.value = code;
    convert();
  }
}

function swapCurrencies() {
  const button = document.querySelector(".swap");
  [from.value, to.value] = [to.value, from.value];
  button.classList.remove("is-swapping");
  void button.offsetWidth;
  button.classList.add("is-swapping");
  convert();
}

function resetToEducationalSnapshot() {
  for (const code of convertibleCodes)
    currencies[code].perBRL = educationalRates[code];
  rateState.liveCodes = new Set();
  rateState.updatedAtByCode = {};
}

function parseLiveSnapshot(payload) {
  if (!payload || payload.base !== "BRL" || payload.source !== "AwesomeAPI")
    return null;
  if (
    !payload.rates ||
    payload.rates.BRL !== 1 ||
    !Array.isArray(payload.liveCodes) ||
    !payload.updatedAtByCode
  )
    return null;

  const snapshot = { rates: {}, liveCodes: new Set(), updatedAtByCode: {} };
  for (const code of new Set(payload.liveCodes)) {
    if (code === "BRL" || !convertibleCodes.includes(code)) continue;
    const rate = payload.rates[code];
    const timestamp = payload.updatedAtByCode[code];
    const date = typeof timestamp === "string" ? new Date(timestamp) : null;
    if (
      !isValidRate(rate) ||
      !date ||
      Number.isNaN(date.getTime()) ||
      date.toISOString() !== timestamp
    )
      continue;
    snapshot.rates[code] = rate;
    snapshot.liveCodes.add(code);
    snapshot.updatedAtByCode[code] = timestamp;
  }
  return snapshot.liveCodes.size > 0 ? snapshot : null;
}

function parsePublicAwesomePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;

  const snapshot = { rates: {}, liveCodes: new Set(), updatedAtByCode: {} };
  for (const code of convertibleCodes) {
    if (code === "BRL") continue;
    const quote = payload[`${code}BRL`];
    if (!quote || quote.code !== code || quote.codein !== "BRL") continue;

    const bid = Number(quote.bid);
    const timestamp = Number(quote.timestamp);
    const updatedAt = new Date(timestamp * 1000);
    const rate = 1 / bid;
    if (
      !isValidRate(rate) ||
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      Number.isNaN(updatedAt.getTime())
    )
      continue;

    snapshot.rates[code] = rate;
    snapshot.liveCodes.add(code);
    snapshot.updatedAtByCode[code] = updatedAt.toISOString();
  }
  return snapshot.liveCodes.size > 0 ? snapshot : null;
}

async function fetchPublicAwesomeRates(signal) {
  const response = await fetch(PUBLIC_AWESOME_URL, { signal });
  if (!response.ok) throw new Error("public rates unavailable");
  const snapshot = parsePublicAwesomePayload(await response.json());
  if (!snapshot) throw new Error("invalid public rates");
  return snapshot;
}

async function loadLiveRates() {
  const requestId = ++ratesRequestId;
  ratesAbortController?.abort();
  ratesAbortController = new AbortController();
  rateState.status = "loading";
  convert();

  try {
    let snapshot;
    try {
      const response = await fetch("/.netlify/functions/rates?base=BRL", {
        signal: ratesAbortController.signal,
      });
      if (!response.ok) throw new Error("rates unavailable");
      snapshot = parseLiveSnapshot(await response.json());
      if (!snapshot) throw new Error("invalid rates");
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      snapshot = await fetchPublicAwesomeRates(ratesAbortController.signal);
    }
    if (requestId !== ratesRequestId) return;

    resetToEducationalSnapshot();
    for (const code of snapshot.liveCodes)
      currencies[code].perBRL = snapshot.rates[code];
    rateState.liveCodes = snapshot.liveCodes;
    rateState.updatedAtByCode = snapshot.updatedAtByCode;
    rateState.status = "ready";
  } catch (error) {
    if (error?.name === "AbortError" || requestId !== ratesRequestId) return;
    resetToEducationalSnapshot();
    rateState.status = "error";
  }
  convert();
}

function bindCountryButtons() {
  document.querySelectorAll("[data-convert]").forEach((button) =>
    button.addEventListener("click", () => {
      from.value = "BRL";
      to.value = button.dataset.convert;
      convert();
      go("home");
    }),
  );
}

function testCurrency(code) {
  if (currencies[code] && currencies[code].convertible !== false) {
    from.value = "BRL";
    to.value = code;
    amount.value = 100;
    convert();
    go("home");
    const resultBox = document.querySelector(".result");
    if (resultBox) {
      resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
      resultBox.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
      resultBox.style.transform = "scale(1.03)";
      resultBox.style.boxShadow = "0 0 25px rgba(116,69,213,0.4)";
      setTimeout(() => {
        resultBox.style.transform = "none";
        resultBox.style.boxShadow = "";
      }, 800);
    }
  }
}

function applaudStudent(id, button) {
  const countElement = document.querySelector(`#count-${id}`);
  if (countElement)
    countElement.textContent =
      (parseInt(countElement.textContent, 10) || 0) + 1;
  if (!button) return;
  button.classList.add("is-applauding");
  setTimeout(() => button.classList.remove("is-applauding"), 350);
  const emojis = ["👏", "⭐", "🪙", "🎉", "💖", "✨"];
  for (let index = 0; index < 5; index += 1) {
    const particle = document.createElement("span");
    particle.className = "applause-particle";
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const rect = button.getBoundingClientRect();
    particle.style.left = `${rect.left + rect.width / 2 + (Math.random() * 50 - 25)}px`;
    particle.style.top = `${rect.top + window.scrollY + (Math.random() * 20 - 10)}px`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 950);
  }
}

function appendAssistantMessage(role, text) {
  const message = document.createElement("div");
  message.className = `assistant-message assistant-message-${role}`;
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = role === "bot" ? "🪙" : "🎓";
  const content = document.createElement("p");
  content.textContent = text;
  message.append(icon, content);
  document.querySelector("#assistant-messages").appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setupAssistant() {
  const form = document.querySelector("#assistant-form");
  const input = document.querySelector("#assistant-input");
  const count = document.querySelector("#assistant-count");
  const status = document.querySelector("#assistant-status");
  const submit = form.querySelector('button[type="submit"]');
  input.addEventListener("input", () => {
    count.textContent = input.value.length;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || message.length > 1000) return;

    appendAssistantMessage("user", message);
    input.value = "";
    count.textContent = "0";
    input.disabled = true;
    submit.disabled = true;
    status.textContent = "O tutor está pensando...";
    try {
      const response = await fetch("/.netlify/functions/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            amount: Math.max(0, Number(amount.value) || 0),
            from: from.value,
            to: to.value,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || typeof payload?.reply !== "string") {
        if (response.status === 429)
          throw new Error("Espere um minuto antes de enviar outra pergunta.");
        throw new Error(
          "O tutor está temporariamente indisponível. Tente novamente.",
        );
      }
      appendAssistantMessage("bot", payload.reply);
      status.textContent = "";
    } catch (error) {
      status.textContent =
        error.message || "Não foi possível falar com o tutor agora.";
    } finally {
      input.disabled = false;
      submit.disabled = false;
      input.focus();
    }
  });
}

options(from, "BRL");
options(to, "MXN");
initFlagSelect(from);
initFlagSelect(to);
countryGrid();
convert();
bindCountryButtons();
setupAssistant();

document.addEventListener("click", (event) => {
  document.querySelectorAll(".currency-box").forEach((box) => {
    if (!box.contains(event.target)) closeFlagSelect(box);
  });
});

const miniToggle = document.querySelector("#mini-toggle");
miniToggle?.addEventListener("click", () => {
  const list = document.querySelector("#mini-list");
  const isCollapsed = list.classList.toggle("is-collapsed");
  miniToggle.textContent = isCollapsed ? "Ver todos →" : "Ver menos ←";
});

[from, to].forEach((element) => {
  element.addEventListener("input", convert);
  element.addEventListener("change", convert);
});
amount.addEventListener("input", onAmountInput);
amount.addEventListener("blur", onAmountBlur);
amount.addEventListener("focus", () => amount.select());
amount.addEventListener("keydown", (e) => {
  // "Ir"/"Concluído" do teclado virtual: converte e recolhe o teclado
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    convert();
    amount.blur();
    return;
  }
  if (e.key === ".") {
    e.preventDefault();
    if (!amount.value.includes(",")) {
      const start = amount.selectionStart;
      const end = amount.selectionEnd;
      amount.value =
        amount.value.slice(0, start) + "," + amount.value.slice(end);
      amount.setSelectionRange(start + 1, start + 1);
      onAmountInput();
    }
  }
});
document.querySelector(".convert-button")?.addEventListener("click", convert);
document.querySelector(".swap").addEventListener("click", swapCurrencies);
document
  .querySelector(".swap")
  .addEventListener("animationend", (event) =>
    event.currentTarget.classList.remove("is-swapping"),
  );
document
  .querySelectorAll(".menu button, .bottom-nav button")
  .forEach((button) =>
    button.addEventListener("click", () => go(button.dataset.page)),
  );
document
  .querySelector("[data-go-converter]")
  .addEventListener("click", () => go("home"));
document.querySelectorAll(".filters button").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".filters button")
      .forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    const region = button.dataset.region;
    document.querySelectorAll(".country-card").forEach((card) => {
      card.style.display =
        !region || card.dataset.region === region ? "" : "none";
    });
  }),
);

function initThemeToggle() {
  document.body.classList.add("theme-mexico");
  const toggles = document.querySelectorAll(".theme-toggle");
  const label = document.querySelector(".theme-toggle-label");

  const updateToggleCopy = () => {
    const isMexico = document.body.classList.contains("theme-mexico");
    toggles.forEach((toggle) =>
      toggle.setAttribute(
        "aria-label",
        isMexico
          ? "Alternar para o tema padrão"
          : "Alternar para o Tema México",
      ),
    );
    if (label) label.textContent = isMexico ? "Tema México" : "Tema padrão";
  };

  toggles.forEach((toggle) =>
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("theme-mexico");
      updateToggleCopy();
    }),
  );
  updateToggleCopy();
}

window.go = go;
window.testCurrency = testCurrency;
window.applaudStudent = applaudStudent;
window.selectDestinationCurrency = selectDestinationCurrency;

initThemeToggle();

function initSettingsSheet() {
  const trigger = document.querySelector("#mobile-settings-btn");
  const sheet = document.querySelector("#settings-sheet");
  if (!trigger || !sheet) return;

  const panel = sheet.querySelector(".settings-panel");
  const refreshButton = sheet.querySelector("#settings-refresh");
  const refreshStatus = sheet.querySelector("#settings-refresh-status");
  const aboutButton = sheet.querySelector("#settings-about-btn");
  const about = sheet.querySelector("#settings-about");
  let closeTimer;

  const focusables = () =>
    [...panel.querySelectorAll("button:not([disabled])")].filter(
      (element) => element.offsetParent !== null,
    );

  const open = () => {
    clearTimeout(closeTimer);
    sheet.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("settings-open");
    void sheet.offsetHeight; // força o reflow para a transição de entrada
    sheet.classList.add("is-open");
    refreshButton.focus();
  };

  const close = () => {
    if (sheet.hidden) return;
    sheet.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("settings-open");
    closeTimer = setTimeout(() => {
      sheet.hidden = true;
    }, 260);
    trigger.focus();
  };

  trigger.addEventListener("click", open);
  sheet
    .querySelectorAll("[data-close-settings]")
    .forEach((element) => element.addEventListener("click", close));

  sheet.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    refreshButton.classList.add("is-loading");
    refreshStatus.textContent = "Atualizando…";
    await loadLiveRates();
    refreshButton.disabled = false;
    refreshButton.classList.remove("is-loading");
    const time = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    refreshStatus.textContent =
      rateState.status === "ready"
        ? `Cotação atualizada às ${time}`
        : "Sem conexão — usando valores educativos";
  });

  sheet.querySelector("#settings-team").addEventListener("click", () => {
    close();
    go("team");
  });

  aboutButton.addEventListener("click", () => {
    const expanded = aboutButton.getAttribute("aria-expanded") === "true";
    aboutButton.setAttribute("aria-expanded", String(!expanded));
    about.hidden = expanded;
  });
}

initSettingsSheet();
go("home");
loadLiveRates();

function toWords(value) {
  const units = [
    "zero",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
  ];
  const teens = [
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];
  const tens = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa",
  ];
  const hundreds = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos",
  ];

  const underOneThousand = (number) => {
    if (number < 10) return units[number];
    if (number < 20) return teens[number - 10];
    if (number < 100) {
      return (
        tens[Math.floor(number / 10)] +
        (number % 10 ? " e " + units[number % 10] : "")
      );
    }
    if (number === 100) return "cem";
    return (
      hundreds[Math.floor(number / 100)] +
      (number % 100 ? " e " + underOneThousand(number % 100) : "")
    );
  };

  const num = Math.floor(Math.abs(Number(value) || 0));
  if (num === 0) return "zero";

  const scales = [
    { value: 1e12, singular: "trilhão", plural: "trilhões" },
    { value: 1e9, singular: "bilhão", plural: "bilhões" },
    { value: 1e6, singular: "milhão", plural: "milhões" },
    { value: 1e3, singular: "mil", plural: "mil" },
    { value: 1, singular: "", plural: "" },
  ];

  let remaining = num;
  const parts = [];

  for (const scale of scales) {
    const count = Math.floor(remaining / scale.value);
    if (count > 0) {
      remaining %= scale.value;
      let text = "";
      if (scale.value === 1e3) {
        text = count === 1 ? "mil" : `${underOneThousand(count)} mil`;
      } else if (scale.value >= 1e6) {
        text = `${underOneThousand(count)} ${count === 1 ? scale.singular : scale.plural}`;
      } else {
        text = underOneThousand(count);
      }
      parts.push({ count, scale: scale.value, text });
    }
  }

  if (parts.length === 1) return parts[0].text;

  let result = parts[0].text;
  for (let i = 1; i < parts.length; i++) {
    const prev = parts[i - 1];
    const curr = parts[i];
    const isLast = i === parts.length - 1;
    const isRoundHundredOrUnder100 =
      curr.count < 100 || (curr.count % 100 === 0 && curr.count < 1000);

    if (prev.scale === 1e3 && curr.scale === 1 && !isRoundHundredOrUnder100) {
      result += " " + curr.text;
    } else if (isLast && (isRoundHundredOrUnder100 || parts.length === 2)) {
      result += " e " + curr.text;
    } else {
      result += ", " + curr.text;
    }
  }
  return result;
}

function formatAmountInWords(value, currencyCode) {
  const [singular, plural] = currencyWords[currencyCode] || [
    currencies[currencyCode]?.name || "unidade",
    currencies[currencyCode]?.name || "unidades",
  ];
  const num = Math.max(0, Number(value) || 0);
  const integerPart = Math.floor(num);
  const cents = Math.round((num - integerPart) * 100);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (integerPart === 0 && cents > 0) {
    const centsText = toWords(cents) + (cents === 1 ? " centavo" : " centavos");
    return cap(`${centsText} de ${singular}`);
  }

  let text = toWords(integerPart);
  let currencySuffix = "";
  if (integerPart === 1) {
    currencySuffix = " " + singular;
  } else if (integerPart >= 1e6 && integerPart % 1e6 === 0) {
    currencySuffix = " de " + plural;
  } else {
    currencySuffix = " " + plural;
  }

  let result = cap(text + currencySuffix);
  if (cents > 0) {
    result += ` e ${toWords(cents)} ${cents === 1 ? "centavo" : "centavos"}`;
  }
  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { toWords, formatAmountInWords };
}
