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

function numberToWords(value) {
  return String(value);
}
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
  trigger.querySelector(".flag-select-btn-flag").src = currency.image;
  trigger.querySelector(".flag-select-btn-flag").alt =
    `Bandeira do ${currency.country}`;
  trigger.querySelector(".flag-select-btn-label").textContent =
    `${currency.country} · ${select.value}`;
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
      '<span class="quote-icon">⇆</span><div class="quote-copy"><small>Cotação utilizada</small><strong id="quote-primary"></strong><p id="quote-secondary"></p><small id="quote-updated"></small></div><div class="quote-actions"><b id="quote-badge"></b><button id="rate-retry" type="button" hidden>Tentar novamente</button></div><img class="quote-sombrero" src="images/mx3.png" alt="">';
    document.querySelector(".convert-button").before(card);
    document
      .querySelector("#rate-retry")
      .addEventListener("click", loadLiveRates);
  }
  document.querySelector("#quote-primary").innerHTML =
    `${destination.symbol} 1,00 <span class="quote-curr-name">${destination.name}</span> = ${origin.symbol} ${fmt(1 / unitRate)} <span class="quote-curr-name">${origin.name}</span>`;
  document.querySelector("#quote-secondary").innerHTML =
    `${origin.symbol} 1,00 <span class="quote-curr-name">${origin.name}</span> = ${destination.symbol} ${fmt(unitRate)} <span class="quote-curr-name">${destination.name}</span>`;
  const pairState = getPairRateState(originCode, destinationCode);
  const copy = updateRateSurfaces(pairState);
  card.setAttribute(
    "aria-label",
    `Cotação: 1 ${origin.name} equivale a ${fmt(unitRate)} ${destination.name}. ${copy.badge}.`,
  );
  return copy;
}

function convert() {
  const origin = currencies[from.value];
  const destination = currencies[to.value];
  const input = Math.max(0, Number(amount.value) || 0);
  const value = (input / origin.perBRL) * destination.perBRL;
  const unitRate = destination.perBRL / origin.perBRL;
  updateSelectFlag(from);
  updateSelectFlag(to);
  const copy = updateQuote(origin, destination, from.value, to.value, unitRate);
  document.querySelector("#input-symbol").textContent = origin.symbol;
  const amountInWords = document.querySelector("#amount-in-words");
  const [singular, plural] = currencyWords[from.value] || [
    origin.name,
    origin.name,
  ];
  const writtenAmount = toWords(input);
  if (amountInWords) {
    amountInWords.textContent = `${writtenAmount.charAt(0).toUpperCase()}${writtenAmount.slice(1)} ${input === 1 ? singular : plural}`;
  }
  document.querySelector("#converted").innerHTML =
    `${fmt(value)} <small>${to.value}</small> <span class="dest-currency-badge">${destination.name}</span>`;
  document.querySelector("#equation").innerHTML =
    `<b>${fmt(input)} ${origin.name} (${from.value})</b> = <b>${fmt(value)} ${destination.name} (${to.value})</b>`;
  let dailyRate = document.querySelector("#daily-rate");
  if (!dailyRate) {
    dailyRate = document.createElement("p");
    dailyRate.id = "daily-rate";
    dailyRate.className = "daily-rate";
    document.querySelector("#equation").after(dailyRate);
  }
  dailyRate.textContent = copy.daily;
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
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.page === page),
    );
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
  const input = Math.max(0, Number(amount.value) || 0);
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

[amount, from, to].forEach((element) => {
  element.addEventListener("input", convert);
  element.addEventListener("change", convert);
});
document.querySelector(".convert-button").addEventListener("click", convert);
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
  const n = Math.max(0, Math.min(999, Math.round(Number(value) || 0)));
  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? " e " + units[n % 10] : "");
  if (n === 100) return "cem";
  return (
    hundreds[Math.floor(n / 100)] + (n % 100 ? " e " + toWords(n % 100) : "")
  );
}
