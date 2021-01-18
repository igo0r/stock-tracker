"use strict";

/*Stock format
    [
        {name: 'AAPL', count: 5, price: 10.23},
        {name: 'MCD', count: 15, price: 12.22},
    ]
);*/

let stocks = getStocksFromStorage();
setStocks(stocks);

function getStocksFromStorage() {
    let str = localStorage.getItem('stocks');
    return JSON.parse(str);
}

function setStocks(stocks) {
    localStorage.setItem('stocks', JSON.stringify(stocks));
    console.log(stocks);
    drawStocks(stocks);
}

async function drawStocks(stocks) {
    let currentStocksPrice = await getLocalStocksPrice(stocks);
    let rows = '';
    let profitSum = 0;
    for (let i = 0; i < stocks.length; i++) {
        let profit = (stocks[i].count * currentStocksPrice[stocks[i].name] - stocks[i].count * stocks[i].price - 2);
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
      <th colspan="5">Sum of profit</th>
      <th>${profitSum.toFixed(2)}</th>
      <th></th>
    </tr>`;

    if(window.stockTable) {
        window.stockTable.destroy();
    }
    document.getElementById('body').innerHTML = rows;
    document.getElementById('footer').innerHTML = footer;

    window.stockTable = $('#stocks').DataTable({
        "order": [[ 5, "desc" ]],
        "paging": false,
        "searching": false
    });
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
    getLocalStocksPrice,
    showForm,
    addStock,
    removeStock
};
