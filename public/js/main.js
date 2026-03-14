// Auto-dismiss flash messages
setTimeout(() => {
  document.querySelectorAll('.flash').forEach(el => {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  });
}, 3500);

// View toggle (grid/list)
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (btn.dataset.view === 'list') {
      grid.style.gridTemplateColumns = '1fr';
    } else {
      grid.style.gridTemplateColumns = '';
    }
  });
});

// Mobile filter toggle
function toggleFilter() {
  const sidebar = document.querySelector('.filter-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Image error fallback
document.querySelectorAll('img[onerror]').forEach(img => {
  img.addEventListener('error', function() {
    this.src = '/images/placeholder.svg';
  });
});

// Auto-submit filter form on change (for selects)
const autoSubmitSelects = document.querySelectorAll('#filterForm select');
autoSubmitSelects.forEach(sel => {
  sel.addEventListener('change', () => {
    document.getElementById('filterForm')?.submit();
  });
});
