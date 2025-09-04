const board = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const highlevelDisplay = document.getElementById('highlevel'); 
const targetDisplay = document.getElementById('target');
const celebrationOverlay = document.getElementById('celebration');
const timerElement = document.getElementById('level-timer');

let score = 0;
let level = 33;
let highLevel = localStorage.getItem('highLevel') || 1; 
let pokemonObjects = [];
let levelTimer = null;
let cursedModeActive = false;

// Normal Pokémon lists
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

// Cursed Pokémon (optional visuals, normal sprites for now)
const cursedPokemon = ['bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard',
    'squirtle','wartortle','blastoise','pikachu','raichu','eevee','jigglypuff','snorlax'
];

function getCurrentPokemonList() {
  if(level < 6) return easyPokemon;
  if(level < 11) return easyPokemon.concat(mediumPokemon);
  if(level < 33) return easyPokemon.concat(mediumPokemon).concat(hardPokemon);
  return easyPokemon.concat(mediumPokemon).concat(hardPokemon); // same list but cursed mode aesthetics applied
}

function getSprite(name) {
    return `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`;
}

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

// --- Cursed Mode ---
function enterCursedMode() {
  if(cursedModeActive) return;
  cursedModeActive = true;

  // Add shake effect
  const shakeElements = [board, targetDisplay, scoreDisplay, levelDisplay, highlevelDisplay];
  shakeElements.forEach(el => el.classList.add('brutal-shake'));
  setTimeout(() => shakeElements.forEach(el => el.classList.remove('brutal-shake')), 800);

  // Aesthetic change
  board.style.backgroundColor = '#0c0c0c';
  targetDisplay.style.color = '#FF3333';

  // Play cursed music
  const cursedMusic = new Audio('music/cursed pokemon for game.wav');
  cursedMusic.volume = 0.25;
  cursedMusic.loop = true;
  cursedMusic.play().catch(()=>{});

  window.cursedMusicAudio = cursedMusic;
}

// --- Game Loop ---
function startGame(){
  board.innerHTML='';
  pokemonObjects=[];

  // Trigger cursed mode at level 33
  if(level >= 33 && !cursedModeActive){
    enterCursedMode();
  }
  if(level < 33 && cursedModeActive){
    cursedModeActive = false;
    board.style.backgroundColor = '#dfe6eb';
    targetDisplay.style.color = '#FFCC00';
    if(window.cursedMusicAudio){
      window.cursedMusicAudio.pause();
      window.cursedMusicAudio = null;
    }
  }

  const currentList = getCurrentPokemonList();
  const totalImages = Math.min(3 + level, 20);

  const targetPokemon = randomItem(currentList);
  targetDisplay.textContent = `Find: ${targetPokemon.toUpperCase()}!`;
  const correctIndex = Math.floor(Math.random() * totalImages);

  board.style.position='relative';
  const boardRect=board.getBoundingClientRect();

  // Speed factor (resets each game)
  let speedFactor = Math.min(level * 0.05, 1.5); // cap speed at level 30
  if(level === 1) speedFactor = 0.25;

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

    const dx = (Math.random()-0.5) * speedFactor;
    const dy = (Math.random()-0.5) * speedFactor;

    pokemonObjects.push({el:img,x:pos.x,y:pos.y,dx,dy});

    img.addEventListener('click', ()=>{
      if(img.dataset.correct==='true'){
        clearInterval(levelTimer);
        score +=10;
        level +=1;
        if(level % 10 === 0){
          celebrateConfetti();
          showCelebration(`🎉 Level ${level}! 🎉`);
        }
        updateDisplay();
        startGame();
      } else {
        clearInterval(levelTimer);
        showCelebration('💥 Wrong Pokémon! Game Over 💥');
        score = 0;
        level = 1; 
        updateDisplay();
        startGame();
      }
    });
  }

  if(level >= 10){
    startTimer(10, ()=>{
      showCelebration('⏰ Time\'s up! Game Over ⏰');
      score=0;
      level=1;
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

  if(level > highLevel){
    highLevel = level;
    localStorage.setItem('highLevel', highLevel);
  }
  if(highlevelDisplay) highlevelDisplay.textContent = `Highest Level: ${highLevel}`;
}

startGame();





// --- Background Music Setup ---
const musicFiles = [
  { src: 'music/collectingsnailshells2 orch.wav', loop: false, repeat: 1 },
  { src: 'music/ancientmedalion orch.wav', loop: false, repeat: 3 },
  { src: 'music/islandfromabove2 orch.wav', loop: false, repeat: 1 },
];

let currentMusicIndex = 0;
let currentRepeat = 0;
let musicAudio = new Audio();
musicAudio.volume = 0; // start muted for autoplay
musicAudio.muted = true; // allows autoplay in most browsers
const targetVolume = 0.25; // reduced background volume
const fadeDuration = 2000; // 2 seconds fade in/out

// Shuffle array helper
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Fade function
function fadeAudio(toVolume, duration, callback) {
  const startVolume = musicAudio.volume;
  const stepTime = 50; // ms
  const steps = duration / stepTime;
  let stepCount = 0;

  const fadeInterval = setInterval(() => {
    stepCount++;
    musicAudio.volume = startVolume + (toVolume - startVolume) * (stepCount / steps);
    if (stepCount >= steps) {
      musicAudio.volume = toVolume;
      clearInterval(fadeInterval);
      if (callback) callback();
    }
  }, stepTime);
}

// Play next track
function playNextTrack() {
  if (musicFiles.length === 0) return;

  const track = musicFiles[currentMusicIndex];
  musicAudio.src = track.src;
  musicAudio.loop = false; // handle repeats manually
  currentRepeat++;

  // Fade in only for first play of this track
  if (currentRepeat === 1) fadeAudio(targetVolume, fadeDuration);

  // Play the audio
  musicAudio.play().catch(e => {
    console.log("Autoplay blocked. Click anywhere to start music.");
  });

  // Schedule fade-out before the track ends
  musicAudio.onloadedmetadata = () => {
    const fadeOutStart = musicAudio.duration - (track.loop || currentRepeat < (track.repeat || 1) ? 0 : fadeDuration / 1000);
    if (fadeOutStart > 0) {
      setTimeout(() => fadeAudio(0, fadeDuration), fadeOutStart * 1000);
    }
  };

  musicAudio.onended = () => {
    if (track.loop || currentRepeat < (track.repeat || 1)) {
      // Repeat same track immediately without fade-in
      musicAudio.play();
    } else {
      currentMusicIndex++;
      if (currentMusicIndex >= musicFiles.length) {
        shuffleArray(musicFiles); // reshuffle after finishing all tracks
        currentMusicIndex = 0;
      }
      currentRepeat = 0;
      playNextTrack();
    }
  };
}

// Shuffle initially
shuffleArray(musicFiles);

// Attempt autoplay on load
window.addEventListener('load', () => {
  musicAudio.muted = false; // unmute for fade-in
  playNextTrack();
});

// Fallback: allow user to click anywhere to start music if autoplay blocked
document.addEventListener('click', () => {
  if (musicAudio.paused) {
    musicAudio.muted = false;
    playNextTrack();
  }
}, { once: true });

