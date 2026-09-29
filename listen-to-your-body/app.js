const screen = document.querySelector('#screen');
const stepLabel = document.querySelector('#step-label');
const progressBar = document.querySelector('#progress-bar');
const dancerTemplate = document.querySelector('#dancer-template');
const mapTemplate = document.querySelector('#body-map-template');

const bodyAreas = [
  ['Head',131,53],['Neck',131,84],['Jaw',151,67],['Shoulders',104,108],['Upper back / thoracic spine',132,134],['Lower back / lumbar spine',132,207],['Chest',132,156],['Ribs',151,174],['Upper arm / biceps',82,133],['Elbow',65,157],['Forearm',54,174],['Wrist',43,184],['Hand / fingers',34,193],['Abdomen / core',132,190],['Hip flexors',122,230],['Gluteal muscles',143,233],['Hip joint',132,243],['Groin',132,258],['Quadriceps / front thigh',111,281],['Hamstrings / back thigh',151,281],['Adductors / inner thigh',128,298],['Iliotibial (IT) band / outer thigh',94,303],['Knee / patella',105,322],['Shin / tibia',101,344],['Calf',157,345],['Achilles tendon',171,366],['Ankle',88,371],['Heel',73,388],['Arch of foot',63,397],['Ball of foot',54,402],['Toes',43,407]
].map(([name, x, y]) => ({ name, x, y }));

const state = { step: 'arrival', sleep: null, areas: [], currentArea: null, sound: false };
const flow = ['arrival', 'pause', 'sleep', 'scan', 'feeling', 'intensity', 'map', 'reflection', 'return'];

function dancer({ scanning = false, caption = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.append(dancerTemplate.content.cloneNode(true));
  const scene = wrap.firstElementChild;
  if (scanning) {
    scene.classList.add('scanning');
    const hotspots = scene.querySelector('#scan-hotspots');
    bodyAreas.forEach((area) => {
      const selected = state.areas.some((item) => item.name === area.name);
      hotspots.insertAdjacentHTML('beforeend', `<g class="hotspot ${selected ? 'selected' : ''}" data-area="${area.name}" role="button" tabindex="0" aria-label="${selected ? 'Remove' : 'Select'} ${area.name}" aria-pressed="${selected}"><circle cx="${area.x}" cy="${area.y}" r="${selected ? 8 : 5.5}" /></g>`);
    });
  }
  scene.querySelector('#body-caption').textContent = caption;
  return scene.outerHTML;
}

function button(label, action, className = 'primary-button') { return `<button class="${className}" type="button" data-action="${action}">${label}</button>`; }
function current() { return state.areas.find((area) => area.name === state.currentArea); }
function moveTo(step) { state.step = step; render(); screen.querySelector('button, input')?.focus({ preventScroll: true }); }

function render() {
  const index = flow.indexOf(state.step);
  progressBar.style.width = `${Math.max(0, index) / (flow.length - 1) * 100}%`;
  stepLabel.textContent = index >= 0 ? `${String(index + 1).padStart(2, '0')} / ${String(flow.length).padStart(2, '0')}` : '';
  const views = { arrival, pause, sleep, scan, feeling, intensity, map, reflection, return: finish };
  screen.innerHTML = views[state.step]();
  bindScreen();
}

function arrival() { return `<div class="screen-inner">${dancer({ caption: 'breathe in · breathe out' })}<p class="eyebrow">A small daily ritual</p><h1 id="screen-title">Your body is communicating with you.</h1><p class="subtitle">Before you dance, take a moment to arrive.</p>${button('Begin check-in', 'pause')}</div>`; }
function pause() { return `<div class="screen-inner"><p class="eyebrow">A pause</p><h1 id="screen-title">Take one breath.</h1><div class="pause-orb" aria-label="A slow breathing circle"><span>inhale<br>exhale</span></div><p class="subtitle">There is no right answer. Just notice.</p>${button("I'm ready", 'sleep')}</div>`; }
function sleep() {
  const options = [['🌙', '0–3 hrs'], ['🌘', '4–5 hrs'], ['🌗', '6 hrs'], ['🌕', '7 hrs'], ['✨', '8+ hrs']];
  return `<div class="screen-inner"><p class="eyebrow">Last night</p><h1 id="screen-title">How did you sleep?</h1><p class="subtitle">Choose the one that feels closest.</p><div class="choice-grid">${options.map(([icon, text]) => `<button class="choice ${state.sleep === text ? 'selected' : ''}" type="button" data-sleep="${text}"><span class="moon">${icon}</span>${text}</button>`).join('')}</div><p class="subtitle">${state.sleep ? 'Thank you for noticing.' : ''}</p>${state.sleep ? button('Continue', 'scan') : ''}</div>`;
}
function scan() {
  const count = state.areas.length;
  return `<div class="screen-inner scan-screen"><p class="eyebrow">Body scan</p><h1 id="screen-title">Now, listen to your body.</h1><p class="scan-note">Choose every place you notice today.<br>soreness · stiffness · discomfort · pain</p>${dancer({ scanning: true, caption: count ? `${count} area${count === 1 ? '' : 's'} selected` : 'tap a point or choose from the list' })}<div class="area-picker" aria-label="All body areas">${bodyAreas.map((area, index) => `<button class="area-option ${state.areas.some((item) => item.name === area.name) ? 'selected' : ''}" type="button" data-area="${area.name}" aria-pressed="${state.areas.some((item) => item.name === area.name)}"><span>${String(index + 1).padStart(2, '0')}</span>${area.name}</button>`).join('')}</div>${count ? button(`Continue with ${count} area${count === 1 ? '' : 's'}`, 'describe') : '<p class="choose-hint">Choose at least one place when you are ready.</p>'}</div>`;
}
function feeling() {
  const area = current(); const position = state.areas.indexOf(area) + 1;
  return `<div class="screen-inner"><p class="eyebrow">Area ${position} of ${state.areas.length}</p><p class="area-name">${area.name}</p><h1 id="screen-title">What are you noticing?</h1><div class="feeling-grid">${['Stiff', 'Sore', 'Painful', 'Sharp'].map((value) => `<button class="choice feeling ${area.feeling === value ? 'selected' : ''}" type="button" data-feeling="${value}">${value}</button>`).join('')}</div>${area.feeling ? `<p class="subtitle">Thank you.</p>${button('Continue', 'intensity')}` : ''}</div>`;
}
function intensity() {
  const area = current(); const value = area.intensity || 3; const last = state.areas.at(-1).name === area.name;
  const wording = value <= 2 ? 'barely noticeable' : value <= 4 ? 'present, but gentle' : value <= 6 ? 'difficult to ignore' : value <= 8 ? 'asking for more care' : 'extremely intense';
  return `<div class="screen-inner"><p class="eyebrow">${area.name}</p><h1 id="screen-title">How intense does it feel right now?</h1><div class="intensity-wrap"><div class="intensity-readout"><span>${value}</span><small>${wording}</small></div><input class="range" id="intensity" type="range" min="1" max="10" value="${value}" aria-label="Intensity from 1 to 10"><div class="range-labels"><span>1 · barely noticeable</span><span>10 · extremely intense</span></div></div>${button(last ? "I'm done with these areas" : 'Next selected area', 'next-area')}</div>`;
}
function map() {
  const wrapper = document.createElement('div'); wrapper.append(mapTemplate.content.cloneNode(true)); const markers = wrapper.querySelector('#map-markers');
  state.areas.forEach((area) => { const point = bodyAreas.find((item) => item.name === area.name); markers.insertAdjacentHTML('beforeend', `<circle class="map-marker" cx="${point.x}" cy="${point.y}" r="7"><title>${area.name}</title></circle>`); });
  return `<div class="screen-inner"><p class="eyebrow">Your body map</p><h1 id="screen-title">This is your body today.</h1>${wrapper.innerHTML}<ul class="list">${state.areas.map((area) => `<li><b>${area.name}</b><span>${area.feeling} · ${area.intensity}/10</span></li>`).join('')}</ul><p class="subtitle">You noticed ${state.areas.length} place${state.areas.length === 1 ? '' : 's'} today.</p>${button('Give it a voice', 'reflection')}</div>`;
}
function reflection() { const high = Math.max(...state.areas.map((area) => area.intensity)); const message = high >= 7 ? '“You noticed some intensity today. Maybe we can move with a little more care.”' : high >= 4 ? '“I feel a little tired today. Thank you for paying attention.”' : '“I feel relatively light today. Let’s keep listening.”'; return `<div class="screen-inner"><p class="eyebrow">If your body could respond</p>${dancer({ caption: 'listening changes the relationship' })}<p class="reflection">${message}</p>${button("See today's reflection", 'return')}</div>`; }
function finish() { const high = Math.max(...state.areas.map((area) => area.intensity)); return `<div class="screen-inner"><p class="eyebrow">Today's reflection</p><h1 id="screen-title">Noticing is already a form of care.</h1><div class="stats"><div class="stat"><strong>${state.sleep || '—'}</strong><span>Sleep</span></div><div class="stat"><strong>${state.areas.length}</strong><span>Areas noticed</span></div><div class="stat"><strong>${high}/10</strong><span>Highest intensity</span></div></div><p class="reflection">You don't have to fix everything today.</p>${button("Finish today's check-in", 'week')}</div>`; }
function week() { const days = [['Mon','🙂','7 h'], ['Tue','😐','6 h'], ['Wed','😕','5 h'], ['Thu','😣','5 h'], ['Fri','😣','6 h'], ['Sat','😐','6 h'], ['Sun','🙂','7 h']]; return `<div class="screen-inner"><p class="eyebrow">Seven days later</p><h1 id="screen-title">You listened for seven days.</h1><p class="subtitle">Touch a day and let its body story come alive.</p><div class="days">${days.map(([day, face, detail], i) => `<button class="day ${i === 6 ? 'active' : ''}" type="button" data-day="${i}" data-detail="${day} · ${detail} sleep · ${i === 3 || i === 4 ? 'right knee asked for more care' : 'a gentle check-in'}">${day}<b>${face}</b></button>`).join('')}</div><p class="week-detail" id="week-detail">Sun · 7 h sleep · a gentle check-in</p><p class="reflection">Your body isn't something you have to conquer. It is something you can learn to listen to.</p>${button('Begin again', 'arrival', 'secondary-button')}</div>`; }

function bindScreen() {
  screen.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', () => {
    const action = element.dataset.action;
    if (action === 'week') { state.step = 'week'; screen.innerHTML = week(); bindScreen(); progressBar.style.width = '100%'; stepLabel.textContent = 'A WEEK IN LISTENING'; return; }
    if (action === 'describe') { state.currentArea = state.areas[0].name; moveTo('feeling'); return; }
    if (action === 'next-area') { const index = state.areas.findIndex((area) => area.name === state.currentArea); if (index === state.areas.length - 1) moveTo('map'); else { state.currentArea = state.areas[index + 1].name; moveTo('feeling'); } return; }
    moveTo(action);
  }));
  screen.querySelectorAll('[data-sleep]').forEach((element) => element.addEventListener('click', () => { state.sleep = element.dataset.sleep; render(); }));
  const toggleArea = (name) => { const index = state.areas.findIndex((area) => area.name === name); if (index >= 0) state.areas.splice(index, 1); else state.areas.push({ name, feeling: null, intensity: 3 }); render(); };
  screen.querySelectorAll('[data-area]').forEach((element) => { element.addEventListener('click', () => toggleArea(element.dataset.area)); element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleArea(element.dataset.area); } }); });
  screen.querySelectorAll('[data-feeling]').forEach((element) => element.addEventListener('click', () => { current().feeling = element.dataset.feeling; render(); }));
  const intensity = screen.querySelector('#intensity'); if (intensity) intensity.addEventListener('input', () => { current().intensity = Number(intensity.value); render(); });
  screen.querySelectorAll('[data-day]').forEach((element) => element.addEventListener('click', () => { screen.querySelectorAll('[data-day]').forEach((day) => day.classList.remove('active')); element.classList.add('active'); screen.querySelector('#week-detail').textContent = element.dataset.detail; }));
}

document.querySelector('#home-link').addEventListener('click', (event) => { event.preventDefault(); Object.assign(state, { step: 'arrival', sleep: null, areas: [], currentArea: null }); render(); });
document.querySelector('#sound-toggle').addEventListener('click', (event) => { state.sound = !state.sound; event.currentTarget.textContent = state.sound ? 'Sound on' : 'Sound off'; event.currentTarget.setAttribute('aria-pressed', state.sound); });
render();
