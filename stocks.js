"use strict";

/*Stock format
    [
        {name: 'AAPL', count: 5, price: 10.23},
        {name: 'MCD', count: 15, price: 12.22},
    ]
);*/

function stopUpdates() {
    if (window.updates) {
        clearInterval(window.updates);
    }
    document.getElementById("stop-update").classList.add('d-none');
    document.getElementById("start-update").classList.remove('d-none');
    localStorage.setItem('updates', '0');
}

function startUpdates() {
    clearInterval(window.updates);
    window.updates = setInterval(function () {
        if (window.response == null) {
            updateStocks();
        } else {
            console.log("waiting for request to finish");
        }
    }, 60000);
    document.getElementById("start-update").classList.add('d-none');
    document.getElementById("stop-update").classList.remove('d-none');
    localStorage.setItem('updates', '1');
}

function startDropUpdates() {
    clearInterval(window.updates);
    window.updates = setInterval(function () {
        if (window.response == null) {
            updateDropStocks();
        } else {
            console.log("waiting for request to finish");
        }
    }, 60000);
    document.getElementById("start-update").classList.add('d-none');
    document.getElementById("stop-update").classList.remove('d-none');
    localStorage.setItem('updates', '1');
}

function isUpdatesActivated() {
    return localStorage.getItem('updates') === '1';
}

function updateDropStocks() {
    let stocks = getDropStocksFromStorage();
    setDropStocks(stocks);
    isUpdatesActivated() ? startUpdates() : stopUpdates();
}

function getDropStocksFromStorage() {
    let str = localStorage.getItem('dropStocks');
    let res = JSON.parse(str);
    return res == null ? [] : res;
}

function setDropStocks(stocks) {
    localStorage.setItem('dropStocks', JSON.stringify(stocks));
    drawDropStocks(stocks);
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

async function drawDropStocks(stocks) {
    let currentStocksPrice = await getLocalStocksPrice(stocks);
    let rows = '';
    let highDrop = false;
    for (let i = 0; i < stocks.length; i++) {
        let currentStockInfo = currentStocksPrice[stocks[i].name];
        let current = parseFloat(currentStockInfo.current.toString().replace(",", ''));
        let close = parseFloat(currentStockInfo.close.toString().replace(",", ''));
        let open = parseFloat(currentStockInfo.open.toString().replace(",", ''));

        let closeDiff = (current / close - 1) * 100;
        let openDiff = (current / open - 1) * 100;
        let higherDiff = openDiff < closeDiff ? openDiff : closeDiff;

        if (higherDiff < -5) {
            highDrop = true;
        }

        rows += ` 
    <tr class="${higherDiff < -5 ? 'table-danger' : ''}">
      <th scope="row">${i + 1}</th>
      <td>${stocks[i].name}</td>
      <td>${close}</td>
      <td>${open}</td>
      <td>${current}</td>
      <td >${higherDiff.toFixed(2)}</td>
      <td><button type="button" onclick="stocksScript.removeDropStock(${i})" class="btn btn-dark">Remove</button></td>
    </tr>`
    }

    if (window.stockTable) {
        window.stockTable.destroy();
    }
    document.getElementById('body').innerHTML = rows;

    window.stockTable = $('#stocks').DataTable({
        "order": [[5, "asc"]],
        "paging": false,
        "searching": false
    });
    if (highDrop) {
        playDropSound();
    }
}

async function drawStocks(stocks) {
    let currentStocksPrice = await getLocalStocksPrice(stocks);
    let rows = '';
    let profitSum = 0;
    let originSum = 0;
    let highestProfit = 0;
    for (let i = 0; i < stocks.length; i++) {
        let profit = (stocks[i].count * currentStocksPrice[stocks[i].name].current.replace(/,/, '') - stocks[i].count * stocks[i].price - 2);
        highestProfit = profit > highestProfit ? profit : highestProfit;
        originSum += stocks[i].count * stocks[i].price;
        profitSum += profit;
        rows += ` 
    <tr class="${profit > 0 ? 'table-success' : ''}">
      <th scope="row">${i + 1}</th>
      <td>${stocks[i].name}</td>
      <td>${stocks[i].count}</td>
      <td>${stocks[i].price}</td>
      <td>${currentStocksPrice[stocks[i].name].current.replace(/,/, '')}</td>
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
    playSound(highestProfit);
}

function removeDropStock(index) {
    let stocks = getStocksFromStorage();
    stocks.splice(index, 1);
    setStocks(stocks);
}

function removeStock(index) {
    let stocks = getStocksFromStorage();
    stocks.splice(index, 1);
    setStocks(stocks);
}

function addDropStock() {
    let name = document.getElementById("name").value;

    let stocks = getDropStocksFromStorage();
    stocks.push({name: name});
    setDropStocks(stocks);
    hideForm();
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
    if (toMute == null) {
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
    $('#mute').change(function () {
        let current = document.getElementById("mute").checked;
        localStorage.setItem('mute', current === true ? '1' : '0');
    });
}

function playDropSound() {
    if (!isMuted()) {
        let audio = new Audio('audio/alert.mp3');
        audio.play();
    }
}

function playSound(highestProfit) {
    if (!isMuted()) {
        let toPlay = highestProfit > 100 ? 'bell-100.wav' : highestProfit > 60 ? 'bell=60.wav' : highestProfit > 30 ? 'bell-30.wav' : highestProfit > 10 ? 'bell-10.flac' : false;
        if (toPlay) {
            let audio = new Audio(`audio/${toPlay}`);
            audio.play();
        }
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
    window.response = await axios.post(`http://localhost:8080/stocks-marketwatch`, {stocks: stocksToSend});
    let data = window.response.data.data;
    console.log(data);
    window.response = null;

    return data;
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
    trackMuteState,
    addDropStock,
    getDropStocksFromStorage,
    setDropStocks,
    drawDropStocks,
    removeDropStock,
    playDropSound,
    updateStocks,
    updateDropStocks,
    startDropUpdates
};
