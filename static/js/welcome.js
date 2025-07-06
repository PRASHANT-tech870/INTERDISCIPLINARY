// Welcome page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize neural network
    initializeNeuralNetwork();
    
    // Add additional floating particles dynamically
    const particlesContainer = document.querySelector('.particles');
    
    // Create additional particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        particlesContainer.appendChild(particle);
    }
    
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(0, 212, 255, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-10px) scale(1)';
            this.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.1)';
        });
    });
    
    // Add click effect to tech badges
    const techBadges = document.querySelectorAll('.tech-badge');
    techBadges.forEach(badge => {
        badge.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1.05)';
            }, 100);
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // Add typing effect to subtitle
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        const originalText = subtitle.textContent;
        subtitle.textContent = '';
        
        setTimeout(() => {
            let index = 0;
            const typeWriter = setInterval(() => {
                if (index < originalText.length) {
                    subtitle.textContent += originalText.charAt(index);
                    index++;
                } else {
                    clearInterval(typeWriter);
                }
            }, 100);
        }, 1000);
    }
    
    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add parallax effect to neural background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.neural-node');
        const speed = 0.5;
        
        parallaxElements.forEach(element => {
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px) scale(${element.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1})`;
        });
    });
    
    // Add click ripple effect to enter button
    const enterButton = document.querySelector('.enter-button');
    if (enterButton) {
        enterButton.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
    
    // Add CSS for ripple animation
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .enter-button {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(rippleStyle);
    
    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all feature cards and detail cards
    document.querySelectorAll('.feature-card, .detail-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Add mouse move effect for neural nodes
    document.addEventListener('mousemove', function(e) {
        const neuralNodes = document.querySelectorAll('.neural-node');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        neuralNodes.forEach((node, index) => {
            const offsetX = (mouseX - 0.5) * 20 * (index % 2 === 0 ? 1 : -1);
            const offsetY = (mouseY - 0.5) * 20 * (index % 2 === 0 ? 1 : -1);
            
            node.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${node.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1})`;
        });
    });
    
    console.log('🧠 NeuroMed AI Welcome Page Loaded Successfully!');
});

// Neural Network Initialization
function initializeNeuralNetwork() {
    const neuralBackground = document.querySelector('.neural-background');
    if (!neuralBackground) return;
    
    // Clear existing nodes and connections
    neuralBackground.innerHTML = '';
    
    // Network configuration
    const nodeCount = 25;
    const connectionProbability = 0.3;
    const nodes = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        const nodeType = Math.random() < 0.1 ? 'hub' : (Math.random() < 0.3 ? 'large' : '');
        node.className = `neural-node ${nodeType}`;
        
        // Position nodes
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        node.style.left = x + '%';
        node.style.top = y + '%';
        
        // Add random delay to animation
        node.style.animationDelay = Math.random() * 4 + 's';
        
        neuralBackground.appendChild(node);
        nodes.push({ element: node, x, y });
    }
    
    // Create connections between nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const distance = Math.sqrt(
                Math.pow(nodes[i].x - nodes[j].x, 2) + 
                Math.pow(nodes[i].y - nodes[j].y, 2)
            );
            
            // Only connect nearby nodes
            if (distance < 30 && Math.random() < connectionProbability) {
                createConnection(nodes[i], nodes[j], neuralBackground);
            }
        }
    }
    
    // Add data packets periodically
    setInterval(() => {
        if (Math.random() < 0.3) {
            createDataPacket(neuralBackground);
        }
    }, 2000);
}

function createConnection(nodeA, nodeB, container) {
    const connection = document.createElement('div');
    const connectionType = Math.random() < 0.2 ? 'active' : (Math.random() < 0.4 ? 'secondary' : '');
    connection.className = `neural-connection ${connectionType}`;
    
    // Calculate connection geometry
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Position and style the connection
    connection.style.left = nodeA.x + '%';
    connection.style.top = nodeA.y + '%';
    connection.style.width = distance + '%';
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.transformOrigin = '0 50%';
    
    // Add random animation delay
    connection.style.animationDelay = Math.random() * 8 + 's';
    
    container.appendChild(connection);
}

function createDataPacket(container) {
    const connections = container.querySelectorAll('.neural-connection');
    if (connections.length === 0) return;
    
    const randomConnection = connections[Math.floor(Math.random() * connections.length)];
    const packet = document.createElement('div');
    packet.className = 'data-packet';
    
    // Position packet at the start of the connection
    packet.style.left = randomConnection.style.left;
    packet.style.top = randomConnection.style.top;
    packet.style.transform = randomConnection.style.transform;
    packet.style.transformOrigin = '0 50%';
    
    // Add random delay
    packet.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(packet);
    
    // Remove packet after animation
    setTimeout(() => {
        if (packet.parentNode) {
            packet.parentNode.removeChild(packet);
        }
    }, 4000);
}

// Resize handler to regenerate network
window.addEventListener('resize', function() {
    setTimeout(initializeNeuralNetwork, 100);
}); 