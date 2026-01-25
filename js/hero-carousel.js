// Hero Carousel Animation
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;

    if (slides.length === 0) return;

    function nextSlide() {
        // Remove active class from current slide
        slides[currentSlide].classList.remove('active');
        
        // Move to next slide
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Add active class to new slide
        slides[currentSlide].classList.add('active');
    }

    // Change slide every 5 seconds
    setInterval(nextSlide, 5000);

    // Preload images for smooth transitions
    slides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img && img.src) {
            const preloadImg = new Image();
            preloadImg.src = img.src;
        }
    });
});
