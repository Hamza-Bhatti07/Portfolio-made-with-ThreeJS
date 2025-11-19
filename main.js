// Project data template - EDIT THIS SECTION
const projects = {
    swing: {
        title: "Swing Project",
        description: "An interactive web application that demonstrates real-time physics simulation using JavaScript and WebGL. This project showcases advanced animation techniques and user interaction patterns.",
        technologies: ["JavaScript", "WebGL", "Physics", "Animation"],
        links: [
            { text: "Live Demo", url: "#", type: "primary" },
            { text: "GitHub", url: "#", type: "secondary" }
        ]
    },
    slide: {
        title: "Slide Project",
        description: "A full-stack application built with modern frameworks, featuring a responsive design and seamless user experience. This project demonstrates proficiency in both frontend and backend development.",
        technologies: ["React", "Node.js", "MongoDB", "Express"],
        links: [
            { text: "View Project", url: "#", type: "primary" },
            { text: "Source Code", url: "#", type: "secondary" }
        ]
    },
    seesaw: {
        title: "Seesaw Project",
        description: "A machine learning application that analyzes and predicts patterns in large datasets. This project showcases data preprocessing, model training, and visualization capabilities.",
        technologies: ["Python", "TensorFlow", "Pandas", "Flask"],
        links: [
            { text: "Documentation", url: "#", type: "primary" },
            { text: "Research Paper", url: "#", type: "secondary" }
        ]
    },
    merrygoround: {
        title: "Merry-go-round Project",
        description: "A mobile-first application designed for iOS and Android platforms. This project demonstrates cross-platform development skills and attention to user experience design.",
        technologies: ["React Native", "Firebase", "Redux", "UI/UX"],
        links: [
            { text: "App Store", url: "#", type: "primary" },
            { text: "Play Store", url: "#", type: "secondary" }
        ]
    }
};

// Billboard text - EDIT THIS SECTION
const billboardText = {
    name: "UNDER SONSTRUCTION!!!!",
    title: "I'm a Computer Science Student",
    subtitle: ""
};

// Three.js setup
let scene, camera, renderer;
let world;
let playgroundObjects = {};
let raycaster, mouse;
let physicsEnabled = true; // Flag to control physics

// Weather system variables
let currentWeather = 'day';
let sky = null;
let ambientLight = null;
let directionalLight = null;
let rainParticles = null;
let lightningFlash = null;
let lightningInterval = null;
let weatherTransitionTime = 0;

// Camera control variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let cameraDistance = 20;
let targetCameraPosition = { x: 0, y: 10, z: 20 };
let targetLookAt = { x: 0, y: 0, z: 0 };
let cameraLerpFactor = 0.05;
let streetViewMode = false;
let streetViewPosition = { x: 0, y: 1.6, z: 0 }; // Eye level height
let streetViewDirection = 0; // Rotation around Y axis

// Debug function to log errors
function debugLog(message) {
    console.log(message);
}

// ==================== WEATHER SYSTEM ====================

function createSky() {
    // Create sky using a large sphere
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87CEEB,
        side: THREE.BackSide,
        fog: false
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
}

function createRainParticles() {
    const rainGeometry = new THREE.BufferGeometry();
    const rainCount = 5000;
    const positions = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = Math.random() * 50 + 20;
        positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const rainMaterial = new THREE.PointsMaterial({
        color: 0xAAAAAA,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });
    
    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    rainParticles.visible = false; // Start hidden
    scene.add(rainParticles);
}

function updateRainParticles() {
    if (!rainParticles || currentWeather !== 'rainy' && currentWeather !== 'stormy') return;
    
    const positions = rainParticles.geometry.attributes.position.array;
    const speed = 0.5;
    
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= speed;
        if (positions[i] < 0) {
            positions[i] = 50;
            positions[i - 1] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
        }
    }
    
    rainParticles.geometry.attributes.position.needsUpdate = true;
}

function createLightningFlash() {
    lightningFlash = document.createElement('div');
    lightningFlash.style.position = 'fixed';
    lightningFlash.style.top = '0';
    lightningFlash.style.left = '0';
    lightningFlash.style.width = '100%';
    lightningFlash.style.height = '100%';
    lightningFlash.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    lightningFlash.style.pointerEvents = 'none';
    lightningFlash.style.zIndex = '999';
    lightningFlash.style.transition = 'background-color 0.1s';
    document.body.appendChild(lightningFlash);
}

function triggerLightning() {
    if (!lightningFlash || currentWeather !== 'stormy') return;
    
    const intensity = Math.random() * 0.3 + 0.1;
    lightningFlash.style.backgroundColor = `rgba(255, 255, 255, ${intensity})`;
    
    setTimeout(() => {
        if (lightningFlash) {
            lightningFlash.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        }
    }, 100);
    
    // Flash directional light
    if (directionalLight) {
        const originalIntensity = directionalLight.intensity;
        directionalLight.intensity = originalIntensity * 2;
        setTimeout(() => {
            if (directionalLight) {
                directionalLight.intensity = originalIntensity;
            }
        }, 100);
    }
}

function setWeather(weatherType) {
    if (currentWeather === weatherType) return;
    
    currentWeather = weatherType;
    weatherTransitionTime = 0;
    
    // Update UI
    const buttons = document.querySelectorAll('.weather-btn');
    buttons.forEach(btn => {
        if (btn.dataset.weather === weatherType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update sky color
    if (sky) {
        const skyColors = {
            'day': 0x87CEEB,
            'night': 0x191970,
            'rainy': 0x708090,
            'stormy': 0x2F2F2F,
            'sunny': 0x87CEEB
        };
        sky.material.color.setHex(skyColors[weatherType] || 0x87CEEB);
    }
    
    // Update fog
    if (scene.fog) {
        const fogColors = {
            'day': 0x87CEEB,
            'night': 0x191970,
            'rainy': 0x708090,
            'stormy': 0x2F2F2F,
            'sunny': 0xE0F6FF
        };
        scene.fog.color.setHex(fogColors[weatherType] || 0x87CEEB);
    }
    
    // Update lighting
    if (ambientLight && directionalLight) {
        const lighting = {
            'day': { ambient: 0.6, directional: 0.8, color: 0xFFFFFF, position: [20, 30, 10] },
            'night': { ambient: 0.2, directional: 0.3, color: 0x8B9DC3, position: [-20, 20, -10] },
            'rainy': { ambient: 0.4, directional: 0.5, color: 0xCCCCCC, position: [20, 25, 10] },
            'stormy': { ambient: 0.2, directional: 0.4, color: 0x888888, position: [20, 25, 10] },
            'sunny': { ambient: 0.7, directional: 1.0, color: 0xFFE5B4, position: [20, 35, 10] }
        };
        
        const light = lighting[weatherType] || lighting['day'];
        ambientLight.intensity = light.ambient;
        directionalLight.intensity = light.directional;
        directionalLight.color.setHex(light.color);
        directionalLight.position.set(light.position[0], light.position[1], light.position[2]);
    }
    
    // Handle rain particles
    if (rainParticles) {
        if (weatherType === 'rainy' || weatherType === 'stormy') {
            rainParticles.visible = true;
        } else {
            rainParticles.visible = false;
        }
    }
    
    // Handle lightning
    if (lightningInterval) {
        clearInterval(lightningInterval);
        lightningInterval = null;
    }
    
    if (weatherType === 'stormy') {
        lightningInterval = setInterval(() => {
            if (Math.random() < 0.3) {
                triggerLightning();
            }
        }, 2000);
    }
}

function createWeatherMenu() {
    const weatherMenu = document.createElement('div');
    weatherMenu.id = 'weather-menu';
    weatherMenu.className = 'weather-menu';
    
    const weatherTypes = [
        { id: 'day', label: '☀️ Day', icon: '☀️' },
        { id: 'night', label: '🌙 Night', icon: '🌙' },
        { id: 'rainy', label: '🌧️ Rainy', icon: '🌧️' },
        { id: 'stormy', label: '⛈️ Stormy', icon: '⛈️' },
        { id: 'sunny', label: '☀️ Sunny', icon: '☀️' }
    ];
    
    weatherMenu.innerHTML = `
        <div class="weather-menu-title">Weather</div>
        <div class="weather-buttons">
            ${weatherTypes.map(weather => `
                <button class="weather-btn ${weather.id === 'day' ? 'active' : ''}" 
                        data-weather="${weather.id}">
                    ${weather.icon} ${weather.id.charAt(0).toUpperCase() + weather.id.slice(1)}
                </button>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(weatherMenu);
    
    // Add event listeners
    const buttons = weatherMenu.querySelectorAll('.weather-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            setWeather(btn.dataset.weather);
        });
    });
}

// Define all functions first
function createGround() {
    debugLog("Creating ground...");
    
    // Visual ground - 2x bigger (100x100)
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "ground";
    scene.add(ground);
    
    // Physics ground - only if physics is enabled and working
    if (physicsEnabled && world) {
        try {
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            world.add(groundBody);
        } catch (e) {
            console.error("Error creating ground physics:", e);
            physicsEnabled = false;
        }
    }
    
    debugLog("Ground created");
}

function createBillboard() {
    debugLog("Creating billboard...");
    
    // Billboard stand - positioned at entrance
    const standGeometry = new THREE.BoxGeometry(1, 8, 1);
    const standMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(0, 4, -15.59);
    stand.castShadow = true;
    stand.name = "billboard-stand";
    scene.add(stand);
    
    // Billboard panel - facing inward toward playground
    const panelGeometry = new THREE.PlaneGeometry(10, 6);
    const panelMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 6, -15);
    panel.rotation.y = 0; // Face inward
    panel.receiveShadow = true;
    panel.castShadow = true;
    panel.name = "billboard-panel";
    scene.add(panel);
    
    // Add text to billboard
    const textGeometry = new THREE.PlaneGeometry(9, 5);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#f0f0f0';
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = '#333';
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.fillText(billboardText.name, 256, 80);
    context.font = 'bold 26px Arial';
    context.fillText(billboardText.title, 256, 120);
    context.font = '20px Arial';
    context.fillText(billboardText.subtitle, 256, 160);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 6, -14.9);
    textMesh.rotation.y = 0;
    textMesh.name = "billboard-text";
    scene.add(textMesh);
    
    debugLog("Billboard created");
}

function createSwing(position, projectKey) {
    debugLog(`Creating swing at ${position.x}, ${position.z}...`);
    
    const swingGroup = new THREE.Group();
    swingGroup.name = `swing-group-${projectKey}`;
    
    // Swing frame
    const frameGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftPole = new THREE.Mesh(frameGeometry, frameMaterial);
    leftPole.position.set(-1.5, 3, 0);
    leftPole.castShadow = true;
    leftPole.name = `swing-left-pole-${projectKey}`;
    swingGroup.add(leftPole);
    
    const rightPole = new THREE.Mesh(frameGeometry, frameMaterial);
    rightPole.position.set(1.5, 3, 0);
    rightPole.castShadow = true;
    rightPole.name = `swing-right-pole-${projectKey}`;
    swingGroup.add(rightPole);
    
    // Top bar
    const topBarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3.5);
    const topBar = new THREE.Mesh(topBarGeometry, frameMaterial);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 6, 0);
    topBar.castShadow = true;
    topBar.name = `swing-top-bar-${projectKey}`;
    swingGroup.add(topBar);
    
    // Swing seat
    const seatGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.5);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 2, 0);
    seat.castShadow = true;
    seat.name = `swing-seat-${projectKey}`;
    swingGroup.add(seat);
    
    // Chains
    const chainGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
    const chainMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    const leftChain = new THREE.Mesh(chainGeometry, chainMaterial);
    leftChain.position.set(-0.6, 4, 0);
    leftChain.name = `swing-left-chain-${projectKey}`;
    swingGroup.add(leftChain);
    
    const rightChain = new THREE.Mesh(chainGeometry, chainMaterial);
    rightChain.position.set(0.6, 4, 0);
    rightChain.name = `swing-right-chain-${projectKey}`;
    swingGroup.add(rightChain);
    
    swingGroup.position.set(position.x, position.y, position.z);
    scene.add(swingGroup);
    
    // Add to playground objects
    playgroundObjects[projectKey] = {
        mesh: seat,
        group: swingGroup,
        type: projectKey,
        position: { x: position.x, y: position.y + 2, z: position.z }
    };
    
    // Add physics to seat
    if (physicsEnabled && world) {
        try {
            const seatShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.05, 0.25));
            const seatBody = new CANNON.Body({ mass: 1 });
            seatBody.addShape(seatShape);
            seatBody.position.set(position.x, position.y + 2, position.z);
            world.add(seatBody);
            
            // Constraints for swinging motion
            const constraint = new CANNON.PointToPointConstraint(
                seatBody, new CANNON.Vec3(-0.6, 2, 0),
                new CANNON.Body({ mass: 0 }), new CANNON.Vec3(position.x - 0.6, position.y + 6, position.z)
            );
            world.add(constraint);
            
            const constraint2 = new CANNON.PointToPointConstraint(
                seatBody, new CANNON.Vec3(0.6, 2, 0),
                new CANNON.Body({ mass: 0 }), new CANNON.Vec3(position.x + 0.6, position.y + 6, position.z)
            );
            world.add(constraint2);
            
            seatBody.userData = { mesh: seat, type: projectKey };
        } catch (e) {
            console.error("Error creating swing physics:", e);
            physicsEnabled = false;
        }
    }
    
    debugLog(`Swing ${projectKey} created`);
}

function createSlide() {
    debugLog("Creating slide...");
    
    // Create a group for all slide components
    const slideStructure = new THREE.Group();
    slideStructure.name = "slide-structure";
    
    // Define materials for reuse
    const slideMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    const ladderMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Create the main slide surface
    const slideSurfaceGeometry = new THREE.BoxGeometry(7.5, 0.3, 2);
    const slideSurface = new THREE.Mesh(slideSurfaceGeometry, slideMaterial);
    
    // Rotate the slide to face right side (90 degrees on Y axis)
    slideSurface.rotation.z = -Math.PI / 5.5;
    slideSurface.position.set(0.79, 2.011, 0);
    slideSurface.castShadow = true;
    slideSurface.name = "slide-surface";
    slideStructure.add(slideSurface);
    
    // Create ladder side rails
    const ladderRailGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    
    const leftLadderRail = new THREE.Mesh(ladderRailGeometry, ladderMaterial);
    leftLadderRail.position.set(-2.4, 2, 1);
    leftLadderRail.name = "slide-left-ladder-rail";
    slideStructure.add(leftLadderRail);
    
    const rightLadderRail = new THREE.Mesh(ladderRailGeometry, ladderMaterial);
    rightLadderRail.position.set(-2.4, 2, -1);
    rightLadderRail.name = "slide-right-ladder-rail";
    slideStructure.add(rightLadderRail);

    const newLeftRail = new THREE.Mesh(ladderRailGeometry, ladderMaterial);
    newLeftRail.position.set(-4.6, 2, 1); // Positioned just outside the left rail
    newLeftRail.name = "slide-new-left-rail";
    slideStructure.add(newLeftRail);

    const newRightRail = new THREE.Mesh(ladderRailGeometry, ladderMaterial);
    newRightRail.position.set(-4.6, 2, -1); // Positioned just outside the right rail
    newRightRail.name = "slide-new-right-rail";
    slideStructure.add(newRightRail);
    
    // Create ladder steps
    const stepGeometry = new THREE.BoxGeometry(2.5, 0.2, 0.3);
    const stepCount = 5;
    const stepSpacing = 3.5 / stepCount;
    
    for (let i = 0; i < stepCount; i++) {
        const step = new THREE.Mesh(stepGeometry, ladderMaterial);
        step.position.set(-3.5, 0.5 + (i * stepSpacing), 1);
        step.castShadow = true;
        step.name = `slide-ladder-step-${i+1}`;
        slideStructure.add(step);
    }
    
    // Create a platform at the top of the slide
    const platformGeometry = new THREE.BoxGeometry(2.5, 0.3, 2);
    const platform = new THREE.Mesh(platformGeometry, slideMaterial);
    platform.position.set(-3.5, 4, 0);
    platform.castShadow = true;
    platform.name = "slide-platform";
    slideStructure.add(platform);
    
    // Apply rotation to the entire slide structure
    slideStructure.rotation.y = Math.PI / 2;
    
    // Position the entire slide structure in the scene
    slideStructure.position.set(10, 0, 0);
    scene.add(slideStructure);
    
    // Store reference to the slide for later access
    playgroundObjects.slide = {
        mesh: slideSurface,
        group: slideStructure,
        type: 'slide',
        position: { x: 10, y: 3, z: 0 }
    };
    
    debugLog("Slide created successfully");
}

function createSeesaw() {
    debugLog("Creating seesaw...");
    
    const seesawGroup = new THREE.Group();
    seesawGroup.name = "seesaw-group";
    
    // Fulcrum
    const fulcrumGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const fulcrumMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const fulcrum = new THREE.Mesh(fulcrumGeometry, fulcrumMaterial);
    fulcrum.position.y = 0.5;
    fulcrum.castShadow = true;
    fulcrum.name = "seesaw-fulcrum";
    seesawGroup.add(fulcrum);
    
    // Plank
    const plankGeometry = new THREE.BoxGeometry(6, 0.3, 1);
    const plankMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE66D });
    const plank = new THREE.Mesh(plankGeometry, plankMaterial);
    plank.position.y = 1;
    plank.castShadow = true;
    plank.name = "seesaw-plank";
    seesawGroup.add(plank);
    
    // Seats
    const seatGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    
    const leftSeat = new THREE.Mesh(seatGeometry, seatMaterial);
    leftSeat.position.set(-2.5, 1.4, 0);
    leftSeat.castShadow = true;
    leftSeat.name = "seesaw-left-seat";
    seesawGroup.add(leftSeat);
    
    const rightSeat = new THREE.Mesh(seatGeometry, seatMaterial);
    rightSeat.position.set(2.5, 1.4, 0);
    rightSeat.castShadow = true;
    rightSeat.name = "seesaw-right-seat";
    seesawGroup.add(rightSeat);
    
    seesawGroup.position.set(0, 0, 10);
    scene.add(seesawGroup);
    
    playgroundObjects.seesaw = {
        mesh: plank,
        group: seesawGroup,
        type: 'seesaw',
        position: { x: 0, y: 1, z: 10 }
    };
    
    // Physics for seesaw
    if (physicsEnabled && world) {
        try {
            const plankShape = new CANNON.Box(new CANNON.Vec3(3, 0.15, 0.5));
            const plankBody = new CANNON.Body({ mass: 5 });
            plankBody.addShape(plankShape);
            plankBody.position.set(0, 1, 10);
            world.add(plankBody);
            
            // Hinge constraint
            const hinge = new CANNON.HingeConstraint(
                plankBody,
                new CANNON.Body({ mass: 0 }),
                { pivotA: new CANNON.Vec3(0, -0.85, 0), axisA: new CANNON.Vec3(0, 0, 1) }
            );
            world.add(hinge);
            
            plankBody.userData = { mesh: plank, type: 'seesaw' };
        } catch (e) {
            console.error("Error creating seesaw physics:", e);
            physicsEnabled = false;
        }
    }
    
    debugLog("Seesaw created");
}

function createMerryGoRound() {
    debugLog("Creating merry-go-round...");
    
    const merryGroup = new THREE.Group();
    merryGroup.name = "merry-group";
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(2, 2, 0.5);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    base.name = "merry-base";
    merryGroup.add(base);
    
    // Platform
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.3);
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0xA8E6CF });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.65;
    platform.castShadow = true;
    platform.name = "merry-platform";
    merryGroup.add(platform);
    
    // Center pole
    const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD93D });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2;
    pole.castShadow = true;
    pole.name = "merry-pole";
    merryGroup.add(pole);
    
    // Horses
    const horseGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
    const horseMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    
    for (let i = 0; i < 4; i++) {
        const horse = new THREE.Mesh(horseGeometry, horseMaterial);
        const angle = (i / 4) * Math.PI * 2;
        horse.position.set(Math.cos(angle) * 2, 1.5, Math.sin(angle) * 2);
        horse.castShadow = true;
        horse.name = `merry-horse-${i}`;
        merryGroup.add(horse);
    }
    
    merryGroup.position.set(-10, 0, 0);
    scene.add(merryGroup);
    
    playgroundObjects.merrygoround = {
        mesh: platform,
        group: merryGroup,
        type: 'merrygoround',
        position: { x: -10, y: 0.65, z: 0 }
    };
    
    // Add rotation animation
    merryGroup.userData = { rotating: true, speed: 0.01 };
    
    debugLog("Merry-go-round created");
}

function createFence() {
    debugLog("Creating fence...");
    
    const fenceGroup = new THREE.Group();
    fenceGroup.name = "fence-group";
    
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const railMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Fence perimeter - rectangular around playground (larger to match bigger ground)
    const fenceSize = 40;
    const postSpacing = 2;
    const numPostsPerSide = Math.floor(fenceSize / postSpacing);
    
    // Helper function to create a rail between two posts
    function createRail(startPos, endPos, height, rotation) {
        const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + 
            Math.pow(endPos.z - startPos.z, 2)
        );
        const railGeometry = new THREE.BoxGeometry(0.1, 0.1, distance);
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        
        const midX = (startPos.x + endPos.x) / 2;
        const midZ = (startPos.z + endPos.z) / 2;
        rail.position.set(midX, height, midZ);
        
        if (rotation !== undefined) {
            rail.rotation.y = rotation;
        } else {
            // Calculate rotation based on positions
            const angle = Math.atan2(endPos.z - startPos.z, endPos.x - startPos.x);
            rail.rotation.y = angle;
        }
        
        rail.castShadow = true;
        return rail;
    }
    
    const posts = [];
    
    // Create all posts first
    // Front (south) and back (north) sides
    for (let i = 0; i <= numPostsPerSide; i++) {
        const x = -fenceSize / 2 + (i * postSpacing);
        
        // Front fence (south)
        const post1 = new THREE.Mesh(postGeometry, postMaterial);
        post1.position.set(x, 1, -fenceSize / 2);
        post1.castShadow = true;
        fenceGroup.add(post1);
        posts.push({ x: x, z: -fenceSize / 2 });
        
        // Back fence (north)
        const post2 = new THREE.Mesh(postGeometry, postMaterial);
        post2.position.set(x, 1, fenceSize / 2);
        post2.castShadow = true;
        fenceGroup.add(post2);
        posts.push({ x: x, z: fenceSize / 2 });
    }
    
    // Left (west) and right (east) sides
    for (let i = 1; i < numPostsPerSide; i++) {
        const z = -fenceSize / 2 + (i * postSpacing);
        
        // Left fence (west)
        const post1 = new THREE.Mesh(postGeometry, postMaterial);
        post1.position.set(-fenceSize / 2, 1, z);
        post1.castShadow = true;
        fenceGroup.add(post1);
        posts.push({ x: -fenceSize / 2, z: z });
        
        // Right fence (east)
        const post2 = new THREE.Mesh(postGeometry, postMaterial);
        post2.position.set(fenceSize / 2, 1, z);
        post2.castShadow = true;
        fenceGroup.add(post2);
        posts.push({ x: fenceSize / 2, z: z });
    }
    
    // Create rails connecting posts
    // Front side rails
    for (let i = 0; i < numPostsPerSide; i++) {
        const x1 = -fenceSize / 2 + (i * postSpacing);
        const x2 = -fenceSize / 2 + ((i + 1) * postSpacing);
        const z = -fenceSize / 2;
        
        const rail1 = createRail(
            { x: x1, z: z },
            { x: x2, z: z },
            1.5,
            0
        );
        fenceGroup.add(rail1);
        
        const rail2 = createRail(
            { x: x1, z: z },
            { x: x2, z: z },
            0.5,
            0
        );
        fenceGroup.add(rail2);
    }
    
    // Back side rails
    for (let i = 0; i < numPostsPerSide; i++) {
        const x1 = -fenceSize / 2 + (i * postSpacing);
        const x2 = -fenceSize / 2 + ((i + 1) * postSpacing);
        const z = fenceSize / 2;
        
        const rail1 = createRail(
            { x: x1, z: z },
            { x: x2, z: z },
            1.5,
            0
        );
        fenceGroup.add(rail1);
        
        const rail2 = createRail(
            { x: x1, z: z },
            { x: x2, z: z },
            0.5,
            0
        );
        fenceGroup.add(rail2);
    }
    
    // Left side rails
    for (let i = 0; i < numPostsPerSide; i++) {
        const z1 = -fenceSize / 2 + (i * postSpacing);
        const z2 = -fenceSize / 2 + ((i + 1) * postSpacing);
        const x = -fenceSize / 2;
        
        const rail1 = createRail(
            { x: x, z: z1 },
            { x: x, z: z2 },
            1.5,
            Math.PI / 2
        );
        fenceGroup.add(rail1);
        
        const rail2 = createRail(
            { x: x, z: z1 },
            { x: x, z: z2 },
            0.5,
            Math.PI / 2
        );
        fenceGroup.add(rail2);
    }
    
    // Right side rails
    for (let i = 0; i < numPostsPerSide; i++) {
        const z1 = -fenceSize / 2 + (i * postSpacing);
        const z2 = -fenceSize / 2 + ((i + 1) * postSpacing);
        const x = fenceSize / 2;
        
        const rail1 = createRail(
            { x: x, z: z1 },
            { x: x, z: z2 },
            1.5,
            Math.PI / 2
        );
        fenceGroup.add(rail1);
        
        const rail2 = createRail(
            { x: x, z: z1 },
            { x: x, z: z2 },
            0.5,
            Math.PI / 2
        );
        fenceGroup.add(rail2);
    }
    
    fenceGroup.position.set(0, 0, 0);
    scene.add(fenceGroup);
    
    debugLog("Fence created");
}

function createTrack() {
    debugLog("Creating track...");
    
    const trackGroup = new THREE.Group();
    trackGroup.name = "track-group";
    
    // Square track following the fence perimeter
    const fenceSize = 40;
    const trackWidth = 2; // Width of the track
    const trackOffset = 1; // Distance from fence
    
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const markingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    // Create square track using planes for each side
    const trackInnerSize = fenceSize - (trackOffset * 2);
    const trackOuterSize = fenceSize - (trackOffset * 2) + trackWidth;
    
    // Helper function to create a track segment
    function createTrackSegment(width, length, x, z, rotation) {
        const geometry = new THREE.PlaneGeometry(width, length);
        const mesh = new THREE.Mesh(geometry, trackMaterial);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = rotation || 0;
        mesh.position.set(x, 0.1, z);
        mesh.receiveShadow = true;
        return mesh;
    }
    
    // Outer track segments (4 sides)
    const outerTrackWidth = trackOuterSize;
    const outerTrackThickness = trackWidth;
    
    // Top side (north)
    const topTrack = createTrackSegment(outerTrackWidth, outerTrackThickness, 0, trackOuterSize / 2, 0);
    trackGroup.add(topTrack);
    
    // Bottom side (south)
    const bottomTrack = createTrackSegment(outerTrackWidth, outerTrackThickness, 0, -trackOuterSize / 2, 0);
    trackGroup.add(bottomTrack);
    
    // Left side (west)
    const leftTrack = createTrackSegment(outerTrackThickness, outerTrackWidth, -trackOuterSize / 2, 0, 0);
    trackGroup.add(leftTrack);
    
    // Right side (east)
    const rightTrack = createTrackSegment(outerTrackThickness, outerTrackWidth, trackOuterSize / 2, 0, 0);
    trackGroup.add(rightTrack);
    
    // Inner track segments (to create the track shape)
    const innerTrackWidth = trackInnerSize;
    const innerTrackThickness = trackWidth;
    
    // Top inner
    const topInner = createTrackSegment(innerTrackWidth, innerTrackThickness, 0, trackInnerSize / 2, 0);
    topInner.material = markingMaterial;
    trackGroup.add(topInner);
    
    // Bottom inner
    const bottomInner = createTrackSegment(innerTrackWidth, innerTrackThickness, 0, -trackInnerSize / 2, 0);
    bottomInner.material = markingMaterial;
    trackGroup.add(bottomInner);
    
    // Left inner
    const leftInner = createTrackSegment(innerTrackThickness, innerTrackWidth, -trackInnerSize / 2, 0, 0);
    leftInner.material = markingMaterial;
    trackGroup.add(leftInner);
    
    // Right inner
    const rightInner = createTrackSegment(innerTrackThickness, innerTrackWidth, trackInnerSize / 2, 0, 0);
    rightInner.material = markingMaterial;
    trackGroup.add(rightInner);
    
    trackGroup.position.set(0, 0, 0);
    scene.add(trackGroup);
    
    debugLog("Track created");
}

function createSandbox() {
    debugLog("Creating sandbox...");
    
    const sandboxGroup = new THREE.Group();
    sandboxGroup.name = "sandbox-group";
    
    // Sandbox base
    const sandboxGeometry = new THREE.BoxGeometry(4, 0.3, 4);
    const sandMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
    const sandbox = new THREE.Mesh(sandboxGeometry, sandMaterial);
    sandbox.position.y = 0.15;
    sandbox.receiveShadow = true;
    sandbox.name = "sandbox-base";
    sandboxGroup.add(sandbox);
    
    // Sandbox border
    const borderMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const borderHeight = 0.5;
    const borderThickness = 0.1;
    
    // Front border
    const frontBorder = new THREE.Mesh(
        new THREE.BoxGeometry(4, borderHeight, borderThickness),
        borderMaterial
    );
    frontBorder.position.set(0, borderHeight / 2, 2);
    frontBorder.castShadow = true;
    sandboxGroup.add(frontBorder);
    
    // Back border
    const backBorder = new THREE.Mesh(
        new THREE.BoxGeometry(4, borderHeight, borderThickness),
        borderMaterial
    );
    backBorder.position.set(0, borderHeight / 2, -2);
    backBorder.castShadow = true;
    sandboxGroup.add(backBorder);
    
    // Left border
    const leftBorder = new THREE.Mesh(
        new THREE.BoxGeometry(borderThickness, borderHeight, 4),
        borderMaterial
    );
    leftBorder.position.set(-2, borderHeight / 2, 0);
    leftBorder.castShadow = true;
    sandboxGroup.add(leftBorder);
    
    // Right border
    const rightBorder = new THREE.Mesh(
        new THREE.BoxGeometry(borderThickness, borderHeight, 4),
        borderMaterial
    );
    rightBorder.position.set(2, borderHeight / 2, 0);
    rightBorder.castShadow = true;
    sandboxGroup.add(rightBorder);
    
    // Sand Castle
    const castleGroup = new THREE.Group();
    castleGroup.name = "sandcastle";
    
    // Castle base
    const baseGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
    const castleBase = new THREE.Mesh(baseGeometry, baseMaterial);
    castleBase.position.y = 0.3;
    castleBase.castShadow = true;
    castleGroup.add(castleBase);
    
    // Castle towers
    const towerGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
    
    // Front-left tower
    const tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-0.5, 0.8, 0.5);
    tower1.castShadow = true;
    castleGroup.add(tower1);
    
    // Front-right tower
    const tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(0.5, 0.8, 0.5);
    tower2.castShadow = true;
    castleGroup.add(tower2);
    
    // Back-left tower
    const tower3 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower3.position.set(-0.5, 0.8, -0.5);
    tower3.castShadow = true;
    castleGroup.add(tower3);
    
    // Back-right tower
    const tower4 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower4.position.set(0.5, 0.8, -0.5);
    tower4.castShadow = true;
    castleGroup.add(tower4);
    
    // Center tower (taller)
    const centerTower = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 1.0, 8),
        towerMaterial
    );
    centerTower.position.set(0, 1.0, 0);
    centerTower.castShadow = true;
    castleGroup.add(centerTower);
    
    castleGroup.position.set(0, 0.15, 0);
    sandboxGroup.add(castleGroup);
    
    sandboxGroup.position.set(-8, 0, 8);
    scene.add(sandboxGroup);
    
    playgroundObjects.sandbox = {
        mesh: sandbox,
        group: sandboxGroup,
        type: 'sandbox',
        position: { x: -8, y: 0.15, z: 8 }
    };
    
    debugLog("Sandbox created");
}

function createMonkeyBars() {
    debugLog("Creating monkey bars...");
    
    const monkeyBarsGroup = new THREE.Group();
    monkeyBarsGroup.name = "monkey-bars-group";
    
    const barMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const barLength = 8;
    const barHeight = 3;
    const numBars = 6;
    const barSpacing = barLength / (numBars - 1);
    
    // Create horizontal bars
    for (let i = 0; i < numBars; i++) {
        const barGeometry = new THREE.CylinderGeometry(0.08, 0.08, barLength, 8);
        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, barHeight - (i * 0.3), 0);
        bar.castShadow = true;
        monkeyBarsGroup.add(bar);
    }
    
    // Create support poles
    const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, barHeight, 8);
    for (let i = 0; i < 2; i++) {
        const x = i === 0 ? -barLength / 2 : barLength / 2;
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, barHeight / 2, 0);
        pole.castShadow = true;
        monkeyBarsGroup.add(pole);
    }
    
    monkeyBarsGroup.position.set(12, 0, -10);
    scene.add(monkeyBarsGroup);
    
    playgroundObjects.monkeybars = {
        mesh: monkeyBarsGroup.children[0],
        group: monkeyBarsGroup,
        type: 'monkeybars',
        position: { x: 12, y: barHeight / 2, z: -10 }
    };
    
    debugLog("Monkey bars created");
}

function createBench(position) {
    const benchGroup = new THREE.Group();
    benchGroup.name = "bench-group";
    
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    // Bench seat
    const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
    const seat = new THREE.Mesh(seatGeometry, woodMaterial);
    seat.position.y = 0.5;
    seat.castShadow = true;
    benchGroup.add(seat);
    
    // Bench back
    const backGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
    const back = new THREE.Mesh(backGeometry, woodMaterial);
    back.position.set(0, 0.9, -0.2);
    back.castShadow = true;
    benchGroup.add(back);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    const legPositions = [
        { x: -0.9, z: 0.2 },
        { x: 0.9, z: 0.2 },
        { x: -0.9, z: -0.2 },
        { x: 0.9, z: -0.2 }
    ];
    
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, metalMaterial);
        leg.position.set(pos.x, 0.25, pos.z);
        leg.castShadow = true;
        benchGroup.add(leg);
    });
    
    benchGroup.position.set(position.x, position.y, position.z);
    scene.add(benchGroup);
    
    return benchGroup;
}

function createBenches() {
    debugLog("Creating benches...");
    
    const benchPositions = [
        { x: -15, y: 0, z: -15 },
        { x: 15, y: 0, z: -15 },
        { x: -15, y: 0, z: 15 },
        { x: 15, y: 0, z: 15 }
    ];
    
    benchPositions.forEach(pos => {
        createBench(pos);
    });
    
    debugLog("Benches created");
}

function createFountain(position) {
    const fountainGroup = new THREE.Group();
    fountainGroup.name = "fountain-group";
    
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const waterMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4A90E2,
        transparent: true,
        opacity: 0.7
    });
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    const base = new THREE.Mesh(baseGeometry, stoneMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    fountainGroup.add(base);
    
    // Middle tier
    const middleGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16);
    const middle = new THREE.Mesh(middleGeometry, stoneMaterial);
    middle.position.y = 0.7;
    middle.castShadow = true;
    fountainGroup.add(middle);
    
    // Top tier
    const topGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    const top = new THREE.Mesh(topGeometry, stoneMaterial);
    top.position.y = 1.15;
    top.castShadow = true;
    fountainGroup.add(top);
    
    // Water
    const waterGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16);
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = 1.2;
    water.receiveShadow = true;
    fountainGroup.add(water);
    
    fountainGroup.position.set(position.x, position.y, position.z);
    scene.add(fountainGroup);
    
    return fountainGroup;
}

function createFountains() {
    debugLog("Creating fountains...");
    
    const fountainPositions = [
        { x: 0, y: 0, z: 0 }
    ];
    
    fountainPositions.forEach(pos => {
        createFountain(pos);
    });
    
    debugLog("Fountains created");
}

function createTree(position) {
    const treeGroup = new THREE.Group();
    treeGroup.name = "tree-group";
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Foliage (multiple spheres for natural look)
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const foliage1 = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        foliageMaterial
    );
    foliage1.position.set(0, 3.5, 0);
    foliage1.castShadow = true;
    treeGroup.add(foliage1);
    
    const foliage2 = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        foliageMaterial
    );
    foliage2.position.set(0.3, 4, 0);
    foliage2.castShadow = true;
    treeGroup.add(foliage2);
    
    treeGroup.position.set(position.x, position.y, position.z);
    scene.add(treeGroup);
    
    return treeGroup;
}

function createTrees() {
    debugLog("Creating trees...");
    
    const treePositions = [
        { x: -18, y: 0, z: -18 },
        { x: 18, y: 0, z: -18 },
        { x: -18, y: 0, z: 18 },
        { x: 18, y: 0, z: 18 },
        { x: 0, y: 0, z: -18 },
        { x: -18, y: 0, z: 0 },
        { x: 18, y: 0, z: 0 },
        { x: 0, y: 0, z: 18 }
    ];
    
    treePositions.forEach(pos => {
        createTree(pos);
    });
    
    debugLog("Trees created");
}

function createBush(position) {
    const bushGroup = new THREE.Group();
    bushGroup.name = "bush-group";
    
    const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
    
    // Create multiple small spheres for bush
    for (let i = 0; i < 3; i++) {
        const size = 0.4 + Math.random() * 0.2;
        const bush = new THREE.Mesh(
            new THREE.SphereGeometry(size, 6, 6),
            bushMaterial
        );
        bush.position.set(
            (Math.random() - 0.5) * 0.5,
            size * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        bush.castShadow = true;
        bushGroup.add(bush);
    }
    
    bushGroup.position.set(position.x, position.y, position.z);
    scene.add(bushGroup);
    
    return bushGroup;
}

function createBushes() {
    debugLog("Creating bushes...");
    
    const bushPositions = [
        { x: -12, y: 0, z: -12 },
        { x: 12, y: 0, z: -12 },
        { x: -12, y: 0, z: 12 },
        { x: 12, y: 0, z: 12 },
        { x: -5, y: 0, z: -5 },
        { x: 5, y: 0, z: -5 },
        { x: -5, y: 0, z: 5 },
        { x: 5, y: 0, z: 5 }
    ];
    
    bushPositions.forEach(pos => {
        createBush(pos);
    });
    
    debugLog("Bushes created");
}

function createWalkingPaths() {
    debugLog("Creating walking paths...");
    
    const pathGroup = new THREE.Group();
    pathGroup.name = "paths-group";
    
    const pathMaterial = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
    const pathWidth = 1.5;
    
    // Main paths connecting key areas
    // Horizontal path
    const horizontalPath = new THREE.Mesh(
        new THREE.PlaneGeometry(40, pathWidth),
        pathMaterial
    );
    horizontalPath.rotation.x = -Math.PI / 2;
    horizontalPath.position.set(0, 0.05, 0);
    horizontalPath.receiveShadow = true;
    pathGroup.add(horizontalPath);
    
    // Vertical path
    const verticalPath = new THREE.Mesh(
        new THREE.PlaneGeometry(pathWidth, 40),
        pathMaterial
    );
    verticalPath.rotation.x = -Math.PI / 2;
    verticalPath.position.set(0, 0.05, 0);
    verticalPath.receiveShadow = true;
    pathGroup.add(verticalPath);
    
    // Diagonal paths
    const diagonalPath1 = new THREE.Mesh(
        new THREE.PlaneGeometry(pathWidth, 30),
        pathMaterial
    );
    diagonalPath1.rotation.x = -Math.PI / 2;
    diagonalPath1.rotation.z = Math.PI / 4;
    diagonalPath1.position.set(0, 0.05, 0);
    diagonalPath1.receiveShadow = true;
    pathGroup.add(diagonalPath1);
    
    const diagonalPath2 = new THREE.Mesh(
        new THREE.PlaneGeometry(pathWidth, 30),
        pathMaterial
    );
    diagonalPath2.rotation.x = -Math.PI / 2;
    diagonalPath2.rotation.z = -Math.PI / 4;
    diagonalPath2.position.set(0, 0.05, 0);
    diagonalPath2.receiveShadow = true;
    pathGroup.add(diagonalPath2);
    
    pathGroup.position.set(0, 0, 0);
    scene.add(pathGroup);
    
    debugLog("Walking paths created");
}

function onMouseClick(event) {
    if (!raycaster || !camera) return;
    
    // Calculate mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray
    raycaster.setFromCamera(mouse, camera);
    
    // Get all objects to test
    const objectsToTest = [];
    scene.traverse((child) => {
        if (child.isMesh && child.name) {
            objectsToTest.push(child);
        }
    });
    
    // Calculate intersections
    const intersects = raycaster.intersectObjects(objectsToTest);
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        debugLog(`Clicked on: ${clickedObject.name}`);
        
        // Find which playground object was clicked
        let playgroundObject = null;
        let objectType = null;
        
        // Check if the clicked object is part of a playground object
        for (const [key, obj] of Object.entries(playgroundObjects)) {
            if (obj.group && obj.group.children.includes(clickedObject)) {
                playgroundObject = obj;
                objectType = key;
                break;
            }
        }
        
        // If not found as a child, check if it's the main mesh
        if (!playgroundObject) {
            for (const [key, obj] of Object.entries(playgroundObjects)) {
                if (obj.mesh === clickedObject) {
                    playgroundObject = obj;
                    objectType = key;
                    break;
                }
            }
        }
        
        if (playgroundObject && objectType) {
            showProjectModal(objectType);
            
            // Focus camera on the clicked object
            focusOnObject(playgroundObject.position);
            
            // Add physics interaction
            if (physicsEnabled && world) {
                if (objectType === 'swing' || objectType === 'swing1' || objectType === 'swing2' || objectType === 'swing3') {
                    world.bodies.forEach(body => {
                        if (body.userData && body.userData.type === objectType && body.velocity) {
                            body.velocity.set(5, 0, 0);
                            body.angularVelocity.set(0, 0, 2);
                        }
                    });
                } else if (objectType === 'seesaw') {
                    world.bodies.forEach(body => {
                        if (body.userData && body.userData.type === 'seesaw' && body.angularVelocity) {
                            body.angularVelocity.set(0, 0, 3);
                        }
                    });
                }
            }
            
            // Add visual feedback
            if (objectType === 'swing' || objectType === 'swing1' || objectType === 'swing2' || objectType === 'swing3') {
                animateSwing(playgroundObject.group);
            } else if (objectType === 'seesaw') {
                animateSeesaw();
            } else if (objectType === 'merrygoround') {
                animateMerryGoRound();
            }
        }
    }
}

function focusOnObject(position) {
    // Set target camera position and look-at point
    const offset = new THREE.Vector3(8, 5, 8);
    targetCameraPosition = {
        x: position.x + offset.x,
        y: position.y + offset.y,
        z: position.z + offset.z
    };
    targetLookAt = {
        x: position.x,
        y: position.y,
        z: position.z
    };
    
    // Increase lerp factor for faster transition
    cameraLerpFactor = 0.1;
    
    // Reset lerp factor after transition
    setTimeout(() => {
        cameraLerpFactor = 0.05;
    }, 1000);
}

function resetCamera() {
    // Reset camera to default position
    targetCameraPosition = { x: 0, y: 10, z: 20 };
    targetLookAt = { x: 0, y: 0, z: 0 };
    cameraRotation = { x: 0, y: 0 };
    cameraDistance = 20;
    
    // Increase lerp factor for faster transition
    cameraLerpFactor = 0.1;
    
    // Reset lerp factor after transition
    setTimeout(() => {
        cameraLerpFactor = 0.05;
    }, 1000);
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseMove(event) {
    if (!isDragging) return;
    
    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };
    
    if (streetViewMode) {
        // Street view - rotate view direction
        streetViewDirection += deltaMove.x * 0.01;
        // Limit vertical look (pitch)
        const pitchLimit = Math.PI / 3;
        // Note: For street view, we could add pitch but keeping it simple for now
    } else {
        // Normal orbit mode
        // Update camera rotation based on mouse movement
        cameraRotation.y += deltaMove.x * 0.01;
        cameraRotation.x += deltaMove.y * 0.01;
        
        // Limit vertical rotation to prevent flipping
        cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraRotation.x));
    }
    
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp(event) {
    isDragging = false;
}

function onWheel(event) {
    if (streetViewMode) {
        // In street view, wheel does nothing or could move forward/backward
        return;
    }
    
    // Zoom in/out with mouse wheel
    cameraDistance += event.deltaY * 0.01;
    cameraDistance = Math.max(10, Math.min(40, cameraDistance));
}

// Keyboard controls for street view
let keysPressed = {};

function setupStreetViewControls() {
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        keysPressed[key] = true;
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        keysPressed[key] = false;
    });
    
    // Continuously check for movement
    setInterval(() => {
        if (!streetViewMode) return;
        
        if (keysPressed['w'] || keysPressed['arrowup']) {
            moveInStreetView('forward');
        }
        if (keysPressed['s'] || keysPressed['arrowdown']) {
            moveInStreetView('backward');
        }
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            moveInStreetView('left');
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            moveInStreetView('right');
        }
    }, 16); // ~60fps
}

function animateSwing(group) {
    if (!group) return;
    let swingAngle = 0;
    let swingDirection = 1;
    let animationCount = 0;
    const maxAnimations = 50;
    
    const swingAnimation = setInterval(() => {
        swingAngle += 0.05 * swingDirection;
        if (Math.abs(swingAngle) > 0.5) swingDirection *= -1;
        
        // Find the seat (usually index 3 in the group)
        const seat = group.children.find(child => child.name && child.name.includes('swing-seat'));
        if (seat) {
            seat.position.x = Math.sin(swingAngle) * 0.3;
            seat.position.y = 2 - Math.abs(swingAngle) * 0.1;
            seat.rotation.z = swingAngle * 0.2;
        }
        
        animationCount++;
        if (animationCount >= maxAnimations && Math.abs(swingAngle) < 0.1) {
            clearInterval(swingAnimation);
        }
    }, 16);
}

function animateSeesaw() {
    const group = playgroundObjects.seesaw.group;
    let seesawAngle = 0;
    let seesawDirection = 1;
    let animationCount = 0;
    const maxAnimations = 50;
    
    const seesawAnimation = setInterval(() => {
        seesawAngle += 0.05 * seesawDirection;
        if (Math.abs(seesawAngle) > 0.3) seesawDirection *= -1;
        
        if (group && group.children[1]) {
            group.children[1].rotation.z = seesawAngle;
        }
        
        animationCount++;
        if (animationCount >= maxAnimations && Math.abs(seesawAngle) < 0.05) {
            clearInterval(seesawAnimation);
        }
    }, 16);
}

function animateMerryGoRound() {
    const group = playgroundObjects.merrygoround.group;
    const originalSpeed = group.userData.speed;
    group.userData.speed = 0.05;
    
    setTimeout(() => {
        group.userData.speed = originalSpeed;
    }, 3000);
}

function showProjectModal(projectType) {
    const project = projects[projectType];
    if (!project) return;
    
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalTechTags = document.getElementById('modal-tech-tags');
    const modalLinks = document.getElementById('modal-links');
    
    if (modalTitle) modalTitle.textContent = project.title;
    if (modalDescription) modalDescription.textContent = project.description;
    
    // Clear and add tech tags
    if (modalTechTags) {
        modalTechTags.innerHTML = '';
        project.technologies.forEach(tech => {
            const tag = document.createElement('span');
            tag.className = 'tech-tag';
            tag.textContent = tech;
            modalTechTags.appendChild(tag);
        });
    }
    
    // Clear and add links
    if (modalLinks) {
        modalLinks.innerHTML = '';
        project.links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = `modal-link ${link.type}`;
            linkElement.textContent = link.text;
            linkElement.target = '_blank';
            modalLinks.appendChild(linkElement);
        });
    }
    
    const modal = document.getElementById('project-modal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCamera() {
    if (streetViewMode) {
        // Street view mode - first person perspective
        const forwardX = Math.sin(streetViewDirection);
        const forwardZ = Math.cos(streetViewDirection);
        
        camera.position.x = streetViewPosition.x;
        camera.position.y = streetViewPosition.y;
        camera.position.z = streetViewPosition.z;
        
        // Look in the direction we're facing
        const lookAtPoint = new THREE.Vector3(
            streetViewPosition.x + forwardX * 10,
            streetViewPosition.y,
            streetViewPosition.z + forwardZ * 10
        );
        
        camera.lookAt(lookAtPoint);
    } else {
        // Normal orbit mode
        // Calculate camera position based on rotation and distance
        const x = targetLookAt.x + cameraDistance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        const y = targetLookAt.y + cameraDistance * Math.sin(cameraRotation.x);
        const z = targetLookAt.z + cameraDistance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        
        // Smoothly move camera to target position
        camera.position.x += (x - camera.position.x) * cameraLerpFactor;
        camera.position.y += (y - camera.position.y) * cameraLerpFactor;
        camera.position.z += (z - camera.position.z) * cameraLerpFactor;
        
        // Smoothly move look-at point
        const lookAtPoint = new THREE.Vector3(
            targetLookAt.x,
            targetLookAt.y,
            targetLookAt.z
        );
        
        camera.lookAt(lookAtPoint);
    }
}

function toggleStreetView() {
    streetViewMode = !streetViewMode;
    
    if (streetViewMode) {
        // Enter street view - set position to center
        streetViewPosition = { x: 0, y: 1.6, z: 0 };
        streetViewDirection = 0;
        
        // Update button
        const btn = document.getElementById('street-view-btn');
        if (btn) {
            btn.textContent = 'Exit Street View';
            btn.classList.add('active');
        }
    } else {
        // Exit street view - reset to normal view
        resetCamera();
        
        // Update button
        const btn = document.getElementById('street-view-btn');
        if (btn) {
            btn.textContent = 'Street View';
            btn.classList.remove('active');
        }
    }
}

function moveInStreetView(direction) {
    if (!streetViewMode) return;
    
    const speed = 0.5;
    const forwardX = Math.sin(streetViewDirection);
    const forwardZ = Math.cos(streetViewDirection);
    const rightX = Math.cos(streetViewDirection);
    const rightZ = -Math.sin(streetViewDirection);
    
    switch(direction) {
        case 'forward':
            streetViewPosition.x += forwardX * speed;
            streetViewPosition.z += forwardZ * speed;
            break;
        case 'backward':
            streetViewPosition.x -= forwardX * speed;
            streetViewPosition.z -= forwardZ * speed;
            break;
        case 'left':
            streetViewPosition.x -= rightX * speed;
            streetViewPosition.z -= rightZ * speed;
            break;
        case 'right':
            streetViewPosition.x += rightX * speed;
            streetViewPosition.z += rightZ * speed;
            break;
    }
    
    // Keep within bounds
    const bounds = 18;
    streetViewPosition.x = Math.max(-bounds, Math.min(bounds, streetViewPosition.x));
    streetViewPosition.z = Math.max(-bounds, Math.min(bounds, streetViewPosition.z));
}

function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Update camera position
        updateCamera();
        
        // Update rain particles
        updateRainParticles();
        
        // Update physics
        if (physicsEnabled && world) {
            try {
                world.step(1/60);
                
                if (world.bodies) {
                    world.bodies.forEach(body => {
                        if (body && body.userData && body.userData.mesh && 
                            body.position && body.quaternion && 
                            body.userData.mesh.position && body.userData.mesh.quaternion) {
                            try {
                                body.userData.mesh.position.copy(body.position);
                                body.userData.mesh.quaternion.copy(body.quaternion);
                            } catch (e) {
                                if (e.message && e.message.includes('updateSolveMassProperties')) {
                                    console.error("Physics engine error, disabling physics");
                                    physicsEnabled = false;
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.error("Physics step error:", e);
                if (e.message && e.message.includes('updateSolveMassProperties')) {
                    console.error("Physics engine error, disabling physics");
                    physicsEnabled = false;
                }
            }
        }
        
        // Rotate merry-go-round
        if (playgroundObjects.merrygoround && 
            playgroundObjects.merrygoround.group && 
            playgroundObjects.merrygoround.group.userData.rotating) {
            playgroundObjects.merrygoround.group.rotation.y += playgroundObjects.merrygoround.group.userData.speed;
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error("Animation error:", error);
    }
}

function createHomeButton() {
    // Remove existing home button if any
    const existingHomeButton = document.getElementById('home-button');
    if (existingHomeButton) {
        existingHomeButton.remove();
    }
    
    // Create home button
    const homeButton = document.createElement('button');
    homeButton.id = 'home-button';
    homeButton.innerHTML = '⌂';
    homeButton.style.position = 'fixed';
    homeButton.style.bottom = '20px';
    homeButton.style.left = '20px';
    homeButton.style.width = '50px';
    homeButton.style.height = '50px';
    homeButton.style.borderRadius = '50%';
    homeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    homeButton.style.border = 'none';
    homeButton.style.fontSize = '24px';
    homeButton.style.cursor = 'pointer';
    homeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    homeButton.style.zIndex = '100';
    homeButton.style.transition = 'all 0.3s ease';
    homeButton.style.display = 'flex';
    homeButton.style.alignItems = 'center';
    homeButton.style.justifyContent = 'center';
    
    // Hover effect
    homeButton.addEventListener('mouseenter', () => {
        homeButton.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        homeButton.style.transform = 'scale(1.1)';
    });
    
    homeButton.addEventListener('mouseleave', () => {
        homeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        homeButton.style.transform = 'scale(1)';
    });
    
    // Click event - use a direct function reference
    homeButton.addEventListener('click', resetCamera);
    
    document.body.appendChild(homeButton);
}

function createStreetViewButton() {
    const existingBtn = document.getElementById('street-view-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const btn = document.createElement('button');
    btn.id = 'street-view-btn';
    btn.textContent = 'Street View';
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.left = '20px';
    btn.style.padding = '10px 20px';
    btn.style.borderRadius = '8px';
    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    btn.style.border = 'none';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = '500';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    btn.style.zIndex = '100';
    btn.style.transition = 'all 0.3s ease';
    
    btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        btn.style.transform = 'scale(1.05)';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        btn.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('click', toggleStreetView);
    
    document.body.appendChild(btn);
}

function createNavigationHints() {
    // Remove existing navigation hints if any
    const existingHints = document.getElementById('navigation-hints');
    if (existingHints) {
        existingHints.remove();
    }
    
    // Remove old controls hint if it exists
    const oldControlsHint = document.querySelector('.controls-hint');
    if (oldControlsHint) {
        oldControlsHint.remove();
    }
    
    // Create navigation hints
    const hints = document.createElement('div');
    hints.id = 'navigation-hints';
    hints.style.position = 'fixed';
    hints.style.bottom = '20px';
    hints.style.right = '20px';
    hints.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hints.style.color = 'white';
    hints.style.padding = '15px';
    hints.style.borderRadius = '8px';
    hints.style.fontSize = '14px';
    hints.style.zIndex = '100';
    hints.style.maxWidth = '250px';
    
    hints.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Navigation:</strong></div>
        <div style="margin-bottom: 4px;">🖱️ Click & Drag: Rotate View</div>
        <div style="margin-bottom: 4px;">🖱️ Scroll: Zoom In/Out</div>
        <div style="margin-bottom: 4px;">🖱️ Click Objects: View Projects</div>
        <div style="margin-bottom: 4px;">🏠 Home Button: Reset View</div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);"><strong>Street View:</strong></div>
        <div style="margin-bottom: 4px;">WASD or Arrows: Move</div>
        <div>🖱️ Drag: Look Around</div>
    `;
    
    document.body.appendChild(hints);
}

function init() {
    try {
        debugLog("Initializing scene...");
        
        // Scene setup
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 20);
        camera.lookAt(0, 0, 0);
        
        // Set initial target positions
        targetCameraPosition = { x: 0, y: 10, z: 20 };
        targetLookAt = { x: 0, y: 0, z: 0 };
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(renderer.domElement);
        }
        
        debugLog("Renderer created");
        
        // Physics world
        if (typeof CANNON !== 'undefined') {
            try {
                world = new CANNON.World();
                world.gravity.set(0, -9.82, 0);
                world.broadphase = new CANNON.NaiveBroadphase();
                world.solver.iterations = 10;
                debugLog("Physics world initialized");
            } catch (e) {
                console.error("Error initializing physics:", e);
                physicsEnabled = false;
                debugLog("Physics disabled due to error");
            }
        } else {
            debugLog("CANNON.js not available");
            physicsEnabled = false;
        }
        
        // Raycaster for object selection
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        // Lighting - store references for weather system
        ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        debugLog("Lighting added");
        
        // Create weather system
        createSky();
        createRainParticles();
        createLightningFlash();
        createWeatherMenu();
        setWeather('day');
        
        debugLog("Weather system initialized");
        
        // Create playground
        createGround();
        createBillboard();
        createSlide();
        createSeesaw();
        createMerryGoRound();
        createFence();
        createTrack();
        createSandbox();
        createMonkeyBars();
        createBenches();
        createFountains();
        createTrees();
        createBushes();
        createWalkingPaths();
        
        debugLog("Playground created");
        
        // Event listeners
        window.addEventListener('resize', onWindowResize);
        renderer.domElement.addEventListener('click', onMouseClick);
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel);
        
        // Setup modal close button
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        // Create UI elements
        createHomeButton();
        createStreetViewButton();
        createNavigationHints();
        setupStreetViewControls();
        
        debugLog("Event listeners added");
        
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            debugLog("Loading screen hidden");
        }, 1000);
        
    } catch (error) {
        debugLog("Error: " + error.message);
        console.error(error);
        
        // Hide loading screen even if there's an error
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                '<div class="loading-content"><h2>Error Initializing</h2><p>' + error.message + '</p></div>';
        }
    }
}

// Make closeModal function global
window.closeModal = closeModal;

// Fallback: hide loading screen after 5 seconds regardless
setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        debugLog("Force hiding loading screen");
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}, 5000);

// Initialize function that can be called when ready
let appInitialized = false;
function initializeApp() {
    if (appInitialized) {
        console.log('App already initialized, skipping...');
        return;
    }
    
    debugLog("Initializing app...");
    
    // Check if libraries are loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded!');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                '<div class="loading-content"><h2>Error Loading Libraries</h2><p>Three.js failed to load. Please check your installation.</p></div>';
        }
        return;
    }
    
    if (typeof CANNON === 'undefined') {
        console.warn('CANNON.js library not loaded! Physics will be disabled, but the playground will still work.');
        // Don't return - allow the app to continue without physics
    }
    
    appInitialized = true;
    
    // Initialize the scene
    try {
        init();
        animate();
    } catch (error) {
        console.error('Error initializing app:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                '<div class="loading-content"><h2>Error Initializing</h2><p>' + error.message + '</p></div>';
        }
    }
}

// Initialize when DOM is ready or immediately if already loaded
(function() {
    let retryCount = 0;
    const maxRetries = 100; // 5 seconds max wait time
    
    function tryInit() {
        if (typeof THREE !== 'undefined') {
            initializeApp();
        } else if (retryCount < maxRetries) {
            // Three.js not loaded yet, wait and try again
            retryCount++;
            setTimeout(tryInit, 50);
        } else {
            // Timeout - show error
            console.error('Three.js failed to load after multiple attempts');
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = 
                    '<div class="loading-content"><h2>Error Loading Libraries</h2><p>Three.js failed to load. Please refresh the page.</p></div>';
            }
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        // DOM is already loaded
        tryInit();
    }
})();