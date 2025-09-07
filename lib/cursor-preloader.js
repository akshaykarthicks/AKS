// Preloader functionality

document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');
    
    if (!preloader) {
        // If no preloader, dispatch event immediately
        document.dispatchEvent(new CustomEvent('preloaderHidden'));
        return;
    }
    
    // Function to hide preloader
    const hidePreloader = () => {
        // Only hide if not already hidden
        if (!preloader.classList.contains('fade-out')) {
            preloader.classList.add('fade-out');
            
            setTimeout(() => {
                if (preloader && preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
                
                // Dispatch custom event to initialize cursor
                document.dispatchEvent(new CustomEvent('preloaderHidden'));
            }, 500);
        }
    };
    
    // Hide preloader when page is fully loaded
    window.addEventListener('load', hidePreloader);
    
    // Fallback: Hide preloader after 3 seconds in case of slow network
    setTimeout(hidePreloader, 3000);
});

// Listen for preloader hidden event to initialize cursor
document.addEventListener('preloaderHidden', function() {
    // Check if we're on a touch device
    const isLikelyTouchOnly = (() => {
        const hasTouchEvent = 'ontouchstart' in window;
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const lacksHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
        const maxTouch = ('maxTouchPoints' in navigator ? navigator.maxTouchPoints : 0) || ('msMaxTouchPoints' in navigator ? navigator.msMaxTouchPoints : 0);
        return (hasTouchEvent || maxTouch > 0) && hasCoarsePointer && lacksHover;
    })();
    
    // If it's a true touch-only device, don't initialize the custom cursor
    if (isLikelyTouchOnly) {
        document.body.style.cursor = 'auto';
        return;
    }
    
    // Show cursor elements
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    if (cursorDot) {
        cursorDot.style.display = 'block';
        cursorDot.style.opacity = '1';
    }
    
    if (cursorOutline) {
        cursorOutline.style.display = 'block';
        cursorOutline.style.opacity = '1';
    }
    
    // Add class to enable CSS that hides native cursor only when ready
    document.body.classList.add('has-custom-cursor');
    
    // Hide default cursor
    document.body.style.cursor = 'none';
});