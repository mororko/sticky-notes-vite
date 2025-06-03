import './styles.css';
import {
  initNotes,
  clearAllNotes,
  exportNotes,
  importNotes,
  resetBoard,
  toggleDarkMode,
  applyFilters,
  showToast,
  createNote
} from './sticky.js';

document.addEventListener('DOMContentLoaded', () => {
  initNotes();

  const colorSelector = document.getElementById('color');
  const categorySelect = document.getElementById('category');
  const tagsInput = document.getElementById('tagsInput');

  // 🔁 Actualiza fondo del selector según el color elegido
  const updateColorSelectBackground = () => {
    const selectedColor = colorSelector.value;
    colorSelector.style.backgroundColor = selectedColor;
    colorSelector.style.color = '#000'; // negro por contraste
  };

  colorSelector.addEventListener('change', updateColorSelectBackground);
  updateColorSelectBackground(); // Inicializa el fondo

  document.getElementById('addNote').addEventListener('click', () => {
    const color = colorSelector.value;
    const category = categorySelect.value;
    const tagCheckboxes = tagsInput.querySelectorAll('input[type="checkbox"]:checked');
    const tags = Array.from(tagCheckboxes).map(cb => cb.value).join(',');
    createNote({ color, category, tags });
  });

  document.getElementById('clearBoard').addEventListener('click', clearAllNotes);
  document.getElementById('resetBoard').addEventListener('click', resetBoard);
  document.getElementById('exportBtn').addEventListener('click', exportNotes);

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importNotes(ev.target.result);
    reader.readAsText(file);
  });

  document.getElementById('toggleDark').addEventListener('click', toggleDarkMode);

  document.getElementById('filterCategory').addEventListener('change', applyFilters);
  document.getElementById('filterTags').addEventListener('change', applyFilters);
  document.getElementById('search').addEventListener('input', applyFilters);
});
