"use strict";

/*Stock format
    [
        {name: 'AAPL', count: 5, price: 10.23},
        {name: 'MCD', count: 15, price: 12.22},
    ]
);*/

updateStocks();

function stopUpdates() {
    if (window.updates) {
        clearInterval(window.updates);
    }
    document.getElementById("stop-update").classList.add('d-none');
    document.getElementById("start-update").classList.remove('d-none');
    localStorage.setItem('updates', '0');
}

function startUpdates() {
    window.updates = setInterval(function () {
        updateStocks();
    }, 60000);
    document.getElementById("start-update").classList.add('d-none');
    document.getElementById("stop-update").classList.remove('d-none');
    localStorage.setItem('updates', '1');
}

function isUpdatesActivated() {
    return localStorage.getItem('updates') === '1';
}

function updateStocks() {
    let stocks = getStocksFromStorage();
    setStocks(stocks);
    isUpdatesActivated() ? startUpdates() : stopUpdates();
}

function getStocksFromStorage() {
    let str = localStorage.getItem('stocks');
    return JSON.parse(str);
}

function setStocks(stocks) {
    localStorage.setItem('stocks', JSON.stringify(stocks));
    drawStocks(stocks);
}

async function drawStocks(stocks) {
    let currentStocksPrice = await getLocalStocksPrice(stocks);
    let rows = '';
    let profitSum = 0;
    let originSum = 0;
    let highProfit = false;
    for (let i = 0; i < stocks.length; i++) {
        let profit = (stocks[i].count * currentStocksPrice[stocks[i].name] - stocks[i].count * stocks[i].price - 2);
        if (profit > 10) {
            highProfit = true;
        }
        originSum += stocks[i].count * stocks[i].price;
        profitSum += profit;
        rows += ` 
    <tr class="${profit > 0 ? 'table-success' : ''}">
      <th scope="row">${i + 1}</th>
      <td>${stocks[i].name}</td>
      <td>${stocks[i].count}</td>
      <td>${stocks[i].price}</td>
      <td>${currentStocksPrice[stocks[i].name]}</td>
      <td >${profit.toFixed(2)}</td>
      <td><button type="button" onclick="stocksScript.removeStock(${i})" class="btn btn-dark">Remove</button></td>
    </tr>`
    }
    let footer = `<tr>
      <th colspan="3">Origin sum</th>
      <th>${originSum.toFixed(2)}</th>
      <th>Sum of profit</th>
      <th>${profitSum.toFixed(2)}</th>
      <th></th>
    </tr>`;

    if (window.stockTable) {
        window.stockTable.destroy();
    }
    document.getElementById('body').innerHTML = rows;
    document.getElementById('footer').innerHTML = footer;

    window.stockTable = $('#stocks').DataTable({
        "order": [[5, "desc"]],
        "paging": false,
        "searching": false
    });
    if (highProfit) {
        playSound();
    }
}

function removeStock(index) {
    let stocks = getStocksFromStorage();
    stocks.splice(index, 1);
    setStocks(stocks);
}

function addStock() {
    let name = document.getElementById("name").value;
    let count = document.getElementById("count").value;
    let price = document.getElementById("price").value;

    let stocks = getStocksFromStorage();
    stocks.push({name: name, count: count, price: price});
    setStocks(stocks);
    hideForm();
}

function showForm() {
    document.getElementById("show-form").classList.add('d-none');
    document.getElementById("form").classList.remove('d-none');
}

function hideForm() {
    document.getElementById("show-form").classList.remove('d-none');
    document.getElementById("form").classList.add('d-none');
    resetForm();
}

const resetForm = function () {
    document.getElementById("name").value = '';
    document.getElementById("count").value = '';
    document.getElementById("price").value = '';
};

function isMuted() {
    let toMute = localStorage.getItem('mute');
    if(toMute == null) {
        mute(false);
        toMute = false;
    }

    return toMute == true;
}

function mute(mute) {
    localStorage.setItem('mute', mute === true ? '1' : '0');
    $('#mute').bootstrapToggle(`${mute ? 'on' : 'off'}`);
}

function trackMuteState() {
    $('#mute').change(function() {
        let current = document.getElementById("mute").checked;
        localStorage.setItem('mute', current === true ? '1' : '0');
    });
}

function playSound() {
    if (!isMuted()) {
        let audio = new Audio('audio/bell-10.flac');
        audio.play();
    }
}

/**
 * Stocks param format [{name: "AAPL"}, {name: "MCD"}]
 * Request in format ['AAPL', 'MCD']
 * Response in format {'AAPL': 5, 'MCD': 12}
 *
 * @param stocks
 * @returns {Promise<void>}
 */
async function getLocalStocksPrice(stocks) {
    let stocksToSend = stocks.map(stock => stock.name).filter((v, i, a) => a.indexOf(v) === i);
    const axios = require('axios');
    console.log(stocksToSend);
    let response = await axios.post(`http://localhost:8080/stocks`, {stocks: stocksToSend});
    console.log(response.data.data);

    return response.data.data;
}

module.exports = {
    playSound,
    stopUpdates,
    startUpdates,
    getLocalStocksPrice,
    showForm,
    addStock,
    removeStock,
    isMuted,
    mute,
    trackMuteState
};
