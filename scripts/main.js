document.addEventListener('DOMContentLoaded', () => {
    console.log('Vaatia College Website Initialized');

    // Scroll Observer for Fade Up Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before element is in view
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Navbar scroll effect (throttled for performance)
    const navbar = document.querySelector('.navbar');
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // Dropdown Blur Effect
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', () => {
            document.body.classList.add('dropdown-active');
        });
        dropdown.addEventListener('mouseleave', () => {
            document.body.classList.remove('dropdown-active');
        });
    });

    // Stats Counter & Radial Fill Animation
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                const circle = entry.target.closest('.stat-circle')?.querySelector('.progress-ring__circle');
                let count = 0;
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps

                // Trigger radial fill (Performance loading: Precise percentage sync)
                if (circle) {
                    const circumference = 2 * Math.PI * 95;
                    circle.style.strokeDasharray = `${circumference} ${circumference}`;
                    circle.style.strokeDashoffset = circumference;

                    // Force reflow
                    circle.getBoundingClientRect();

                    // Calculate fill based on % suffix or cap at 100
                    const isPercentage = entry.target.parentElement.querySelector('.stat-suffix')?.innerText === '%';
                    const fillPercentage = isPercentage ? Math.min(target, 100) : 100;
                    const offset = circumference - (fillPercentage / 100) * circumference;

                    // Set smooth transition synced with counter duration
                    circle.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                    circle.style.strokeDashoffset = offset;
                }

                // Cubic-Bezier Easing for Numeric Sync
                let startTimestamp = null;
                const updateCount = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                    // Cubic Bezier (0.4, 0, 0.2, 1) approximation
                    const ease = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Simple ease-in-out for sync

                    const currentCount = Math.floor(ease * target);
                    entry.target.innerText = currentCount;

                    if (progress < 1) {
                        requestAnimationFrame(updateCount);
                    } else {
                        entry.target.innerText = target;
                    }
                };
                requestAnimationFrame(updateCount);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    stats.forEach(stat => statsObserver.observe(stat));

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('mobile-menu-active');
        });

        // Mobile Menu Dropdown Toggle
        const mobileDropdownToggles = mobileMenu.querySelectorAll('.mobile-dropdown-toggle');
        mobileDropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default if it were a link
                e.stopPropagation(); // Prevent bubbling causing issues
                const dropdownMenu = toggle.nextElementSibling;
                toggle.classList.toggle('active');
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('active');
                }
            });
        });

        // Close menu when a link is clicked
        const menuLinks = mobileMenu.querySelectorAll('a:not(.mobile-dropdown-toggle)');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-active');
            });
        });
    }

    // Generic Carousel Initialization
    function initCarousels() {
        // Find all carousel containers
        const carousels = document.querySelectorAll('.slideshow-hero, .house-gallery');

        carousels.forEach(carousel => {
            const viewport = carousel.querySelector('.carousel-viewport');
            const indicatorsContainer = carousel.querySelector('.carousel-indicators');
            let currentSlide = 0;
            const interval = parseInt(carousel.dataset.interval) || 6000;

            // Bulk Load and Shuffle for House Gallery
            if (carousel.classList.contains('house-gallery')) {
                const folder = 'Media Content/HOUSE WEAR/HOUSE WEAR/';
                const allImages = ["EYZ09312.jpg", "EYZ09331.jpg", "EYZ09359.jpg", "EYZ09378.jpg", "EYZ09391.jpg", "EYZ09414.jpg", "EYZ09434.jpg", "EYZ09450.jpg", "EYZ09493.jpg"];

                // Shuffle all images
                for (let i = allImages.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allImages[i], allImages[j]] = [allImages[j], allImages[i]];
                }

                // Create slides and indicators
                if (viewport) viewport.innerHTML = '';
                if (indicatorsContainer) indicatorsContainer.innerHTML = '';

                allImages.forEach((imgName, i) => {
                    const slide = document.createElement('div');
                    slide.className = 'slide' + (i === 0 ? ' active' : '');
                    slide.innerHTML = `<img src="${folder}${imgName}" alt="House Wear ${i + 1}">`;
                    if (viewport) viewport.appendChild(slide);

                    if (indicatorsContainer) {
                        const dot = document.createElement('div');
                        dot.className = 'indicator' + (i === 0 ? ' active' : '');
                        dot.addEventListener('click', () => updateCarousel(i));
                        indicatorsContainer.appendChild(dot);
                    }
                });
            }

            const slides = carousel.querySelectorAll('.slide');
            const indicators = carousel.querySelectorAll('.indicator');

            function updateCarousel(index) {
                slides.forEach((slide, i) => {
                    slide.classList.toggle('active', i === index);

                    // Handle 3D Stacked Classes (prev/next) for Cinematic Sliders
                    if (carousel.classList.contains('slideshow-hero')) {
                        const n = slides.length;
                        slide.classList.toggle('prev', i === (index - 1 + n) % n);
                        slide.classList.toggle('next', i === (index + 1) % n);
                    }
                });
                indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));

                if (carousel.classList.contains('house-gallery')) {
                    const activeSlide = slides[index];
                    const activeImg = activeSlide.querySelector('img');
                    if (activeImg) {
                        const adjustHeight = () => {
                            const containerWidth = carousel.clientWidth;
                            const targetHeight = (activeImg.naturalHeight / activeImg.naturalWidth) * containerWidth;
                            const finalHeight = Math.min(Math.max(targetHeight, 300), 800);
                            carousel.style.height = `${finalHeight}px`;
                        };
                        activeImg.complete ? adjustHeight() : activeImg.addEventListener('load', adjustHeight, { once: true });
                    }
                }
                currentSlide = index;
            }

            function nextSlide() {
                let next = (currentSlide + 1) % slides.length;
                updateCarousel(next);
            }

            indicators.forEach((ind, index) => {
                ind.addEventListener('click', () => {
                    updateCarousel(index);
                });
            });

            // Touch Gestures for Mobile
            let touchStartX = 0;
            let touchEndX = 0;

            if (viewport) {
                viewport.addEventListener('touchstart', e => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });

                viewport.addEventListener('touchend', e => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleGesture();
                }, { passive: true });

                function handleGesture() {
                    const threshold = 50; // pixels
                    if (touchEndX < touchStartX - threshold) {
                        nextSlide(); // Swipe Left -> Next
                    }
                    if (touchEndX > touchStartX + threshold) {
                        let prev = (currentSlide - 1 + slides.length) % slides.length;
                        updateCarousel(prev); // Swipe Right -> Prev
                    }
                }
            }

            updateCarousel(0);
            setInterval(nextSlide, interval);
        });
    }

    initCarousels();

    // Liquid Prospectus Download Logic
    const prospectusBtn = document.getElementById('prospectus-btn');
    const downloadModal = document.getElementById('download-modal');
    const downloadConfirm = document.getElementById('download-confirm');
    const downloadCancel = document.getElementById('download-cancel');

    if (prospectusBtn && downloadModal) {
        prospectusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeModal = () => {
            downloadModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        downloadCancel.addEventListener('click', closeModal);
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) closeModal();
        });

        downloadConfirm.addEventListener('click', () => {
            const pdfUrl = 'Media Content/PROSPECTUS_VAATIACOLLEGEMAKURDI-compressed.pdf';
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = 'Vaatia_College_Prospectus.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Portal Redirect Logic
    const portalBtns = document.querySelectorAll('.portal-redir');
    const portalModal = document.getElementById('portal-modal');
    const portalConfirm = document.getElementById('portal-confirm');
    const portalCancel = document.getElementById('portal-cancel');
    const portalTitle = document.getElementById('portal-modal-title');
    const portalDesc = document.getElementById('portal-modal-description');
    let pendingRedirectUrl = "";

    if (portalBtns.length > 0 && portalModal) {
        portalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                pendingRedirectUrl = btn.href;

                // Set dynamic modal text if available
                const portalName = btn.getAttribute('data-portal-redir') || "Portal";
                if (portalTitle) portalTitle.textContent = `Navigating to ${portalName}`;
                if (portalDesc) portalDesc.textContent = `You are about to be redirected to the secure Vaatia College ${portalName}. Would you like to continue?`;

                portalModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        const closePortalModal = () => {
            portalModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        portalCancel.addEventListener('click', closePortalModal);
        portalModal.addEventListener('click', (e) => {
            if (e.target === portalModal) closePortalModal();
        });

        portalConfirm.addEventListener('click', () => {
            if (pendingRedirectUrl) {
                window.open(pendingRedirectUrl, '_blank');
                closePortalModal();
            }
        });
    }

    // Bento Dynamic All-Image Slideshows
    const bentoData = {
        'academics': {
            folder: 'Media Content/ACADEMICS/ACADEMIC PHOTOS/',
            images: ["EYZ09098.jpg", "EYZ09145.jpg", "EYZ09208.jpg", "EYZ09260.jpg"]
        },
        'skills': {
            folder: 'Media Content/SKILLS ACQUISITION/SKILLS ACQUISITION/',
            images: ["EYZ01402.jpg", "EYZ01423.jpg", "EYZ09679.jpg", "EYZ09724.jpg", "EYZ09817.jpg"]
        },
        'sports': {
            folder: 'Media Content/SPORTS/SPORTS WEAR/',
            images: ["DJI_0293.jpg", "DSC00072.jpg", "DSC00085.jpg", "DSC00100.jpg", "DSC00115.jpg", "DSC00130.jpg", "DSC00147.jpg", "DSC00160.jpg", "EYZ00001.jpg", "EYZ00010.jpg", "EYZ00027.jpg", "EYZ00044.jpg", "EYZ00060.jpg", "EYZ00081.jpg", "EYZ00105.jpg", "EYZ00124.jpg", "EYZ00145.jpg", "EYZ00167.jpg"]
        },
        'boarding': {
            folder: 'Media Content/BOARDING/',
            images: ["817A1681.jpg", "817A1682.jpg", "817A1685.jpg", "817A1686.jpg", "817A1688.jpg", "817A1690.jpg", "817A1693.jpg", "817A1697.jpg", "817A1720.jpg", "817A1727.jpg", "IMG_0948.JPG", "IMG_0952.JPG", "IMG_0954.JPG", "IMG_0966.JPG", "IMG_0985.JPG"]
        }
    };

    const bentoSlideshows = document.querySelectorAll('.bento-slideshow');
    bentoSlideshows.forEach(slideshow => {
        const type = slideshow.dataset.type;
        if (!bentoData[type]) return;

        const data = bentoData[type];
        const inner = slideshow.querySelector('.slideshow-inner');
        const interval = parseInt(slideshow.dataset.interval) || 4000;
        let currentIdx = 0;

        function createImg(idx) {
            const img = document.createElement('img');
            img.src = data.folder + data.images[idx];
            if (idx === 0) img.classList.add('active');
            inner.appendChild(img);
            return img;
        }

        let currentImg = createImg(0);
        let nextImg = createImg(1);

        setInterval(() => {
            currentIdx = (currentIdx + 1) % data.images.length;
            const nextIdx = (currentIdx + 1) % data.images.length;

            currentImg.classList.remove('active');
            nextImg.classList.add('active');

            setTimeout(() => {
                const oldImg = currentImg;
                currentImg = nextImg;
                if (inner.contains(oldImg)) inner.removeChild(oldImg);
                nextImg = createImg(nextIdx);
            }, 1500);
        }, interval);
    });

    // Cinematic Stacked Marquee Logic
    const marqueeItems = document.querySelectorAll('.marquee-item');
    if (marqueeItems.length > 0) {
        let marqueeIdx = 0;

        function updateMarquee() {
            marqueeItems.forEach((item, i) => {
                item.classList.remove('active', 'prev', 'next', 'prev-2', 'next-2');

                const n = marqueeItems.length;
                if (i === marqueeIdx) item.classList.add('active');
                else if (i === (marqueeIdx - 1 + n) % n) item.classList.add('prev');
                else if (i === (marqueeIdx + 1) % n) item.classList.add('next');
                else if (i === (marqueeIdx - 2 + n) % n) item.classList.add('prev-2');
                else if (i === (marqueeIdx + 2) % n) item.classList.add('next-2');
            });

            marqueeIdx = (marqueeIdx + 1) % marqueeItems.length;
        }

        updateMarquee();
        setInterval(updateMarquee, 4000);
    }
});
// Link Section Scroll to Indicators (Philosophy & Highlights)
function setupSectionDots(containerSelector, indicatorsSelector) {
    const grid = document.querySelector(containerSelector);
    const indicators = document.querySelectorAll(indicatorsSelector);
    if (!grid || !indicators.length) return;
    const cards = Array.from(grid.children);

    // Handle Scroll Sync
    grid.addEventListener('scroll', () => {
        const scrollWidth = grid.scrollWidth - grid.clientWidth;
        if (scrollWidth <= 0) return;

        const scrollLeft = grid.scrollLeft;

        // Check if we are close to the end (allow 5px buffer)
        if (Math.abs(scrollWidth - scrollLeft) < 5) {
            indicators.forEach(dot => dot.classList.remove('active'));
            indicators[indicators.length - 1].classList.add('active');
            return;
        }

        const index = Math.min(Math.round((scrollLeft / grid.scrollWidth) * indicators.length), indicators.length - 1);
        indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }, { passive: true });

    // Handle Dot Click Scroll
    indicators.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const card = cards[index];
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    });
}

function initPhilosophyIndicators() {
    setupSectionDots('#about .cards-grid', '.philosophy-indicators .indicator');
}

function initHighlightsIndicators() {
    setupSectionDots('.stats-section .stats-grid', '.highlights-indicators .indicator');
}

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    initPhilosophyIndicators();
    initHighlightsIndicators();
});
