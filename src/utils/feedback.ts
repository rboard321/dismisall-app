// Haptic feedback utility for mobile devices
export class HapticFeedback {
  private static isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  public static light(): void {
    if (this.isSupported()) {
      navigator.vibrate(10); // Short, light vibration
    }
  }

  public static medium(): void {
    if (this.isSupported()) {
      navigator.vibrate(20); // Medium vibration
    }
  }

  public static heavy(): void {
    if (this.isSupported()) {
      navigator.vibrate(50); // Strong vibration
    }
  }

  public static success(): void {
    if (this.isSupported()) {
      navigator.vibrate([10, 50, 20]); // Success pattern: short-pause-medium
    }
  }

  public static error(): void {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100]); // Error pattern: long-pause-long
    }
  }

  public static notification(): void {
    if (this.isSupported()) {
      navigator.vibrate([20, 30, 20, 30, 40]); // Notification pattern
    }
  }
}

// Animation utilities
export class AnimationUtils {
  // Create a spring animation effect
  public static spring(element: HTMLElement, fromScale: number = 0.8, toScale: number = 1): void {
    element.style.transform = `scale(${fromScale})`;
    element.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    // Trigger reflow
    void element.offsetHeight;

    element.style.transform = `scale(${toScale})`;

    // Clean up after animation
    setTimeout(() => {
      element.style.transition = '';
      element.style.transform = '';
    }, 300);
  }

  // Slide in from direction
  public static slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up'): void {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };

    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    element.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease';

    // Trigger reflow
    void element.offsetHeight;

    element.style.transform = 'translate(0, 0)';
    element.style.opacity = '1';

    // Clean up after animation
    setTimeout(() => {
      element.style.transition = '';
      element.style.transform = '';
      element.style.opacity = '';
    }, 400);
  }

  // Slide out to direction
  public static slideOut(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up'): Promise<void> {
    return new Promise((resolve) => {
      const transforms = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      };

      element.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease';
      element.style.transform = transforms[direction];
      element.style.opacity = '0';

      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  // Pulse animation
  public static pulse(element: HTMLElement, intensity: number = 1.1): void {
    element.style.transition = 'transform 0.15s ease';
    element.style.transform = `scale(${intensity})`;

    setTimeout(() => {
      element.style.transform = 'scale(1)';
      setTimeout(() => {
        element.style.transition = '';
        element.style.transform = '';
      }, 150);
    }, 150);
  }

  // Shake animation for errors
  public static shake(element: HTMLElement): void {
    element.style.animation = 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)';

    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  }

  // Fade in animation
  public static fadeIn(element: HTMLElement, duration: number = 300): void {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;

    // Trigger reflow
    void element.offsetHeight;

    element.style.opacity = '1';

    setTimeout(() => {
      element.style.transition = '';
    }, duration);
  }

  // Fade out animation
  public static fadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';

      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  // Morph between states
  public static morph(element: HTMLElement, fromStyles: Partial<CSSStyleDeclaration>, toStyles: Partial<CSSStyleDeclaration>, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      // Apply from styles instantly
      Object.assign(element.style, fromStyles);

      // Set up transition
      element.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.8, 0.25, 1)`;

      // Trigger reflow
      void element.offsetHeight;

      // Apply to styles
      Object.assign(element.style, toStyles);

      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }
}

// Success celebration animations
export class CelebrationAnimations {
  // Confetti-like success animation
  public static confetti(container: HTMLElement): void {
    const colors = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'];
    const particles = 15;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';

      const rect = container.getBoundingClientRect();
      particle.style.left = rect.left + rect.width / 2 + 'px';
      particle.style.top = rect.top + rect.height / 2 + 'px';

      document.body.appendChild(particle);

      // Animate particle
      const angle = (Math.PI * 2 * i) / particles;
      const velocity = 50 + Math.random() * 100;
      const gravity = 200;
      const lifetime = 1000 + Math.random() * 500;

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / lifetime;

        if (progress >= 1) {
          particle.remove();
          return;
        }

        const x = rect.left + rect.width / 2 + Math.cos(angle) * velocity * (elapsed / 1000);
        const y = rect.top + rect.height / 2 + Math.sin(angle) * velocity * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = (1 - progress).toString();

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  }

  // Checkmark animation
  public static checkmark(container: HTMLElement): void {
    const checkmark = document.createElement('div');
    checkmark.innerHTML = '✓';
    checkmark.style.position = 'absolute';
    checkmark.style.fontSize = '2rem';
    checkmark.style.color = '#2ecc71';
    checkmark.style.fontWeight = 'bold';
    checkmark.style.pointerEvents = 'none';
    checkmark.style.zIndex = '9999';
    checkmark.style.transform = 'scale(0)';
    checkmark.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    const rect = container.getBoundingClientRect();
    checkmark.style.left = rect.left + rect.width / 2 - 16 + 'px';
    checkmark.style.top = rect.top + rect.height / 2 - 16 + 'px';

    document.body.appendChild(checkmark);

    // Trigger animation
    setTimeout(() => {
      checkmark.style.transform = 'scale(1)';
    }, 10);

    // Remove after animation
    setTimeout(() => {
      checkmark.style.transform = 'scale(0)';
      setTimeout(() => {
        checkmark.remove();
      }, 300);
    }, 800);
  }

  // Ripple effect
  public static ripple(element: HTMLElement, event: MouseEvent | TouchEvent): void {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();

    let x, y;
    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    }

    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

// Loading animation states
export class LoadingAnimations {
  // Spinner with custom text
  public static spinner(text: string = 'Loading...'): string {
    return `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span>${text}</span>
      </div>
    `;
  }

  // Progress bar
  public static progressBar(progress: number, text: string = ''): string {
    return `
      <div style="width: 100%;">
        <div style="
          width: 100%;
          height: 4px;
          background-color: #f0f0f0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        ">
          <div style="
            width: ${progress}%;
            height: 100%;
            background: linear-gradient(90deg, #007bff, #28a745);
            transition: width 0.3s ease;
            animation: shimmer 2s infinite;
          "></div>
        </div>
        ${text ? `<div style="font-size: 0.875rem; color: #666;">${text}</div>` : ''}
      </div>
    `;
  }

  // Dots animation
  public static dots(text: string = 'Loading'): string {
    return `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>${text}</span>
        <div style="display: flex; gap: 2px;">
          <div style="
            width: 4px;
            height: 4px;
            background-color: #007bff;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          "></div>
          <div style="
            width: 4px;
            height: 4px;
            background-color: #007bff;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
            animation-delay: 0.16s;
          "></div>
          <div style="
            width: 4px;
            height: 4px;
            background-color: #007bff;
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
            animation-delay: 0.32s;
          "></div>
        </div>
      </div>
    `;
  }
}

// Add global CSS animations
export const GlobalAnimations = `
  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }

  @keyframes ripple {
    to {
      width: 200px;
      height: 200px;
      opacity: 0;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1.0);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes slideInUp {
    from {
      transform: translate3d(0, 100%, 0);
      opacity: 0;
    }
    to {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }

  @keyframes slideOutDown {
    from {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    to {
      transform: translate3d(0, 100%, 0);
      opacity: 0;
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeOutScale {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  /* Smooth transitions for all interactive elements */
  .smooth-transition {
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .smooth-transition:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .smooth-transition:active {
    transform: translateY(0);
    transition-duration: 0.1s;
  }

  /* Card animations */
  .card-enter {
    animation: slideInUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .card-exit {
    animation: slideOutDown 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .card-fade-in {
    animation: fadeInScale 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .card-fade-out {
    animation: fadeOutScale 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  /* Status transitions */
  .status-waiting {
    background: linear-gradient(135deg, #e7f3ff, #cce7ff);
    border-left: 4px solid #007bff;
  }

  .status-sent {
    background: linear-gradient(135deg, #fff3cd, #ffe8a1);
    border-left: 4px solid #ffc107;
  }

  .status-completed {
    background: linear-gradient(135deg, #d4edda, #c3e6cb);
    border-left: 4px solid #28a745;
  }

  /* Mobile touch feedback */
  @media (hover: none) and (pointer: coarse) {
    .smooth-transition:active {
      background-color: rgba(0, 0, 0, 0.1);
      transform: scale(0.98);
    }
  }
`;

// React hook for animations
export const useAnimations = () => {
  return {
    haptic: HapticFeedback,
    animate: AnimationUtils,
    celebrate: CelebrationAnimations,
    loading: LoadingAnimations
  };
};