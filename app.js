/* ==========================================================================
   EEG NEUROREHABILITATION GLOVE - PREMIUM INTERACTIVE APPLICATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Initialization & Setup ---
  const canvas = document.getElementById('device-canvas');
  const context = canvas.getContext('2d');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  
  // Elements to fade/show/hide
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scroll-progress');
  const hudStatus = document.getElementById('hud-status');
  const hudFrame = document.getElementById('hud-frame');
  const hudContainer = document.getElementById('canvas-hud');
  
  // Phase Overlays
  const phases = {
    hero: document.getElementById('phase-hero'),
    engineering: document.getElementById('phase-engineering'),
    bci: document.getElementById('phase-bci'),
    rehab: document.getElementById('phase-rehab'),
    cta: document.getElementById('phase-cta'),
  };

  // Configuration
  const frameCount = 240;
  const images = [];
  const deviceState = {
    currentFrame: 0,
    targetFrame: 0,
    scrolledPercent: 0,
    loadedCount: 0,
    isLoaded: false
  };

  // Helper to format frame numbers (e.g., 1 -> "001")
  const formatFrameNum = (num) => String(num).padStart(3, '0');

  // Preload all frames
  const preloadImages = () => {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-overlay';
    loadingScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #050505;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1);
    `;
    loadingScreen.innerHTML = `
      <div style="font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.02em;">
        <span style="color: #00D6FF;">⬡</span> NeuroGlove BCI System
      </div>
      <div style="width: 200px; height: 2px; background: rgba(255,255,255,0.05); border-radius: 99px; overflow: hidden; position: relative;">
        <div id="loading-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0050FF, #00D6FF); transition: width 0.1s linear;"></div>
      </div>
      <div id="loading-text" style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.4);">
        Calibrating Neural Sensors... 0%
      </div>
    `;
    document.body.appendChild(loadingScreen);

    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    const updateProgress = () => {
      deviceState.loadedCount++;
      const percent = Math.round((deviceState.loadedCount / frameCount) * 100);
      loadingBar.style.width = `${percent}%`;
      loadingText.textContent = `Calibrating Neural Sensors... ${percent}%`;

      if (deviceState.loadedCount === frameCount) {
        deviceState.isLoaded = true;
        // Fade out preloader
        setTimeout(() => {
          loadingScreen.style.opacity = 0;
          hudContainer.style.opacity = 1;
          setTimeout(() => {
            loadingScreen.remove();
          }, 1000);
        }, 500);
        
        // Initial render
        renderFrame(0);
      }
    };

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `ezgif-frame-${formatFrameNum(i)}.jpg`;
      img.onload = updateProgress;
      img.onerror = () => {
        console.error(`Failed to load frame ${i}`);
        updateProgress(); // Continue anyway
      };
      images.push(img);
    }
  };

  // Render a specific frame onto the canvas
  const renderFrame = (index) => {
    if (images[index] && images[index].complete) {
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const img = images[index];
      
      // Calculate responsive object-fit cover style manually
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      
      let renderWidth, renderHeight, x, y;
      
      // Calculate base 'contain' dimensions
      if (imgRatio > canvasRatio) {
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / imgRatio;
      } else {
        renderHeight = canvasHeight;
        renderWidth = canvasHeight * imgRatio;
      }
      
      // Apply custom mobile scaling to zoom in and make the glove larger
      let scaleFactor = 1;
      if (window.innerWidth <= 768) {
        scaleFactor = 1.6; // Scale up by 60% on mobile screens to fill more space
      }
      
      renderWidth *= scaleFactor;
      renderHeight *= scaleFactor;
      
      // Center the scaled image
      x = (canvasWidth - renderWidth) / 2;
      y = (canvasHeight - renderHeight) / 2;
      
      context.drawImage(img, x, y, renderWidth, renderHeight);
      
      // Update HUD frame count
      hudFrame.textContent = `${formatFrameNum(index + 1)} / ${formatFrameNum(frameCount)}`;
    }
  };

  let lastWidth = window.innerWidth;

  // Resize canvas to match screen resolution and device pixel ratio (for retina clarity)
  const resizeCanvas = () => {
    // Prevent mobile layout jumping: ignore height-only resizes (URL bar hide/show)
    const isMobile = window.innerWidth <= 768;
    if (isMobile && window.innerWidth === lastWidth && canvas.width > 0) {
      return;
    }
    lastWidth = window.innerWidth;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    // Removed context.scale(dpr, dpr) to prevent double-scaling bug
    
    // Set display style width/height
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    if (deviceState.isLoaded) {
      renderFrame(Math.round(deviceState.currentFrame));
    }
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // Run once

  // Start preloading
  preloadImages();

  // --- Scrollytelling Scroll Handling ---
  window.addEventListener('scroll', () => {
    if (!deviceState.isLoaded) return;

    const scrollTop = window.scrollY;
    const maxScroll = canvasWrapper.offsetHeight - window.innerHeight;
    let scrollPercent = scrollTop / maxScroll;
    
    // Clamp between 0 and 1
    scrollPercent = Math.max(0, Math.min(1, scrollPercent));
    deviceState.scrolledPercent = scrollPercent;

    // Update scroll progress bar
    scrollProgress.style.width = `${scrollPercent * 100}%`;

    // Map scroll percentage to image frame (0 to frameCount - 1)
    deviceState.targetFrame = Math.floor(scrollPercent * (frameCount - 1));

    // Handle Navbar fade-in (invisible at top, fully visible after 5% scroll)
    if (scrollTop > window.innerHeight * 0.05) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Determine HUD Status text & update active phases
    updatePhasesAndHUD(scrollPercent);
  });

  // Smooth frame interpolation (reduces scroll stuttering)
  const animateCanvas = () => {
    if (deviceState.isLoaded) {
      // Lerp frame rendering for extreme fluidity
      const ease = 0.15;
      const diff = deviceState.targetFrame - deviceState.currentFrame;
      
      if (Math.abs(diff) > 0.01) {
        deviceState.currentFrame += diff * ease;
        renderFrame(Math.round(deviceState.currentFrame));
      }
    }
    requestAnimationFrame(animateCanvas);
  };
  requestAnimationFrame(animateCanvas);

  // Update phases and HUD text based on the scroll intervals
  const updatePhasesAndHUD = (percent) => {
    // Reset all phases
    Object.values(phases).forEach(p => p.classList.remove('active'));

    // Hero Section (0–15% Scroll)
    if (percent >= 0 && percent < 0.15) {
      phases.hero.classList.add('active');
      hudStatus.textContent = "System Assembled";
      hudStatus.className = "hud-value";
    }
    // Engineering Reveal (15–40% Scroll)
    else if (percent >= 0.15 && percent < 0.40) {
      phases.engineering.classList.add('active');
      hudStatus.textContent = "Exploded View - Actuators";
      hudStatus.className = "hud-value hud-cyan";
    }
    // BCI System & Neural Control (40–65% Scroll)
    else if (percent >= 0.40 && percent < 0.65) {
      phases.bci.classList.add('active');
      hudStatus.textContent = "EEG Neural Decoders Active";
      hudStatus.className = "hud-value hud-cyan";
    }
    // Rehabilitation Performance (65–85% Scroll)
    else if (percent >= 0.65 && percent < 0.85) {
      phases.rehab.classList.add('active');
      hudStatus.textContent = "Robotic Exoskeleton Active";
      hudStatus.className = "hud-value";
    }
    // Reassembly & CTA (85–100% Scroll)
    else {
      phases.cta.classList.add('active');
      hudStatus.textContent = "Fully Calibrated";
      hudStatus.className = "hud-value hud-cyan";
    }
  };

  // --- Real-Time EEG Waveform Simulator on BCI Section ---
  const signalCanvas = document.getElementById('signal-canvas');
  if (signalCanvas) {
    const sCtx = signalCanvas.getContext('2d');
    let waveTime = 0;

    const renderEEGSignal = () => {
      sCtx.clearRect(0, 0, signalCanvas.width, signalCanvas.height);
      sCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      sCtx.lineWidth = 1;

      // Draw grid lines
      const gridRows = 6;
      for (let i = 1; i < gridRows; i++) {
        const y = (signalCanvas.height / gridRows) * i;
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(signalCanvas.width, y);
        sCtx.stroke();
      }

      const drawWave = (color, offset, speed, amp, freq, noiseLevel) => {
        sCtx.beginPath();
        sCtx.strokeStyle = color;
        sCtx.lineWidth = color.includes('0.2') ? 1 : 1.5;
        
        for (let x = 0; x < signalCanvas.width; x++) {
          const t = waveTime * speed + x * freq + offset;
          // Primary wave component (sine) + subharmonic + high-frequency noise
          const ySine = Math.sin(t) * amp;
          const ySub = Math.sin(t * 0.4) * (amp * 0.3);
          const yNoise = (Math.random() - 0.5) * noiseLevel;
          
          const y = (signalCanvas.height / 2) + ySine + ySub + yNoise;
          
          if (x === 0) {
            sCtx.moveTo(x, y);
          } else {
            sCtx.lineTo(x, y);
          }
        }
        sCtx.stroke();
      };

      // Draw 3 layers of neural signals
      // 1. Motor Cortex C3 (Cyan - high frequency active when imagined movement occurs)
      drawWave('#00D6FF', 0, 0.15, 20, 0.04, 3);
      
      // 2. Supplementary Motor Cz (Blue - smoother, preparation wave)
      drawWave('#0050FF', Math.PI/2, 0.08, 25, 0.025, 1);
      
      // 3. Reference/Noise Fp1 (Dim white/gray - random forehead sensor muscle artifact noise)
      drawWave('rgba(255,255,255,0.15)', Math.PI, 0.25, 6, 0.08, 4);

      waveTime += 1;
      requestAnimationFrame(renderEEGSignal);
    };

    renderEEGSignal();
  }

  // --- Mobile Hamburger Menu toggle ---
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenu = document.getElementById('mobile-menu-close');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

  const openMobileMenu = () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (hamburger) hamburger.addEventListener('click', openMobileMenu);
  if (closeMenu) closeMenu.addEventListener('click', closeMobileMenu);
  
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // --- Form Validation & Submission Handling ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simple custom design validation
      let isValid = true;
      const inputs = contactForm.querySelectorAll('input[required], select[required]');
      
      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = 'rgba(255, 0, 0, 0.5)';
        } else {
          input.style.borderColor = 'var(--border-color)';
        }
      });
      
      if (isValid) {
        const submitBtn = document.getElementById('contact-submit');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span>Acquiring Signals...</span>
          <div class="loader-spinner" style="width: 12px; height: 12px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin-loader 0.8s linear infinite;"></div>
        `;
        
        // Add spinner rotation animation dynamically if not present
        if (!document.getElementById('spin-loader-style')) {
          const style = document.createElement('style');
          style.id = 'spin-loader-style';
          style.innerHTML = `@keyframes spin-loader { to { transform: rotate(360deg); } }`;
          document.head.appendChild(style);
        }

        // Simulate secure submission
        setTimeout(() => {
          submitBtn.innerHTML = `<span>Inquiry Dispatched Successfully ✓</span>`;
          submitBtn.style.background = 'linear-gradient(135deg, #00FF87, #00D6FF)';
          contactForm.reset();
          
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
          }, 4000);
        }, 1500);
      }
    });
  }
});
