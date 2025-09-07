// Improved cursor implementation
function initializeCustomCursor() {
    if (window.__customCursor && window.__customCursor.initialized) {
        // Cleanup previous instance before re-initializing
        try {
            const prev = window.__customCursor;
            if (prev.rafId) cancelAnimationFrame(prev.rafId);
            if (prev.onPointerMove) document.removeEventListener('pointermove', prev.onPointerMove, { passive: true });
            if (prev.onMouseMove) document.removeEventListener('mousemove', prev.onMouseMove, { passive: true });
            if (prev.onMouseEnter) window.removeEventListener('mouseenter', prev.onMouseEnter, { passive: true });
            if (prev.onMouseDown) document.removeEventListener('mousedown', prev.onMouseDown);
            if (prev.onMouseUp) document.removeEventListener('mouseup', prev.onMouseUp);
            if (prev.hoverElements && prev.hoverHandlers) {
                prev.hoverElements.forEach((el) => {
                    const handlers = prev.hoverHandlers.get(el);
                    if (handlers) {
                        el.removeEventListener('mouseenter', handlers.enter);
                        el.removeEventListener('mouseleave', handlers.leave);
                    }
                });
            }
        } catch (e) {
            // noop
        }
    }
    // Ensure cursor elements exist and are appended to body for highest stacking context
    let cursorDot = document.querySelector('.cursor-dot');
    let cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot) {
        cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        document.body.appendChild(cursorDot);
    }
    if (!cursorOutline) {
        cursorOutline = document.createElement('div');
        cursorOutline.className = 'cursor-outline';
        document.body.appendChild(cursorOutline);
    }

    // If still missing, bail
    if (!cursorDot || !cursorOutline) return;

    // Relaxed touch detection: disable only on true touch-only environments
    const isLikelyTouchOnly = (() => {
        const hasTouchEvent = 'ontouchstart' in window;
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const lacksHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
        const maxTouch = ('maxTouchPoints' in navigator ? navigator.maxTouchPoints : 0) || ('msMaxTouchPoints' in navigator ? navigator.msMaxTouchPoints : 0);
        // Consider touch-only if coarse pointer, no hover, and touch capability present
        return (hasTouchEvent || maxTouch > 0) && hasCoarsePointer && lacksHover;
    })();

    if (isLikelyTouchOnly) {
        cursorDot.style.display = 'none';
        cursorOutline.style.display = 'none';
        document.body.style.cursor = 'auto';
        return;
    }

    // Show cursor elements
    cursorDot.style.display = 'block';
    cursorOutline.style.display = 'block';
    cursorDot.style.opacity = '1';
    cursorOutline.style.opacity = '1';

    // Set a visible starting position (center of viewport) before first pointer event
    const startX = Math.round(window.innerWidth / 2);
    const startY = Math.round(window.innerHeight / 2);
    cursorDot.style.left = startX + 'px';
    cursorDot.style.top = startY + 'px';
    cursorOutline.style.transform = `translate(${startX - 18}px, ${startY - 18}px)`;

    // Add class to enable CSS that hides native cursor only when ready
    document.body.classList.add('has-custom-cursor');

    // Position variables
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    function updatePosition(e) {
        if (!e) return;
        // Ensure we have valid coordinates
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
            mouseX = e.clientX;
            mouseY = e.clientY;
        } else if (e.touches && e.touches[0]) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
        
        // Immediate update for snappy dot
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    }

    function animate() {
        // Improved smoothing for outline with better performance
        const smoothing = 0.15;
        currentX += (mouseX - currentX) * smoothing;
        currentY += (mouseY - currentY) * smoothing;
        
        // Use transform for better performance
        cursorOutline.style.transform = `translate(${currentX - 18}px, ${currentY - 18}px)`;
        rafId = window.requestAnimationFrame(animate);
    }

    // Prefer pointer events, fall back to mousemove once
    const onPointerMove = (e) => updatePosition(e);
    const onMouseMove = (e) => updatePosition(e);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    const onMouseEnter = (e) => updatePosition(e);
    window.addEventListener('mouseenter', onMouseEnter, { passive: true });

    // Kick off animation loop
    animate();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .btn, .nav-link, [data-cursor-hover]');
    const hoverHandlers = new Map();
    hoverElements.forEach(function(element) {
        const enter = function() {
            cursorOutline.style.transform = `translate(${currentX - 18}px, ${currentY - 18}px) scale(1.5)`;
            cursorOutline.style.borderColor = '#ffffff';
            cursorOutline.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        };
        const leave = function() {
            cursorOutline.style.transform = `translate(${currentX - 18}px, ${currentY - 18}px) scale(1)`;
            cursorOutline.style.borderColor = '#FFD700';
            cursorOutline.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
        };
        hoverHandlers.set(element, { enter, leave });
        element.addEventListener('mouseenter', enter);
        element.addEventListener('mouseleave', leave);
    });

    // Click effects
    const onMouseDown = function() {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(0.8)';
        cursorOutline.style.transform = `translate(${currentX - 18}px, ${currentY - 18}px) scale(0.8)`;
    };
    const onMouseUp = function() {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.transform = `translate(${currentX - 18}px, ${currentY - 18}px) scale(1)`;
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // Hide default cursor (scoped by CSS class)
    document.body.style.cursor = 'none';

    // Store instance for guarding and cleanup
    window.__customCursor = {
        initialized: true,
        rafId,
        onPointerMove,
        onMouseMove,
        onMouseEnter,
        onMouseDown,
        onMouseUp,
        hoverElements,
        hoverHandlers
    };

    console.log('Custom cursor initialized');
}

// Initialize cursor after preloader is hidden
document.addEventListener('preloaderHidden', initializeCustomCursor);

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Only initialize if preloaderHidden event wasn't fired
        if (!document.querySelector('.cursor-dot') || !document.querySelector('.cursor-outline')) {
            initializeCustomCursor();
        }
    });
} else {
    // Only initialize if preloaderHidden event wasn't fired
    if (!document.querySelector('.cursor-dot') || !document.querySelector('.cursor-outline')) {
        initializeCustomCursor();
    }
}