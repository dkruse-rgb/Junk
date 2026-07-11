(() => {
  const YEAR = 2026;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const LONG_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DISPLAY_ORDER = ['XEN1B', 'XEN2B', 'XEN3B', 'XEN4B', 'XEN5B', 'XEN6B', 'XEN7B', 'XEN8B', 'XEN9B'];

  const JOBS = {
    XEN1B: { turn: 1, anchor: '2026-01-05' },
    XEN2B: { turn: 2, anchor: '2026-01-07' },
    XEN3B: { turn: 3, anchor: '2026-01-01' },
    XEN4B: { turn: 4, anchor: '2026-01-03' },
    XEN5B: { turn: 5, anchor: '2026-01-06' },
    XEN6B: { turn: 6, anchor: '2025-12-31' },
    XEN7B: { turn: 7, anchor: '2026-01-02' },
    XEN8B: { turn: 8, anchor: '2026-01-04' },
    XEN9B: { turn: 9, anchor: '2026-01-05' }
  };

  const picker = document.querySelector('#job-picker');
  const grid = document.querySelector('#calendar-grid');
  const selectedJob = document.querySelector('#selected-job');
  const selectedDescription = document.querySelector('#selected-description');
  const primaryStat = document.querySelector('#primary-stat');
  const primaryStatLabel = document.querySelector('#primary-stat-label');
  const printButton = document.querySelector('#print-calendar');
  const csvLink = document.querySelector('#download-csv');

  if (!picker || !grid) return;

  function parseDateKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }

  function utcFor(year, monthIndex, day) {
    return Date.UTC(year, monthIndex, day);
  }

  function dateKey(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function isOffDay(jobId, year, monthIndex, day) {
    const anchor = parseDateKey(JOBS[jobId].anchor);
    const current = utcFor(year, monthIndex, day);
    const difference = Math.floor((current - anchor) / DAY_MS);
    const cycleDay = ((difference % 8) + 8) % 8;
    return cycleDay === 0 || cycleDay === 1;
  }

  function isToday(monthIndex, day) {
    const today = new Date();
    return today.getFullYear() === YEAR && today.getMonth() === monthIndex && today.getDate() === day;
  }

  function getOffDays(jobId) {
    const dates = [];
    for (let month = 0; month < 12; month += 1) {
      const daysInMonth = new Date(YEAR, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        if (isOffDay(jobId, YEAR, month, day)) {
          dates.push({ month, day, key: dateKey(YEAR, month, day) });
        }
      }
    }
    return dates;
  }

  function summarizeMonth(jobId, monthIndex) {
    const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
    const offDays = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (isOffDay(jobId, YEAR, monthIndex, day)) offDays.push(day);
    }
    const ranges = [];
    for (let index = 0; index < offDays.length; index += 1) {
      const start = offDays[index];
      const next = offDays[index + 1];
      if (next === start + 1) {
        ranges.push(`${start}–${next}`);
        index += 1;
      } else {
        ranges.push(String(start));
      }
    }
    return ranges.join(', ');
  }

  function createAllTurnMonth(monthIndex) {
    const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
    const section = document.createElement('section');
    section.className = 'matrix-month';

    const heading = document.createElement('header');
    heading.className = 'matrix-month-heading';
    heading.innerHTML = `<h3>${MONTHS[monthIndex]} ${YEAR}</h3><span>Spots 1–9</span>`;
    section.appendChild(heading);

    const scroller = document.createElement('div');
    scroller.className = 'matrix-scroll';
    scroller.tabIndex = 0;

    const table = document.createElement('table');
    table.className = 'turn-matrix';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const spotHeader = document.createElement('th');
    spotHeader.scope = 'col';
    spotHeader.className = 'spot-column';
    spotHeader.textContent = 'Spot';
    headerRow.appendChild(spotHeader);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(YEAR, monthIndex, day);
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = 'date-column';
      if (date.getDay() === 0 || date.getDay() === 6) th.classList.add('weekend');
      if (isToday(monthIndex, day)) th.classList.add('today-column');
      th.innerHTML = `<span>${day}</span><small>${WEEKDAYS[date.getDay()].slice(0, 1)}</small>`;
      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    DISPLAY_ORDER.forEach((jobId) => {
      const row = document.createElement('tr');
      const jobHeader = document.createElement('th');
      jobHeader.scope = 'row';
      jobHeader.className = 'job-row-header';
      jobHeader.innerHTML = `<button type="button" class="turn-focus" data-job="${jobId}"><strong>Spot ${JOBS[jobId].turn}</strong><span>${jobId}</span></button>`;
      row.appendChild(jobHeader);

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(YEAR, monthIndex, day);
        const cell = document.createElement('td');
        const off = isOffDay(jobId, YEAR, monthIndex, day);
        if (date.getDay() === 0 || date.getDay() === 6) cell.classList.add('weekend');
        if (off) cell.classList.add('off-day');
        if (isToday(monthIndex, day)) cell.classList.add('today');
        cell.textContent = off ? 'OFF' : '';
        cell.setAttribute('aria-label', `Spot ${JOBS[jobId].turn}, ${jobId}, ${LONG_WEEKDAYS[date.getDay()]}, ${MONTHS[monthIndex]} ${day}, ${YEAR}${off ? ', assigned off day' : ''}`);
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    scroller.appendChild(table);
    section.appendChild(scroller);
    return section;
  }

  function createIndividualMonth(jobId, monthIndex) {
    const month = document.createElement('section');
    month.className = 'month-card';
    const header = document.createElement('header');
    header.className = 'month-heading';
    header.innerHTML = `<h3>${MONTHS[monthIndex]}</h3><p>Off: ${summarizeMonth(jobId, monthIndex)}</p>`;
    month.appendChild(header);

    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'weekday-row';
    WEEKDAYS.forEach((weekday) => {
      const label = document.createElement('span');
      label.textContent = weekday;
      weekdayRow.appendChild(label);
    });
    month.appendChild(weekdayRow);

    const days = document.createElement('div');
    days.className = 'month-days';
    const firstWeekday = new Date(YEAR, monthIndex, 1).getDay();
    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'calendar-day empty-day';
      days.appendChild(spacer);
    }

    const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement('span');
      cell.className = 'calendar-day';
      cell.textContent = day;
      if (isOffDay(jobId, YEAR, monthIndex, day)) cell.classList.add('off-day');
      if (isToday(monthIndex, day)) cell.classList.add('today');
      days.appendChild(cell);
    }
    month.appendChild(days);
    return month;
  }

  function buildCsvDownload() {
    if (!csvLink) return;
    const rows = [['job_id', 'matrix_turn', 'date', 'day_of_week', 'month']];
    DISPLAY_ORDER.forEach((jobId) => {
      getOffDays(jobId).forEach(({ month, day, key }) => {
        const weekday = LONG_WEEKDAYS[new Date(YEAR, month, day).getDay()];
        rows.push([jobId, JOBS[jobId].turn, key, weekday, MONTHS[month]]);
      });
    });
    const csv = rows.map((row) => row.join(',')).join('\n');
    csvLink.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    csvLink.download = 'xen-ado-off-days-2026.csv';
  }

  function render(view) {
    const normalizedView = view === 'ALL' || JOBS[view] ? view : 'ALL';
    grid.replaceChildren();

    if (normalizedView === 'ALL') {
      grid.className = 'all-turn-calendar';
      for (let month = 0; month < 12; month += 1) grid.appendChild(createAllTurnMonth(month));
      selectedJob.textContent = 'All XEN Turn Spots';
      selectedDescription.textContent = 'Spots 1 through 9 shown together for all twelve months';
      primaryStat.textContent = '9';
      primaryStatLabel.textContent = 'turn spots shown';
    } else {
      const job = JOBS[normalizedView];
      grid.className = 'year-calendar';
      for (let month = 0; month < 12; month += 1) grid.appendChild(createIndividualMonth(normalizedView, month));
      selectedJob.textContent = `Spot ${job.turn} — ${normalizedView}`;
      selectedDescription.textContent = `Matrix Turn ${job.turn} • 6 days on, 2 assigned days off`;
      primaryStat.textContent = String(getOffDays(normalizedView).length);
      primaryStatLabel.textContent = 'off days in 2026';
    }

    picker.value = normalizedView;
    const url = new URL(window.location.href);
    url.searchParams.set('view', normalizedView);
    window.history.replaceState({}, '', url);
  }

  const requested = (new URLSearchParams(window.location.search).get('view') || 'ALL').toUpperCase();
  buildCsvDownload();
  render(requested);

  picker.addEventListener('change', () => render(picker.value));
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.turn-focus');
    if (button) render(button.dataset.job);
  });
  if (printButton) printButton.addEventListener('click', () => window.print());
})();
