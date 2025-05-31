// Funcții pentru meniul dropdown
document.addEventListener('DOMContentLoaded', function() {
    // Selecții pentru elementele principale
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav > ul');
    const menuItems = document.querySelectorAll('.main-nav > ul > li');
    
    // Funcție pentru activarea meniului pe mobile (doar pe ecran mic)
    if(menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Verificăm dacă suntem pe ecran mic
            if(window.innerWidth <= 576) {
                // Toggle pentru meniul principal
                mainNav.classList.toggle('show');
                
                // Schimbă iconul
                if(this.querySelector('i')) {
                    this.querySelector('i').classList.toggle('fa-bars');
                    this.querySelector('i').classList.toggle('fa-times');
                }
            }
        });
    }
    
    // Funcționalitate pentru submeniuri pe ECRANE MARI ȘI MEDII (click)
    menuItems.forEach(item => {
        // Verificăm dacă elementul are submeniu
        if(item.querySelector('ul')) {
            // Adăugăm event listener pentru click
            item.addEventListener('click', function(e) {
                // Verificăm dacă suntem pe ecran mare sau mediu
                if(window.innerWidth > 576) {
                    // Verificăm dacă click-ul este pe elementul principal, nu pe submeniu
                    if(e.target === item || e.target === item.querySelector('a') || 
                       e.target.parentElement === item.querySelector('a')) {
                        
                        // MODIFICARE: Verifică dacă link-ul are ca destinație / sau /despre
                        const targetLink = item.querySelector('a');
                        const href = targetLink ? targetLink.getAttribute('href') : null;
                        
                        // Dacă link-ul este către Home sau Despre noi, permitem comportamentul implicit
                        if(href === '/' || href === '/despre') {
                            return true; // Permite navigarea
                        }
                        
                        // Altfel, prevenim comportamentul implicit pentru submeniuri
                        e.preventDefault();
                        
                        // Verificăm dacă acest element este activ
                        const isActive = this.classList.contains('active');
                        
                        // Închide toate submeniurile
                        menuItems.forEach(otherItem => {
                            if(otherItem !== item && otherItem.classList.contains('active')) {
                                otherItem.classList.remove('active');
                            }
                        });
                        
                        // Toggle pentru acest submeniu
                        this.classList.toggle('active');
                    }
                }
            });
        } else {
            // MODIFICARE: Pentru elementele fără submeniu, adăugăm un event listener separat
            // care va permite navigarea normală
            item.addEventListener('click', function(e) {
                // Nu facem nimic special, permitem comportamentul implicit al link-urilor
                return true;
            });
        }
    });
    
    // Închide meniul la click în afara
    document.addEventListener('click', function(e) {
        // Verificăm dacă click-ul este în afara meniului și suntem pe ecran mic
        if(!e.target.closest('.main-nav') && !e.target.closest('.menu-toggle')) {
            // Închide meniul hamburger pe ecran mic
            if(window.innerWidth <= 576) {
                mainNav.classList.remove('show');
                
                // Resetează iconul
                if(menuToggle && menuToggle.querySelector('i.fa-times')) {
                    menuToggle.querySelector('i').classList.add('fa-bars');
                    menuToggle.querySelector('i').classList.remove('fa-times');
                }
            }
            
            // Închide submeniurile pe ecran mare și mediu
            if(window.innerWidth > 576) {
                menuItems.forEach(item => {
                    item.classList.remove('active');
                });
            }
        }
    });
    
    // Adaugă caracteristica de accesibilitate prin tastatură
    // Pentru butonul hamburger
    if(menuToggle) {
        menuToggle.addEventListener('keydown', function(e) {
            if(e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }
    
    // Pentru submeniuri pe desktop, adăugăm suport pentru tastatură
    menuItems.forEach(item => {
        if(item.querySelector('ul') && item.querySelector('a')) {
            item.querySelector('a').addEventListener('keydown', function(e) {
                if(e.key === 'Enter' || e.key === ' ') {
                    // MODIFICARE: Verifică dacă link-ul are ca destinație / sau /despre
                    const href = this.getAttribute('href');
                    
                    // Dacă link-ul este către Home sau Despre noi, permitem comportamentul implicit
                    if(href === '/' || href === '/despre') {
                        return true; // Permite navigarea
                    }
                    
                    // Altfel, gestionăm submeniul
                    if(window.innerWidth > 576) {
                        e.preventDefault();
                        item.classList.toggle('active');
                    }
                }
            });
        }
    });
    
    // Actualizează starea meniului la redimensionare
    window.addEventListener('resize', function() {
        if(window.innerWidth > 576) {
            // Resetează meniul hamburger pentru ecrane mai mari
            mainNav.classList.remove('show');
            
            // Resetează iconul
            if(menuToggle && menuToggle.querySelector('i.fa-times')) {
                menuToggle.querySelector('i').classList.add('fa-bars');
                menuToggle.querySelector('i').classList.remove('fa-times');
            }
        }
    });
    
    // Funcționalități suplimentare pentru submeniuri (opțional)
    menuItems.forEach(item => {
        // Verificăm dacă elementul are submeniu
        if(item.querySelector('ul')) {
            // Adăugăm delay pentru a preveni flickering pe hover
            let hoverTimeout;
            
            item.addEventListener('mouseenter', function() {
                if(window.innerWidth > 576) {
                    clearTimeout(hoverTimeout);
                }
            });
            
            item.addEventListener('mouseleave', function() {
                if(window.innerWidth > 576) {
                    hoverTimeout = setTimeout(function() {
                        // No action needed, CSS handles hover
                    }, 200);
                }
            });
            
            // Opțional: Adăugăm animații pentru submeniuri
            const submenu = item.querySelector('ul');
            if(submenu) {
                // Adăugăm event listener pentru a detecta când animația s-a terminat
                submenu.addEventListener('transitionend', function(e) {
                    if(e.propertyName === 'transform' && window.innerWidth > 576) {
                        // Verificăm dacă submeniul este vizibil
                        const isVisible = getComputedStyle(submenu).opacity > 0;
                        
                        if(!isVisible) {
                            // Submeniul nu mai este vizibil, putem face curățări suplimentare dacă este necesar
                        }
                    }
                });
            }
        }
    });
    
    // Ajustări pentru dispozitive tactile
    if('ontouchstart' in window) {
        // Detectăm dacă suntem pe un dispozitiv tactil
        menuItems.forEach(item => {
            if(item.querySelector('ul')) {
                // Folosim touchstart în loc de click pentru dispozitive tactile
                item.addEventListener('touchstart', function(e) {
                    if(window.innerWidth > 576) {
                        // MODIFICARE: Verifică dacă link-ul are ca destinație / sau /despre
                        const targetLink = item.querySelector('a');
                        const href = targetLink ? targetLink.getAttribute('href') : null;
                        
                        // Dacă link-ul este către Home sau Despre noi, permitem comportamentul implicit
                        if(href === '/' || href === '/despre') {
                            return true; // Permite navigarea
                        }
                        
                        // Prevenim comportamentul de hover pe dispozitive tactile
                        e.preventDefault();
                        
                        // Verificăm dacă acest element este activ
                        const isActive = this.classList.contains('active-touch');
                        
                        // Închide toate submeniurile
                        menuItems.forEach(otherItem => {
                            otherItem.classList.remove('active-touch');
                        });
                        
                        // Toggle pentru acest submeniu
                        if(!isActive) {
                            this.classList.add('active-touch');
                        }
                    }
                });
            }
        });
        
        // Închide submeniurile la touch în afara
        document.addEventListener('touchstart', function(e) {
            if(!e.target.closest('.main-nav') && window.innerWidth > 576) {
                menuItems.forEach(item => {
                    item.classList.remove('active-touch');
                });
            }
        });
    }
});