export const HUDSystem = {
  // Can be expanded as needed for more complex UI logic
  showControllerIcon(active) {
    const hud = document.getElementById('hud');
    if (active) {
      hud.innerHTML = '<div class="controller-icon">🎮</div>';
    } else {
      hud.innerHTML = '';
    }
  }
};
