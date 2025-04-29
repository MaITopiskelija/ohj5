(function () {
  let polls = [];

  // Ladataan äänestystulokset localStoragesta
  function loadPolls() {
    polls = JSON.parse(localStorage.getItem("polls")) || [
      { name: "Kokoomus", description: "Politiikkamme perustuu arvoihin – Uskomme yksilöön, vastuuseen ja vapauteen. ", votesFor: 0 },
      { name: "SDP", description: "Me haluamme yhteiskunnan, joka on reilu kaikille", votesFor: 0 },
      { name: "Perussuomalaiset", description: "Perussuomalaiset on isänmaallinen ja kristillissosiaalinen puolue.", votesFor: 0 },
      { name: "Keskusta", description: "Tärkeintä on hyvä elämä tasapainossa luonnon kanssa.", votesFor: 0 }
    ];
  }

  // Tallennetaan äänet localStorageen
  function savePolls() {
    localStorage.setItem("polls", JSON.stringify(polls));
  }

  let pollChart;
  let loggedInUsername = null;
  let currentUserRole = "Normal User";

  document.getElementById("register-button").addEventListener("click", registerUser);
  document.getElementById("login-button").addEventListener("click", loginUser);
  document.getElementById("logout-button").addEventListener("click", logoutUser);
  document.getElementById("change-password-button").addEventListener("click", changePassword);
  document.getElementById("create-poll").addEventListener("click", createPoll);
  document.getElementById("open-create-poll-modal").addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById('createPollModal')).show();
  });
  document.getElementById("delete-poll").addEventListener("click", () => {
    const select = document.getElementById("poll-to-delete");
    select.innerHTML = "";
  
    polls.forEach((poll, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = poll.name;
      select.appendChild(option);
    });
  
    new bootstrap.Modal(document.getElementById('deletePollModal')).show();
  });

  document.getElementById("confirm-delete-poll").addEventListener("click", () => {
    const index = document.getElementById("poll-to-delete").value;
    polls.splice(index, 1);
    displayPolls();
    bootstrap.Modal.getInstance(document.getElementById('deletePollModal')).hide();
  });

  function registerUser() {
    const username = document.getElementById("registration-username").value;
    const password = document.getElementById("registration-password").value;
    const role = document.querySelector('input[name="role"]:checked').value;

    if (username && password) {
      let users = JSON.parse(localStorage.getItem("users")) || [];
      // Tarkistetaan, onko käyttäjätunnus jo olemassa
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        alert("Käyttäjätunnus on jo käytössä, valitse toinen!");
      } else {
        users.push({ username, password, role });
        localStorage.setItem("users", JSON.stringify(users));
        alert("Rekisteröinti onnistui!");
        document.getElementById("registration-username").value = "";
        document.getElementById("registration-password").value = "";
      }
    } else {
      alert("Käyttäjätunnus ja salasana ovat pakollisia.");
    }
  }

  function loginUser() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
  
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username && u.password === password);
  
    if (user) {
      loggedInUsername = user.username;
      currentUserRole = user.role;
      alert("Kirjautuminen onnistui!");
      document.getElementById("login-username").value = "";
      document.getElementById("login-password").value = "";
      
      // Piilotetaan tervetulokortti ja näytetään muu sisältö
      document.getElementById("welcome-card").style.display = "none";
      document.getElementById("main-section").style.display = "block";
      document.getElementById("moderator-section").style.display = user.role === "Moderator" ? "block" : "none";
      displayPolls();
    } else {
      alert("Virheellinen käyttäjätunnus tai salasana.");
    }
  }
  

  function logoutUser() {
    loggedInUsername = null;
    location.reload();
  }

  function changePassword() {
    const newPassword = prompt("Syötä uusi salasana:");
    if (newPassword) {
      let users = JSON.parse(localStorage.getItem("users")) || [];
      const userIndex = users.findIndex(u => u.username === loggedInUsername);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem("users", JSON.stringify(users));
        alert("Salasana vaihdettu onnistuneesti!");
      } else {
        alert("Käyttäjää ei löydy.");
      }
    }
  }

  function displayPolls() {
    const pollList = document.getElementById("poll-list");
    pollList.innerHTML = "";

    polls.forEach((poll, index) => {
      const pollCard = document.createElement("div");
      pollCard.classList.add("col-md-4");
      pollCard.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${poll.name}</h5>
            <p class="card-text">${poll.description}</p>
            <button class="btn btn-success btn-sm mt-2" onclick="vote(${index}, true)">Äänestä</button>
            <p class="mt-2">Ääniä: ${poll.votesFor}</p> <!-- Näytetään äänet -->
          </div>
        </div>
      `;
      pollList.appendChild(pollCard);
    });

    updatePollChart();
  }

  window.vote = function (index, isFor) {
    const voteKey = `voted_${loggedInUsername}_${polls[index].name}`;
    if (localStorage.getItem(voteKey)) {
      alert("Olet jo äänestänyt tässä puolueessa!");
      return;
    }

    if (isFor) {
      polls[index].votesFor++;
      savePolls();
      localStorage.setItem(voteKey, true); // estetään uudelleenäänestys
      displayPolls();
    }
  };

  function updatePollChart() {
    const ctx = document.getElementById('poll-chart').getContext('2d');
    const labels = polls.map(p => p.name);
  
    const totalVotesAll = polls.reduce((sum, p) => sum + p.votesFor, 0);
    const votesForPercentages = polls.map(p => {
      if (totalVotesAll === 0) return 0;
      return (p.votesFor / totalVotesAll) * 100;
    });
  
    if (pollChart) {
      pollChart.destroy();
    }
  
    pollChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '% Annetuista äänistä',
            data: votesForPercentages,
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // tärkeä mobiililaitteita varten
        animation: {
          duration: 1000
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + "%";
              }
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 14
              }
            }
          }
        }
      }
    });
  }
  

  function createPoll() {
    const pollName = document.getElementById("new-poll-name").value;
    const pollDescription = document.getElementById("new-poll-description").value;

    if (pollName && pollName.length <= 10 && pollDescription) {
      polls.push({ name: pollName, description: pollDescription, votesFor: 0 });
      document.getElementById("new-poll-name").value = "";
      document.getElementById("new-poll-description").value = "";
      displayPolls();
      bootstrap.Modal.getInstance(document.getElementById('createPollModal')).hide();
      savePolls();  // Tallennetaan uudet puolueet
    } else {
      alert("Anna puolueelle nimi.");
    }
  }

  // Ladataan aluksi äänestystulokset localStoragesta
  loadPolls();
})();
