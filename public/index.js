let transactions = [];
let myChart;

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    //db informaton is saved in a global var
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduction of transaction amounts to a single value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // table row creation and population
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copied array is reversed
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // date labels for chart have being created
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // incremental values for chart have being created
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // if the old chart exists, remove it
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Progressive total",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // form validation
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // record creation
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // convert to a negative number if funds are subtracted
  if (!isAdding) {
    transaction.value *= -1;
  }

  
  transactions.unshift(transaction);

  //populate with new record
  populateChart();
  populateTable();
  populateTotal();
  
  //send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear the form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    //save in indexed db if the form has failed
    saveRecord(transaction);

    // clear the\ form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
