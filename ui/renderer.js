export const Renderer = {
  setBackground(bgDef) {
    const bgContainer = document.getElementById('scene-bg');
    if (!bgContainer) return;

    // Reset classes
    bgContainer.className = '';
    
    if (bgDef && bgDef.type === 'css' && bgDef.preset) {
      bgContainer.classList.add(`bg-${bgDef.preset}`);
    } else {
      // Fallback
      bgContainer.style.background = 'var(--bg)';
    }
  }
};
