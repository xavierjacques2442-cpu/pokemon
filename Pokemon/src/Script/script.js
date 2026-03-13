console.log("JS LOADED");

let shiny = false;
let currentPokemon = null;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("userInput");
  const enterBtn = document.getElementById("EnterBtn");
  const randomBtn = document.getElementById("randomBtn");
  const favoriteBtn = document.getElementById("favoriteBtn");
  const starBtn = document.getElementById("favoriteStar");
  const mainImg = document.getElementById("mainImg");

  const favoritesPanel = document.getElementById("favoritesPanel");
  const closeFavorites = document.getElementById("closeFavorites");

  enterBtn.onclick = () => fetchPokemon(input.value);

  input.onkeydown = e => {
    if (e.key === "Enter") fetchPokemon(input.value);
  };

  randomBtn.onclick = () => {
    const id = Math.floor(Math.random() * 649) + 1;
    fetchPokemon(id);
  };

  favoriteBtn.onclick = () => {
    favoritesPanel.classList.remove("-translate-x-full");
    renderFavorites();
  };

  closeFavorites.onclick = () => {
    favoritesPanel.classList.add("-translate-x-full");
  };

  starBtn.onclick = toggleFavorite;
  mainImg.onclick = toggleShiny;

  fetchPokemon(6);
});

async function fetchPokemon(nameOrId) {
  if (!nameOrId) return;

  try {
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${nameOrId.toString().toLowerCase()}`
    );

    const data = await res.json();

    currentPokemon = data;
    shiny = false;

    displayPokemon(data);
    fetchEvolution(data.species.url);
    updateStar();

  } catch (err) {
    console.error(err);
    alert("Pokemon not found!");
  }
}

function displayPokemon(data) {

  const nameEl = document.getElementById("pokemonName");
  const numberEl = document.getElementById("pokedexNumber");
  const imgEl = document.getElementById("mainImg");
  const typesDiv = document.getElementById("types");
  const movesEl = document.getElementById("moves");
  const abilitiesEl = document.getElementById("abilities");
  const locationsEl = document.getElementById("locations");
  const formText = document.getElementById("form");

  nameEl.textContent = data.name;
  numberEl.textContent = `#${data.id.toString().padStart(3, "0")}`;

  imgEl.src =
    data.sprites.other["official-artwork"].front_default;

  formText.textContent = "Form: Default";

  typesDiv.innerHTML = "";

  data.types.forEach(t => {
    const box = document.createElement("div");
    box.className =
      "bg-white/60 px-3 py-1 rounded-full font-semibold capitalize";

    box.textContent = t.type.name;
    typesDiv.appendChild(box);
  });

  movesEl.innerHTML =
    "<b>Moves:</b><br>" +
    data.moves.slice(0, 20)
      .map(m => m.move.name)
      .join(", ");

  abilitiesEl.innerHTML =
    "<b>Abilities:</b><br>" +
    data.abilities
      .map(a => a.ability.name)
      .join(", ");

  fetch(data.location_area_encounters)
    .then(r => r.json())
    .then(loc => {
      locationsEl.innerHTML =
        "<b>Locations:</b><br>" +
        (loc.length
          ? loc.map(l => l.location_area.name).join(", ")
          : "Unknown");
    });
}

function toggleShiny() {

  if (!currentPokemon) return;

  shiny = !shiny;

  const imgEl = document.getElementById("mainImg");
  const formText = document.getElementById("form");

  imgEl.src = shiny
    ? currentPokemon.sprites.other["official-artwork"].front_shiny
    : currentPokemon.sprites.other["official-artwork"].front_default;

  formText.textContent =
    shiny ? "Form: Shiny" : "Form: Default";
}

function toggleFavorite() {

  if (!currentPokemon) return;

  const name = currentPokemon.name;
  const index = favorites.indexOf(name);

  if (index === -1) {
    favorites.push(name);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  updateStar();
  renderFavorites();
}

function updateStar() {

  const star = document.getElementById("favoriteStar");

  if (!currentPokemon) return;

  star.src = favorites.includes(currentPokemon.name)
    ? "./src/images/Favorite star.png"
    : "./src/images/star.png";
}

function renderFavorites() {

  const list = document.getElementById("favoritesList");
  list.innerHTML = "";

  favorites.forEach(name => {

    const li = document.createElement("li");
    li.className =
      "cursor-pointer hover:text-yellow-300 capitalize";

    li.textContent = name;
    li.onclick = () => fetchPokemon(name);

    list.appendChild(li);
  });
}

async function fetchEvolution(speciesUrl) {

  const res = await fetch(speciesUrl);
  const species = await res.json();

  const evoRes = await fetch(species.evolution_chain.url);
  const evoData = await evoRes.json();

  const evoBox = document.getElementById("evolutionBox");

  evoBox.innerHTML =
    "<b>Evolution Line</b><div class='flex gap-4 mt-2 flex-wrap'></div>";

  const container = evoBox.querySelector("div");

  let chain = evoData.chain;

  while (chain) {

    const pokeRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${chain.species.name}`
    );

    const poke = await pokeRes.json();

    const card = document.createElement("div");
    card.className = "text-center cursor-pointer";

    card.innerHTML = `
      <img src="${poke.sprites.other["official-artwork"].front_default}"
           class="w-20 mx-auto">
      <p class="capitalize">${chain.species.name}</p>
    `;

    card.onclick = () => fetchPokemon(chain.species.name);

    container.appendChild(card);

    chain = chain.evolves_to[0];
  }
}
