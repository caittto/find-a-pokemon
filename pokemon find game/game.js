const board = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const targetDisplay = document.getElementById('target');
const celebrationOverlay = document.getElementById('celebration');
const timerElement = document.getElementById('level-timer');

let score = 0;
let level = 1;
let baseSpeed = 0.5; // starting speed
let pokemonObjects = [];
let levelTimer = null;

const easyPokemon = ['bulbasaur','charmander','squirtle','pikachu','eevee','jigglypuff'];
const mediumPokemon = ['clefairy','meowth','psyduck','snorlax'];
const hardPokemon = [
  'zubat','golbat','oddish','gloom','vileplume','paras','parasect','venonat','venomoth',
  'tentacool','tentacruel','geodude','graveler','golem','ponyta','rapidash','slowpoke','slowbro',
  'magnemite','magneton','farfetchd','doduo','dodrio','seel','dewgong','grimer','muk','shellder',
  'cloyster','gastly','haunter','gengar','onix','drowzee','hypno','krabby','kingler','voltorb',
  'electrode','exeggcute','exeggutor','cubone','marowak','hitmonlee','hitmonchan','lickitung',
  'koffing','weezing','rhyhorn','rhydon','chansey','tangela','kangaskhan','horsea','seadra',
  'goldeen','seaking','staryu','starmie','scyther','jynx','electabuzz','magmar','pinsir','tauros',
  'magikarp','gyarados','lapras','ditto','vaporeon','jolteon','flareon','porygon','omanyte',
  'omastar','kabuto','kabutops','aerodactyl','dragonair','dragonite','mewtwo','mew'
];

function getCurrentPokemonList() {
  if (level <= 5) return easyPokemon;
  if (level <= 10) return easyPokemon.concat(mediumPokemon);
  return easyPokemon.concat(mediumPokemon).concat(hardPokemon);
}

function getSprite(name) { return `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`; }
function randomItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randomOtherThan(arr, exclude) { return randomItem(arr.filter(x=>x!==exclude)); }

function celebrateConfetti() {
  const confettiCount = 150;
  for (let i=0;i<confettiCount;i++){
    const confetti = document.createElement('div');
    confetti.className='confetti';
    confetti.style.left=`${Math.random()*100}vw`;
    confetti.style.animationDelay=`${Math.random()*2}s`;
    confetti.style.backgroundColor=`hsl(${Math.random()*360},70%,60%)`;
    document.body.appendChild(confetti);
    setTimeout(()=>confetti.remove(),3000);
  }
}

function showCelebration(message) {
  celebrationOverlay.style.display = 'flex';
  celebrationOverlay.textContent = message;
  setTimeout(()=> celebrationOverlay.style.display = 'none', 2000);
}

function startTimer(seconds, onTimeout){
  clearInterval(levelTimer);
  timerElement.textContent = seconds;
  let remaining = seconds;
  levelTimer = setInterval(()=>{
    remaining--;
    timerElement.textContent = remaining;
    if(remaining<=0){
      clearInterval(levelTimer);
      onTimeout();
    }
  },1000);
}

function getNonOverlappingPosition(existingPositions, width, height, boardWidth, boardHeight) {
  let x, y, safe, attempts=0;
  do {
      safe = true;
      x = Math.random() * (boardWidth - width);
      y = Math.random() * (boardHeight - height);
      for (let pos of existingPositions) {
          if (!(x + width < pos.x || x > pos.x + width || y + height < pos.y || y > pos.y + height)) {
              safe = false;
              break;
          }
      }
      attempts++;
      if(attempts>1000) break;
  } while(!safe);
  return {x,y};
}

function startGame(){
  board.innerHTML='';
  pokemonObjects=[];

  const currentList = getCurrentPokemonList();
  const totalImages = Math.min(3 + level, 20);

  const targetPokemon = randomItem(currentList);
  targetDisplay.textContent = `Find: ${targetPokemon.toUpperCase()}!`;
  const correctIndex = Math.floor(Math.random() * totalImages);

  board.style.position='relative';
  const boardRect=board.getBoundingClientRect();

  for(let i=0;i<totalImages;i++){
    const img = document.createElement('img');
    img.style.width='120px';
    img.style.height='120px';
    img.style.position='absolute';

    if(i===correctIndex){
      img.src=getSprite(targetPokemon);
      img.dataset.correct='true';
    } else {
      const otherMon = randomOtherThan(currentList, targetPokemon);
      img.src=getSprite(otherMon);
    }

    img.onerror=()=>{img.src='https://play.pokemonshowdown.com/sprites/gen5/pokeball.png';};
    board.appendChild(img);

    const existingPositions = pokemonObjects.map(p=>({x:p.x,y:p.y}));
    const pos = getNonOverlappingPosition(existingPositions,120,120,boardRect.width,boardRect.height);
    img.style.left = `${pos.x}px`;
    img.style.top = `${pos.y}px`;

    // Speed increases slightly with level
    const speedMultiplier = 1 + (level-1) * 0.05;
    const dx = (Math.random()-0.5) * baseSpeed * speedMultiplier;
    const dy = (Math.random()-0.5) * baseSpeed * speedMultiplier;

    pokemonObjects.push({el:img,x:pos.x,y:pos.y,dx,dy});

    img.addEventListener('click', ()=>{
      if(img.dataset.correct==='true'){
        clearInterval(levelTimer);
        score+=10;
        level+=1;
        if(level % 10 === 0){
          celebrateConfetti();
          showCelebration(`🎉 Level ${level}! 🎉`);
        }
        updateDisplay();
        startGame();
      } else {
        clearInterval(levelTimer);
        showCelebration('💥 Wrong Pokémon! Game Over 💥');
        score=0;
        level=1;
        baseSpeed = 0.5; // Reset speed on fail
        updateDisplay();
        startGame();
      }
    });
  }

  // Start timer if level >=10
  if(level >= 10){
    startTimer(10, ()=>{
      showCelebration('⏰ Time\'s up! Game Over ⏰');
      score=0;
      level=1;
      baseSpeed = 0.5; // Reset speed on timeout
      updateDisplay();
      startGame();
    });
  } else {
    clearInterval(levelTimer);
    timerElement.textContent = '';
  }

  function animate(){
    for(let p of pokemonObjects){
      let newX = p.x + p.dx;
      let newY = p.y + p.dy;
      if(newX < 0 || newX > boardRect.width - 120) p.dx = -p.dx;
      if(newY < 0 || newY > boardRect.height - 120) p.dy = -p.dy;
      p.x += p.dx;
      p.y += p.dy;
      p.el.style.left = `${p.x}px`;
      p.el.style.top = `${p.y}px`;
    }
    requestAnimationFrame(animate);
  }

  animate();
}

function updateDisplay(){
  scoreDisplay.textContent = `Score: ${score}`;
  levelDisplay.textContent = `Level: ${level}`;
}

startGame();
