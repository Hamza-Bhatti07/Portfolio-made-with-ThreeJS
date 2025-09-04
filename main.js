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

// Camera control variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let cameraDistance = 20;
let targetCameraPosition = { x: 0, y: 10, z: 20 };
let targetLookAt = { x: 0, y: 0, z: 0 };
let cameraLerpFactor = 0.05;

// Debug function to log errors
function debugLog(message) {
    console.log(message);
}

// Define all functions first
function createGround() {
    debugLog("Creating ground...");
    
    // Visual ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
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
    
    // Billboard stand
    const standGeometry = new THREE.BoxGeometry(1, 8, 1);
    const standMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(-10, 4, 0);
    stand.castShadow = true;
    stand.name = "billboard-stand";
    scene.add(stand);
    
    // Billboard panel
    const panelGeometry = new THREE.PlaneGeometry(10, 6);
    const panelMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(-7, 6, 0);
    panel.rotation.y = Math.PI / 2;
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
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(billboardText.name, 256, 80);
    context.font = '20px Arial';
    context.fillText(billboardText.title, 256, 120);
    context.font = '16px Arial';
    context.fillText(billboardText.subtitle, 256, 160);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-6.9, 6, 0);
    textMesh.rotation.y = Math.PI / 2;
    textMesh.name = "billboard-text";
    scene.add(textMesh);
    
    debugLog("Billboard created");
}

function createSwing() {
    debugLog("Creating swing...");
    
    const swingGroup = new THREE.Group();
    swingGroup.name = "swing-group";
    
    // Swing frame
    const frameGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftPole = new THREE.Mesh(frameGeometry, frameMaterial);
    leftPole.position.set(-1.5, 3, 0);
    leftPole.castShadow = true;
    leftPole.name = "swing-left-pole";
    swingGroup.add(leftPole);
    
    const rightPole = new THREE.Mesh(frameGeometry, frameMaterial);
    rightPole.position.set(1.5, 3, 0);
    rightPole.castShadow = true;
    rightPole.name = "swing-right-pole";
    swingGroup.add(rightPole);
    
    // Top bar
    const topBarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3.5);
    const topBar = new THREE.Mesh(topBarGeometry, frameMaterial);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 6, 0);
    topBar.castShadow = true;
    topBar.name = "swing-top-bar";
    swingGroup.add(topBar);
    
    // Swing seat
    const seatGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.5);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 2, 0);
    seat.castShadow = true;
    seat.name = "swing-seat";
    swingGroup.add(seat);
    
    // Chains
    const chainGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
    const chainMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    const leftChain = new THREE.Mesh(chainGeometry, chainMaterial);
    leftChain.position.set(-0.6, 4, 0);
    leftChain.name = "swing-left-chain";
    swingGroup.add(leftChain);
    
    const rightChain = new THREE.Mesh(chainGeometry, chainMaterial);
    rightChain.position.set(0.6, 4, 0);
    rightChain.name = "swing-right-chain";
    swingGroup.add(rightChain);
    
    swingGroup.position.set(0, 0, -10);
    scene.add(swingGroup);
    
    // Add to playground objects
    playgroundObjects.swing = {
        mesh: seat,
        group: swingGroup,
        type: 'swing',
        position: { x: 0, y: 2, z: -10 }
    };
    
    // Add physics to seat
    if (physicsEnabled && world) {
        try {
            const seatShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.05, 0.25));
            const seatBody = new CANNON.Body({ mass: 1 });
            seatBody.addShape(seatShape);
            seatBody.position.set(0, 2, -10);
            world.add(seatBody);
            
            // Constraints for swinging motion
            const constraint = new CANNON.PointToPointConstraint(
                seatBody, new CANNON.Vec3(-0.6, 2, 0),
                new CANNON.Body({ mass: 0 }), new CANNON.Vec3(-0.6, 6, -10)
            );
            world.add(constraint);
            
            const constraint2 = new CANNON.PointToPointConstraint(
                seatBody, new CANNON.Vec3(0.6, 2, 0),
                new CANNON.Body({ mass: 0 }), new CANNON.Vec3(0.6, 6, -10)
            );
            world.add(constraint2);
            
            seatBody.userData = { mesh: seat, type: 'swing' };
        } catch (e) {
            console.error("Error creating swing physics:", e);
            physicsEnabled = false;
        }
    }
    
    debugLog("Swing created");
}

function createSlide() {
    debugLog("Creating slide...");
    
    const slideGroup = new THREE.Group();
    slideGroup.name = "slide-group";
    
    // Slide structure
    const slideGeometry = new THREE.BoxGeometry(6, 0.2, 2);
    const slideMaterial = new THREE.MeshLambertMaterial({ color: 0x4ECDC4 });
    const slide = new THREE.Mesh(slideGeometry, slideMaterial);
    slide.rotation.z = -Math.PI / 6;
    slide.position.set(0, 3, 0);
    slide.castShadow = true;
    slide.name = "slide-surface";
    slideGroup.add(slide);
    
    // Slide sides
    const sideGeometry = new THREE.BoxGeometry(0.2, 2, 2);
    const leftSide = new THREE.Mesh(sideGeometry, slideMaterial);
    leftSide.position.set(-2.8, 2, 0);
    leftSide.rotation.z = -Math.PI / 6;
    leftSide.castShadow = true;
    leftSide.name = "slide-left-side";
    slideGroup.add(leftSide);
    
    const rightSide = new THREE.Mesh(sideGeometry, slideMaterial);
    rightSide.position.set(2.8, 2, 0);
    rightSide.rotation.z = -Math.PI / 6;
    rightSide.castShadow = true;
    rightSide.name = "slide-right-side";
    slideGroup.add(rightSide);
    
    // Ladder
    const ladderGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    const ladderMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftLadder = new THREE.Mesh(ladderGeometry, ladderMaterial);
    leftLadder.position.set(-0.5, 2, -1);
    leftLadder.name = "slide-left-ladder";
    slideGroup.add(leftLadder);
    
    const rightLadder = new THREE.Mesh(ladderGeometry, ladderMaterial);
    rightLadder.position.set(0.5, 2, -1);
    rightLadder.name = "slide-right-ladder";
    slideGroup.add(rightLadder);
    
    slideGroup.position.set(10, 0, 0);
    scene.add(slideGroup);
    
    playgroundObjects.slide = {
        mesh: slide,
        group: slideGroup,
        type: 'slide',
        position: { x: 10, y: 3, z: 0 }
    };
    
    debugLog("Slide created");
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
                if (objectType === 'swing') {
                    world.bodies.forEach(body => {
                        if (body.userData && body.userData.type === 'swing' && body.velocity) {
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
            if (objectType === 'swing') {
                animateSwing();
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
    
    // Update camera rotation based on mouse movement
    cameraRotation.y += deltaMove.x * 0.01;
    cameraRotation.x += deltaMove.y * 0.01;
    
    // Limit vertical rotation to prevent flipping
    cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraRotation.x));
    
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp(event) {
    isDragging = false;
}

function onWheel(event) {
    // Zoom in/out with mouse wheel
    cameraDistance += event.deltaY * 0.01;
    cameraDistance = Math.max(10, Math.min(40, cameraDistance));
}

function animateSwing() {
    const group = playgroundObjects.swing.group;
    let swingAngle = 0;
    let swingDirection = 1;
    let animationCount = 0;
    const maxAnimations = 50;
    
    const swingAnimation = setInterval(() => {
        swingAngle += 0.05 * swingDirection;
        if (Math.abs(swingAngle) > 0.5) swingDirection *= -1;
        
        if (group && group.children[3]) {
            group.children[3].position.x = Math.sin(swingAngle) * 3;
            group.children[3].position.y = 2 - Math.abs(swingAngle) * 0.8;
            group.children[3].rotation.z = swingAngle * 0.5;
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

function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Update camera position
        updateCamera();
        
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
        <div>🏠 Home Button: Reset View</div>
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
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
        
        // Create playground
        createGround();
        createBillboard();
        createSwing();
        createSlide();
        createSeesaw();
        createMerryGoRound();
        
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
        createNavigationHints();
        
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debugLog("DOM loaded, initializing...");
    
    // Check if libraries are loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded!');
        document.getElementById('loading-screen').innerHTML = 
            '<div class="loading-content"><h2>Error Loading Libraries</h2><p>Three.js failed to load. Please check your installation.</p></div>';
        return;
    }
    
    if (typeof CANNON === 'undefined') {
        console.error('CANNON.js library not loaded!');
        document.getElementById('loading-screen').innerHTML = 
            '<div class="loading-content"><h2>Error Loading Libraries</h2><p>CANNON.js failed to load. Please check your installation.</p></div>';
        return;
    }
    
    // Initialize the scene
    init();
    animate();
});