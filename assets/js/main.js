const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const locationOrder = ["Beaumont","Port Arthur","Mossville","Leesville"];

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quote && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quote = !quote; continue; }
    if (c === ',' && !quote) { row.push(cell); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !quote) {
      if (c === '\r' && n === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ''])));
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}

function renderSchedule(jobs) {
  const root = document.querySelector('#schedule');
  root.innerHTML = locationOrder.map(loc => {
    const rows = jobs.filter(j => j.location_group === loc).map(j => `
      <tr>
        <td>${esc(j.job_id)}</td><td>${esc(j.craft)}</td><td>${esc(j.crew_count)}</td><td>${esc(j.starting_location)}</td>
        ${days.map(d => `<td class="${j[d] === 'OFF' ? 'off' : ''}">${esc(j[d])}</td>`).join('')}
        <td>${esc(j.workday)}</td><td class="note">${esc(j.notes)}</td>
      </tr>`).join('');
    return `<section class="card"><h2 class="location-title"><span></span>${loc}</h2><div class="table-wrap"><table><thead><tr><th>Job ID</th><th>Craft</th><th>Crew Count</th><th>Starting Location</th>${days.map(d => `<th>${d}</th>`).join('')}<th>Workday</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join('');
}

function renderSummary(jobs) {
  document.querySelector('#summary').innerHTML = days.map(day => {
    const working = jobs.filter(j => j[day] !== 'OFF');
    const people = working.reduce((sum, j) => sum + Number(j.crew_count || 0), 0);
    return `<div class="summary-item"><strong>${day}</strong><div class="big">${people}</div><div class="small">people / ${working.length} jobs</div><div class="small">${esc(working.map(j => j.job_id).join(', '))}</div></div>`;
  }).join('');
}

fetch('data/jobs.csv')
  .then(r => r.text())
  .then(text => {
    const jobs = parseCSV(text);
    renderSummary(jobs);
    renderSchedule(jobs);
  })
  .catch(err => {
    document.querySelector('#schedule').innerHTML = `<section class="card"><h2>Could not load schedule data</h2><p>${esc(err.message)}</p></section>`;
  });
