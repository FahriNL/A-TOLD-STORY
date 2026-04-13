export const TransitionSystem = {
  getCover() {
    return document.getElementById('transition-cover');
  },

  async out(type = 'fade') {
    const cover = this.getCover();
    cover.style.transition = '';
    
    return new Promise(resolve => {
      if (type === 'cut') {
        cover.style.opacity = '1';
        cover.style.transform = 'none';
        resolve();
      } else if (type === 'slide') {
        cover.style.transform = 'translateX(100%)';
        cover.style.opacity = '1';
        requestAnimationFrame(() => {
          cover.style.transition = 'transform 0.3s ease-in-out';
          cover.style.transform = 'translateX(0)';
          setTimeout(resolve, 300);
        });
      } else {
        // fade
        cover.style.transform = 'none';
        cover.style.opacity = '0';
        requestAnimationFrame(() => {
          cover.style.transition = 'opacity 0.4s ease-in-out';
          cover.style.opacity = '1';
          setTimeout(resolve, 400);
        });
      }
    });
  },

  async in(type = 'fade') {
    const cover = this.getCover();
    
    return new Promise(resolve => {
      if (type === 'cut') {
        cover.style.opacity = '0';
        cover.style.transform = 'none';
        resolve();
      } else if (type === 'slide') {
        cover.style.transition = 'transform 0.3s ease-in-out';
        cover.style.transform = 'translateX(-100%)';
        setTimeout(() => {
          cover.style.opacity = '0';
          cover.style.transform = 'none';
          resolve();
        }, 300);
      } else {
        // fade
        cover.style.transition = 'opacity 0.4s ease-in-out';
        cover.style.opacity = '0';
        setTimeout(resolve, 400);
      }
    });
  }
};
