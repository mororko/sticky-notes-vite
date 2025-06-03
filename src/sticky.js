let notes = {};
let container;

export function initNotes() {
  container = document.querySelector('.sticky-notes');
  notes = JSON.parse(localStorage.getItem('stickyNotes')) || {};
  Object.entries(notes).forEach(([id, data]) => createNote(id, data));

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
}

export function createNote(dataOrId, maybeData) {
  const isRestoring = typeof dataOrId === 'string';
  const id = isRestoring ? dataOrId : Date.now().toString();
  const data = isRestoring
    ? maybeData
    : {
        content: '<h3>Título</h3><p>Texto aquí...</p>',
        color: dataOrId.color,
        category: dataOrId.category,
        tags: dataOrId.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...getRandomPosition()
      };

  notes[id] = data;
  localStorage.setItem('stickyNotes', JSON.stringify(notes));

  const li = document.createElement('li');
  const note = document.createElement('div');
  note.className = 'note';
  note.style.setProperty('--note-color', data.color);
  note.style.left = data.left;
  note.style.top = data.top;
  note.innerHTML = data.content;
  note.contentEditable = true;
  note.dataset.category = data.category; // usado por filtros

  const label = document.createElement('div');
  label.className = 'category-label';
  label.textContent = formatCategory(data.category);
  note.prepend(label);

  const tags = document.createElement('div');
  tags.className = 'tags';
  data.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = `#${tag}`;
    tags.appendChild(span);
  });
  note.appendChild(tags);

  li.appendChild(note);
  container.prepend(li); // insertar arriba
  enableDrag(note, id);

  note.addEventListener('input', () => {
    notes[id].content = note.innerHTML;
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
  });
}

function enableDrag(note, id) {
  let dragging = false, offsetX = 0, offsetY = 0, startX, startY;
  const trash = document.getElementById('trash');

  const onMouseDown = (e) => {
    const rect = note.getBoundingClientRect();
    const margin = 16;

    const onEdge =
      e.clientX - rect.left < margin ||
      rect.right - e.clientX < margin ||
      e.clientY - rect.top < margin ||
      rect.bottom - e.clientY < margin;

    if (!onEdge) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    offsetX = parseInt(note.style.left) || 0;
    offsetY = parseInt(note.style.top) || 0;
    note.style.zIndex = 999;
    note.classList.add('dragging');
    note.style.cursor = 'move';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Usamos requestAnimationFrame para suavizar
    requestAnimationFrame(() => {
      note.style.left = `${offsetX + dx}px`;
      note.style.top = `${offsetY + dy}px`;

      const rect = trash.getBoundingClientRect();
      const overTrash =
        e.clientX > rect.left &&
        e.clientX < rect.right &&
        e.clientY > rect.top &&
        e.clientY < rect.bottom;

      note.dataset.overTrash = overTrash;
      trash.classList.toggle('hover', overTrash);
    });
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    note.style.zIndex = '';
    note.classList.remove('dragging');
    note.style.cursor = 'text';

    if (note.dataset.overTrash === 'true') {
      note.parentElement.remove();
      delete notes[id];
      localStorage.setItem('stickyNotes', JSON.stringify(notes));
      trash.classList.remove('hover');
    } else {
      notes[id].left = note.style.left;
      notes[id].top = note.style.top;
      localStorage.setItem('stickyNotes', JSON.stringify(notes));
    }

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  note.addEventListener('mousedown', onMouseDown);
}


function getRandomPosition() {
  // return {
  //   left: `${Math.random() * (window.innerWidth - 260)}px`,
  //   top: `${Math.random() * (window.innerHeight - 200)}px`
  // };
  return {
    left: '40px',
    top: '40px'
  };
}

function formatCategory(cat) {
  switch (cat) {
    case 'idea': return '💡 Idea';
    case 'task': return '✅ Tarea';
    case 'urgent': return '🔥 Urgente';
    case 'pending': return '⏳ Pendiente';
    default: return '';
  }
}

export function clearAllNotes() {
  notes = {};
  container.innerHTML = '';
  localStorage.removeItem('stickyNotes');
  showToast('Notas eliminadas 🗑️');
}

export function resetBoard() {
  localStorage.clear();
  notes = {};
  container.innerHTML = '';
  showToast('Tablero restablecido 🔄');
}

export function exportNotes() {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notas.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importNotes(json) {
  try {
    notes = JSON.parse(json);
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
    container.innerHTML = '';
    Object.entries(notes).forEach(([id, data]) => createNote(id, data));
    showToast('Importación completada ✅');
  } catch {
    showToast('Error al importar ❌');
  }
}

export function toggleDarkMode() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', dark);
}

export function applyFilters() {
  const cat = document.getElementById('filterCategory').value;
  const tagFilter = document.getElementById('filterTags').value.toLowerCase();
  const search = document.getElementById('search').value.toLowerCase();

  const all = document.querySelectorAll('.sticky-notes > li');
  all.forEach(li => {
    const note = li.querySelector('.note');
    const html = note.innerHTML.toLowerCase();
    const noteCat = note.dataset.category || '';
    const tags = [...note.querySelectorAll('.tags span')].map(t => t.textContent.toLowerCase());

    const matchesCat = !cat || noteCat === cat;
    const matchesTag = !tagFilter || tags.some(t => t.includes(`#${tagFilter}`));
    const matchesSearch = !search || html.includes(search);

    li.style.display = matchesCat && matchesTag && matchesSearch ? '' : 'none';
  });
}

export function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
