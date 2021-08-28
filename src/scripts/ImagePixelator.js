import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { WEBGL } from 'three/examples/jsm/WebGL';
import { DragDrop } from './utils/DragDrop';

import BallImage from '../images/ball.png';
import DropImage from '../images/dropImage.png';

export var Pixelator = {};

//Contains most of DOM manipulation for program
Pixelator.dom = (function () {
    "use strict";

    function addAuthorDiv(author, container) {
        var authorDiv, authorText;

        //Make sure parameter supports appropriate methods
        if (!container.appendChild) {
            console.log("authorDiv - parameter not correct");
            return;
        }

        //Check for DOM compatability
        if (!document.createElement || !document.createTextNode) {
            console.log("authorDiv - Browser does not support DOM methods");
            return;
        }

        //Create components
        authorDiv = document.createElement("div");
        authorText = document.createTextNode("By: " + author);

        //Style the div
        authorDiv.style.position = "absolute";
        authorDiv.style.width = "8em";
        authorDiv.style.opacity = "0.9";
        authorDiv.style.zIndex = "10001";
        authorDiv.style.right = "0px"; //position in bottom right
        authorDiv.style.bottom = "0px";
        authorDiv.style.color = "#228b22"; //forest green
        authorDiv.style.textAlign = "center";

        //Add to container
        authorDiv.appendChild(authorText);
        container.appendChild(authorDiv);
    }

    function addParticleDiv(container) {
        var particleDiv, particleText;

        //Make sure parameter supports appropriate methods
        if (!container.appendChild) {
            console.log("particleCountDiv - parameter not correct");
            return;
        }

        //Check for DOM compatability
        if (!document.createElement || !document.createTextNode) {
            console.log("particleCountDiv - Browser does not support DOM methods");
            return;
        }

        //Create components
        particleDiv = document.createElement("div");
        particleText = document.createTextNode("Particle Count: 0");

        //Give div an id to be able to be updated later
        particleDiv.setAttribute("id", "particleCount");

        //Style the div
        particleDiv.style.position = "absolute";
        particleDiv.style.width = "8em";
        particleDiv.style.opacity = "0.9";
        particleDiv.style.zIndex = "10001";
        particleDiv.style.right = "0px"; //position in top right
        particleDiv.style.top = "0px";
        particleDiv.style.color = "#228b22"; //forest green
        particleDiv.style.textAlign = "center";

        //Add to container
        particleDiv.appendChild(particleText);
        container.appendChild(particleDiv);
    }

    return {
        addAuthorDiv: addAuthorDiv,
        addParticleDiv: addParticleDiv
    };
}());

//Contains all game logic
Pixelator.game = (function () {
    "use strict";
    // Game Variables
    var camera,
        scene,
        renderer,
        //Texture
        particleTexture,
        // Pariticle System
        particles,
        //Drop Image
        dropImage,
        //Particle System Limits
        DEPTH = -500,
        DIFF_DEPTH = -150,
        //Dimensions of canvas, adjust with browser window
        WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight,
        //Projection variables
        fov = 80,
        aspect = WIDTH / HEIGHT,
        near = 1,
        far = 4000,
        //Used to display program statistics
        stats,
        SPREAD = 1,
        CANVAS_WIDTH = 600,
        CANVAS_HEIGHT = 600,
        MAX_RADIUS = 20;
    var loader = new THREE.TextureLoader();

    //checks window size and adjusts canvas size appropriately
    function adjustSize() {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;

        aspect = WIDTH / HEIGHT;

        renderer.setSize(WIDTH, HEIGHT);

        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }

    //Adds drop image here, image to page
    function dropScreen() {
        loader.load(
            // resource URL
            DropImage,
            // 'images/dropImage.png',
            // Function when resource is loaded
            function (texture) {
                var material = new THREE.MeshBasicMaterial({
                    map: texture
                }),
                    width = texture.image.width,
                    height = texture.image.height,
                    geometry = new THREE.BoxGeometry(width, height, 0); //2d surface for picture

                dropImage = new THREE.Mesh(geometry, material);
                dropImage.position.z = DEPTH;

                scene.add(dropImage);
            },
            // Function called when download progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Function called when download errors
            function (xhr) {
                console.log('An error happened');
            });
    }

    //Updates the particles
    function updateParticles(time) {
        // var radius, ratio, particleList = particles.geometry.vertices,
        //     numParticles = particleList.length, i, p;

        //rotate entire particle system
        particles.rotation.y += 0.01;

        //circular motion
        //radius * Math.sin(time / ratio)
        //radius * Math.cos(time / ratio)
        //add radius and ratio properties to particles
        /*
        for (i = 0; i < numParticles; i += 1) {
            p = particleList[i];

            //Get particle motion properties
            radius = p.radius;
            ratio = p.ratio;

            //Update motion
            p.x += radius * Math.sin(time / ratio);
            p.y += radius * Math.cos(time / ratio);
        }
        */
    }

    // the animation loop
    function animate(canvas) {
        //Request next animation
        window.requestAnimationFrame(animate);

        //update particle system if it exists
        if (particles) {
            updateParticles(new Date().getTime());
        }

        // and render the scene from the perspective of the camera
        renderer.render(scene, camera);

        /* Stats */
        stats.update();
    }

    function makeParticles(image) {
        var vX, vY, vZ, material, x, y, p, r, g, b, color,
            //Holds the particles and colors
            geometry = new THREE.BufferGeometry(),
            width = CANVAS_WIDTH * 4, //width of canvas as pixel array
            pixels = image.pixels,
            spread = SPREAD * 4, //spread in terms of pixel array, 4 entries per pixel
            halfW = CANVAS_WIDTH / 2,
            halfH = CANVAS_HEIGHT / 2,
            //Variables to update particle count div
            particleCount = document.getElementById("particleCount"),
            numParticles = 0;
        const positions = [];
        const colors = [];

        //Delete particle system if already defined
        if (particles) {
            scene.remove(particles);
            particles = null; //reset
        } else { //no particle system, remove drop image
            scene.remove(dropImage);
            dropImage = null;
        }

        //SPREAD skips rows, spread skips columns
        //Go through image pixels, row by row, starting from top
        for (y = CANVAS_HEIGHT; y >= 0; y -= SPREAD) {
            for (x = 0; x < width; x += spread) {
                //Get start of particle entries - (r, g, b, a)
                p = (CANVAS_HEIGHT - y) * width + x;

                // grab the actual data from the
                // pixel, ignoring any transparent ones
                if (pixels[p + 3] > 0) {
                    //RGB values for THREE.js must be between 0 and 1
                    r = pixels[p] / 255;
                    g = pixels[p + 1] / 255;
                    b = pixels[p + 2] / 255;

                    //Initialize particle variables
                    color = new THREE.Color().setRGB(r, g, b);

                    //Set Particle Position
                    vX = (x / 4) - halfW; // (x / 4) = distance from left of image
                    vY = y - halfH;
                    //vZ = 0;	//relative to particle system
                    vZ = ((r + g + b) / 3) * DIFF_DEPTH;

                    positions.push(vX);
                    positions.push(vY);
                    positions.push(vZ);

                    colors.push(color.r, color.g, color.b);

                    //Particle added
                    numParticles += 1;
                }
            }
        }

        // Ripped this code from:
        // https://github.com/mrdoob/three.js/blob/e62b253081438c030d6af1ee3c3346a89124f277/examples/webgl_buffergeometry_custom_attributes_particles.html#L115
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        //Create Particle System Material
        material = new THREE.PointsMaterial({
            size: SPREAD * 1.5,
            map: particleTexture,
            vertexColors: true
        });

        //Create Particle System
        particles = new THREE.Points(geometry, material);

        //Position the system
        particles.position.x = 0;
        particles.position.y = 0;
        particles.position.z = DEPTH;

        //add Particle System to the scene
        scene.add(particles);

        //Update Particle Count Div
        particleCount.textContent = "Particle Count: " + numParticles;
    }

    function init() {
        var container, canvas;

        //Check browser for DOM compatability
        if (!document.createElement || !document.getElementById) {
            console.log("init - browser does not support DOM methods");
            return;
        }

        //Check for WebGL Compatability
        if (!WEBGL.isWebGLAvailable()) {
            document.body.appendChild(WEBGL.getWebGLErrorMessage());
            return;
        }

        //Create the canvas container and add to body
        container = document.createElement("div");
        document.body.appendChild(container);

        // the scene contains all the 3D object data
        scene = new THREE.Scene();

        // Camera params : field of view, aspect ratio for render output, near and far clipping planes. 
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        // camera needs to go in the scene 
        scene.add(camera);

        //Load particle texture
        loader.load(
            // resource URL
            BallImage,
            // 'images/ball.png',
            // Function when resource is loaded
            function (texture) {
                // do something with the texture
                particleTexture = texture;
                // add DragDrop capabilities for images
                DragDrop.pixInit(makeParticles, CANVAS_WIDTH, CANVAS_HEIGHT);
            },
            // Function called when download progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Function called when download errors
            function (xhr) {
                console.log('An error happened');
            });

        // add listeners
        window.addEventListener("resize", adjustSize, false);

        //add drop file images
        dropScreen();

        /* Stats */
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.bottom = '0px';
        stats.domElement.style.left = '0px';
        container.appendChild(stats.domElement);

        //add Author Div
        Pixelator.dom.addAuthorDiv("Richie Casto", container);

        //add Particle Count Div
        Pixelator.dom.addParticleDiv(container);

        //Create WebGLRenderer
        renderer = new THREE.WebGLRenderer({
            clearAlpha: 1
        });
        renderer.setSize(WIDTH, HEIGHT);

        // the renderer's canvas domElement is added to the canvas container
        canvas = renderer.domElement;
        container.appendChild(canvas);

        //Start the animation loop
        window.requestAnimationFrame(animate);
    }

    return {
        init: init
    };
}());