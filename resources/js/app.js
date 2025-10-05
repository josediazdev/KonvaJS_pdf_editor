/**
 * CANVAS.JS - PDF Manipulation with KonvaJS
 * ==============================================
 *
 * A complete system for loading, visually manipulating, and exporting PDFs.
 * It uses PDF.js for rendering and KonvaJS for interactive manipulation.
 *
 * Architecture: PDF → Temporary Canvas → Konva.Image → Manipulation → PDF Export
 *
 * Required Dependencies:
 * - PDF.js (as the global `pdfjsLib`)
 * - KonvaJS (as the global `Konva`)
 * - jsPDF (as the global `jsPDF`)
 * - A global variable `pdfBase64Data` containing the PDF data in Base64.
 * - A DOM element with the id 'save-pdf-btn'.
 *
 * Core Modules:
 * 1. PDF LOADING: Converts the Base64 data to a temporary canvas, then to a Konva.Image.
 *
 * 2. MANIPULATION: Adds interactive nodes (text, images) onto the canvas.
 * - Elements are draggable and editable.
 * - An HTML-based toolbar is used for content creation.
 * - Provides intuitive mouse and keyboard interaction.
 * 2.5. TEXT MANAGEMENT: Create, edit, and delete text elements.
 * 2.6. IMAGE MANAGEMENT: Upload, manipulate, and delete image elements.
 * 2.7. GLOBAL INTERACTION: Manages canvas events and editing modes.
 *
 * 3. EXPORTATION: Generates the final PDF using jsPDF.
 */

// =============================================================================
// INITIALIZATION AND MAIN CONFIGURATION
// =============================================================================

/**
 * SYSTEM'S MAIN CONFIGURATION
 * ===================================
 * Initializes KonvaJS, sets up the stage and layer, and coordinates module loading.
 */
// INITIALIZE MAIN STAGE AND LAYER
// Stage: The main container for the KonvaJS canvas.
// Layer: The layer where all graphical elements are drawn.


// Define virtual size for our scene (PDF dimensions)
const VIRTUAL_WIDTH = 918;
const VIRTUAL_HEIGHT = 1184;

// Initialize stage variable
let stage;
let layer;

// Function to fit stage into parent container
function fitStageIntoParentContainer() {
    const container = document.getElementById('konva-holder');
    if (!container || !stage) return;

    // Get container's computed size (respects max-width/height)
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate scale based on virtual size
    const scaleX = containerWidth / VIRTUAL_WIDTH;
    const scaleY = containerHeight / VIRTUAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to fit

    // Set stage dimensions to container size
    stage.width(containerWidth);
    stage.height(containerHeight);

    // Apply scale
    stage.scale({ x: scale, y: scale });

    console.log(`Stage resized: ${containerWidth}x${containerHeight}, scale: ${scale}`);
}

/// EVENT SYSTEM FOR COORDINATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initialize system...');


    // Create stage with virtual size initially
    stage = new Konva.Stage({
        container: 'konva-holder',
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
    });

    layer = new Konva.Layer();
    stage.add(layer);

    // Fit stage to container after creation
    fitStageIntoParentContainer();

    // Add resize listener
    window.addEventListener('resize', fitStageIntoParentContainer);

    console.log('width', stage.width());
    console.log('height', stage.height());


    // WAIT FOR DEPENDENCIES TO BE AVAILABLE
    // Use a Promise to wait for pdfBase64Data to be available/
    const checkDependencies = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (typeof window.pdfBase64Data !== 'undefined' && window.pdfBase64Data) {
                    resolve();
                } else {
                    // Retry in the next event loop cycle
                    setTimeout(check, 10);
                }
            };
            check();
        });
    };

    // INITIALIZE SYSTEM WHEN EVERYTHING IS READY/
    checkDependencies().then(() => {
        console.log('Dependencies verified, loading PDF...');
        loadPdfAsImage();
    });

    // CONFIGURE EXPORT SYSTEM/
    setupPdfExport();

    // CONFIGURE DE DRAG & DRO SYSTEM
    setupDragDrop();

    // CONFIGURE GLOBAL INTERACTION ON CANVAS
    setupCanvasInteraction();
});
// INITIALIZE ELEMENTS WHEN THE PDF IS LOADED
document.addEventListener('pdfLoaded', function() {
    console.log('PDF loaded successfully - Ready to edit');
    initializeElements();
});

// INITIALIZE ELEMENTS WHEN THE PDF IS LOADED
function initializeElements() {
    console.log('Starting elements in cavas...');
    // Initialize elements here
}

 // =============================================================================
// MODULE 1: LOADING THE PDF AS AN IMAGE IN KONVAJS
// =============================================================================

/**
 * MODULE 1: PDF LOADING AND CONVERSION
 * ====================================
 *
 * Converts a PDF (Base64) into a manipulable image within KonvaJS.
 * Process: Base64 → PDF.js → Temporary Canvas → HTML Image → Konva.Image
 *
 * This function handles the entire pipeline for converting the PDF into a format
 * that KonvaJS can manipulate like any other image.
 *
 *
 */
async function loadPdfAsImage() {

    // DEPENDENCY VALIDATION
    // Check that we have the PDF data in Base64
    if (typeof window.pdfBase64Data === 'undefined' || !window.pdfBase64Data) {
        console.log('There is no Base64 data available');
        return;
    }

    // Verify that PDF.js is globally available/
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js is not loaded ');
        return;
    }

    console.log('Converting PDF to image for KonvaJS...');

    try {
        // STEP 1: BASE64 DECODING
        // Convert Base64 string to binary data that PDF.js can process
        // atob() is the browser's native function for Base64 decoding
        const pdfData = atob(window.pdfBase64Data);

        // STEP 2: PDF DOCUMENT LOADING
        // PDF.js creates an asynchronous task to process the PDF
        // getDocument() returns a Promise that resolves with the PDF object
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        console.log('PDF loaded, total pages:', pdf.numPages);

        // STEP 3: GETTING THE FIRST PAGE
        // PDFs can have multiple pages, here we process only the first one
        // getPage(1) returns page 1 (numbering starts at 1, not 0)
        const page = await pdf.getPage(1);

        // STEP 4: VIEWPORT CONFIGURATION
        // The viewport defines rendering dimensions and scale
        // scale: 1 = original PDF size (no scaling)
        const viewport = page.getViewport({ scale: 2 });

        // STEP 5: TEMPORARY CANVAS CREATION
        // Create a temporary (non-visible) HTML5 canvas to render the PDF
        // This canvas exists only in memory during the conversion process
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');

        // Configure the temporary canvas dimensions according to the PDF viewport
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        // STEP 6: RENDERING THE PDF ON THE TEMPORARY CANVAS
        // PDF.js draws the PDF page onto the temporary canvas's 2D context
        // This converts the vectorial PDF into a rasterized bitmap
        await page.render({
            canvasContext: tempContext,
            viewport: viewport
        }).promise;

        console.log('PDF rendered in temporary canvas:', tempCanvas.width, 'x', tempCanvas.height);

        // STEP 7: CANVAS CONVERSION TO HTML IMAGE
        // Create a native browser <img> element
        const pdfImage = new Image();

        // STEP 8: CALLBACK WHEN THE IMAGE IS READY
        // This callback executes when the image is fully loaded
        pdfImage.onload = function() {
            console.log('PDF image ready to KonvaJS');

            // SCALE PDF IMAGE TO FIT VIRTUAL SIZE
            const scaleX = VIRTUAL_WIDTH / pdfImage.width;
            const scaleY = VIRTUAL_HEIGHT / pdfImage.height;
            const scale = Math.min(scaleX, scaleY); // Fit to virtual size

            // STEP 9: KONVA.IMAGE NODE CREATION
            // Convert the HTML image into a manipulable KonvaJS node
            const konvaPdfImage = new Konva.Image({
                x: 0,
                y: 0,
                image: pdfImage,
                width: pdfImage.width * scale, // Scale dimensions
                height: pdfImage.height * scale,
                listening: false,
                name: 'pdf-background'
            });

            // STEP 10: INTEGRATION INTO THE KONVAJS SCENE
            // Add the PDF as a background image to the layer
            layer.add(konvaPdfImage);

            // Ensure the PDF is always in the background (lowest z-index)
            konvaPdfImage.moveToBottom();

            // STEP 11: REDRAW THE SCENE
            // Force the rendering of all elements on the layer
            layer.draw();

            console.log('PDF integrated successfully into KonvaJS as an image');

            // UPDATE STATE IN THE HEADER
            const statusIndicator = document.getElementById('pdf-status');
            if (statusIndicator) {
                statusIndicator.textContent = 'PDF uploaded successfully';
                statusIndicator.style.color = '#48bb78';
            }

            // EMIT PDF LOADED EVENT
            // Notify other modules that the PDF is ready for manipulation
            document.dispatchEvent(new CustomEvent('pdfLoaded'));
        };

        // STEP 7 CONTINUED: ASSIGN IMAGE SOURCE
        // Convert the temporary canvas to a Base64 data URL
        // This automatically triggers the image's onload event
        pdfImage.src = tempCanvas.toDataURL();

    } catch (error) {
        // ERROR HANDLING
        // Catch any error during the conversion process
        // Common errors: Corrupt PDF, insufficient memory, network issues
        console.error('Error converting PDF to image:', error);

        const statusIndicator = document.getElementById('pdf-status');
        if (statusIndicator) {
            statusIndicator.textContent = 'Error loading PDF';
            statusIndicator.style.color = '#e53e3e';
        }

        alert('Error loading PDF, please try with other file.');
    }
}

// =============================================================================
// MODULE 2: ADDING MANIPULABLE NODES
// =============================================================================

/**
 * MODULE 2: VISUAL MANIPULATION - NODE ADDITION
 * ===================================================
 *
 * Adds interactive elements onto the PDF canvas.
 * Includes editable text, overlaid images, and other graphical elements.
 * All elements can be moved, rotated, scaled, and deleted.
 */


// =============================================================================
// MODULE 2.5: MANAGEMENT OF INTERACTIVE TEXT ELEMENTS
// =============================================================================

// =============================================================================
// MODULE 2.5: DRAG & DROP SYSTEM FROM SIDEBAR
// =============================================================================

/**
 * CONFIGURES THE DRAG & DROP SYSTEM FOR SIDEBAR ELEMENTS
 * ============================================================
 *
 * Allows elements to be dragged directly from the side panel onto the canvas.
 * Functionalities:
 * - Drag visual elements (text/image) from the sidebar
 * - Drop them onto the canvas to create interactive elements
 * - Auto-opens the file selector for images
 * - Provides visual feedback during the drag operation
 */

function setupDragDrop() {
    console.log('Setting up the drag & drop system...');

    // COUNTERS FOR UNIQUE ELEMENTS
    let textCounter = 0;
    let imageCounter = 0;

    // GET DRAGGABLE ELEMENTS
    const textDraggable = document.querySelector('.text-draggable');
    const imageDraggable = document.querySelector('.image-draggable');
    const imageInput = document.getElementById('image-input');
    const imageStatus = document.getElementById('image-status');

    if (!textDraggable || !imageDraggable) {
        console.error('Draggable elements not found');
        return;
    }

    // SET UP EVENTS FOR TEXT ELEMENTS
    textDraggable.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'text-element');
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
        console.log('Starting draggable of text element');
    });

    textDraggable.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        console.log('Ending draggable of text element');
    });

    // SET UP EVENTS FOR IMAGE ELEMENTS
    imageDraggable.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'image-element');
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
        console.log('Starting draggable of image element');
    });

    imageDraggable.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        console.log('Ending draggable of image element');
    });

    // SET UP EVENTS IN THE KONVAJS STAGE
    const stageContainer = stage.container();

    // PREVENT DEFAULT BEHAVIOR
    stageContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    // MANAGE ELEMENTS DROP
    stageContainer.addEventListener('drop', function(e) {
        e.preventDefault();

        const draggedType = e.dataTransfer.getData('text/plain');
        console.log('Element dropped:', draggedType);

        if (!draggedType) return;

        // CALCULATE RELATIVE POSITION TO CANVAS
        const stageBox = stageContainer.getBoundingClientRect();
        const scale = stage.scaleX(); // Considerar zoom si existe
        const x = (e.clientX - stageBox.left) / scale;
        const y = (e.clientY - stageBox.top) / scale;

        console.log(`DROP POSITION: (${x.toFixed(0)}, ${y.toFixed(0)})`);

        if (draggedType === 'text-element') {
            // CREATE TEXT ELEMENT
            const defaultText = 'add text...';
            createDraggableText(defaultText, x, y);
            textCounter++;

            console.log(`Text created by drag and drop: "${defaultText}" on (${x.toFixed(0)}, ${y.toFixed(0)})`);

        } else if (draggedType === 'image-element') {
            // OPEN FILE SELECTOR AFTER DROP
            if (imageInput) {
                imageStatus.textContent = '📂 Select an image...';
                imageStatus.style.color = '#fd7e14';

                imageInput.click();
                console.log('Opening file selector to image');
            } else {
                console.error('Image not found');
            }
        }
    });

    // SET UP EVENT LISTENER TO IMAGE (WHEN FILE IS SELECTED)
    if (imageInput && imageStatus) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];

            if (!file) {
                // User caceled selection
                imageStatus.textContent = '';
                // Reset input to reopen
                imageInput.value = '';
                console.log('Image selection canceled');
                return;
            }

            // VALIDATE FILE TYPE
            if (!file.type.startsWith('image/')) {
                imageStatus.textContent = '⚠️ Only images allow';
                // Resetear el input para futuras selecciones
                imageInput.value = '';
                alert('Please select an image file');
                return;
            }

            // VALIDATE SIZE (máximo 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                imageStatus.textContent = '⚠️ Image too large (máx. 5MB)';
                // Reset input for future selections
                imageInput.value = '';
                alert('The image is too large. Max 5MB allowed.');
                return;
            }

            imageStatus.textContent = '⏳ Processing image...';

            // PROCESS THE IMAGE
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;

                // Use a deafault position since we can't track the exact drop position for images
                const defaultX = 200 + (imageCounter * 60);
                const defaultY = 200 + (imageCounter * 40);

                createDraggableImage(imageUrl, file.name, defaultX, defaultY);
                imageCounter++;
                imageStatus.textContent = '✅ Image added: ' + file.name;
                // Reset the input for future selections
                imageInput.value = '';
                setTimeout(() => {
                    imageStatus.textContent = '';
                }, 3000);

                console.log(`Image created by drag and drop: "${file.name}" on (${defaultX}, ${defaultY})`);
            };

            reader.onerror = function() {
                imageStatus.textContent = '❌ Error loading the image';
                // Reset the input for future selections
                imageInput.value = '';
                console.error('Error reading the image file');
            };

            reader.readAsDataURL(file);
        });
    }

    console.log('Drag and drop system configured successfully');
}
/**
 * CREATES A DRAGGABLE AND EDITABLE TEXT ELEMENT
 * ============================================
 *
 * @param {string} text - The text to display.
 * @param {number} x - Initial X position.
 * @param {number} y - Initial Y position.
 *
 * Advanced Editing Features:
 * - Double-click opens the editor at the precise text position.
 * - Numeric control for font size (8-100px).
 * - Visually resizable textarea.
 * - Real-time size update.
 * - Maintains the original text's position and rotation.
 */

function createDraggableText(text, x = 100, y = 100) {
    // CREATE THE TEXT NODE ON KONVAJS
    const textNode = new Konva.Text({
        text: text,
        x: x,
        y: y,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        draggable: true,
        name: 'draggable-text',
        padding: 5,
        align: 'left'
    });

    // AGREGAR EFECTOS VISUALES PARA INTERACCIÓN
    // ADD VISUAL EFFECTS FOR INTERACTION
    // when hover
    textNode.on('mouseover', function() {
        document.body.style.cursor = 'move';
        this.fill('#007bff'); // Cambiar color
    });

    // Take off the cursor
    textNode.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.fill('#000000');
    });

    // EVENT: DOUBLE CLICK TO EDIT TEXT
    textNode.on('dblclick dbltap', function() {
        // CREATE TEMPORARY HTML CONTAINER FOR EDITION
        const textPosition = this.absolutePosition();

        // Calculate position precisely
        const stageBox = stage.container().getBoundingClientRect();
        const textHeight = this.height() * stage.scaleY();
        const visualY = textPosition.y * stage.scaleY();
        const spaceBelow = stageBox.height - (visualY + textHeight);
        const spaceAbove = visualY;

        // Place below if there's more space below, else above
        const yOffset = spaceBelow > spaceAbove ? textPosition.y + this.height() : textPosition.y;
        const areaPosition = {
            x: stageBox.left + textPosition.x * stage.scaleX() - 10, // Scale position
            y: stageBox.top + yOffset * stage.scaleY() + (spaceBelow > spaceAbove ? 2 : 0),   // Adjust offset
        };

        // Create main container for edition with horizontal layout
        const editContainer = document.createElement('div');
        editContainer.style.position = 'fixed'; // Use fixed to ensure viewport-relative positioning
        editContainer.style.left = areaPosition.x + 'px';
        editContainer.style.top = areaPosition.y + 'px';
        editContainer.style.zIndex = '1000';
        editContainer.style.display = 'flex';
        editContainer.style.alignItems = 'flex-start';
        editContainer.style.gap = '8px';
        document.body.appendChild(editContainer);

        // Create textare to edit text
        const textarea = document.createElement('textarea');
        textarea.value = this.text();
        textarea.className = 'text-edit-textarea'; // ← USAR CLASE CSS

        // Only configure dynamic properties
        const initialTextWidth = Math.max(this.width() - this.padding() * 2, 100);
        textarea.style.width = initialTextWidth + 'px';
        textarea.style.fontSize = this.fontSize() + 'px';
        textarea.style.fontFamily = this.fontFamily();
        textarea.style.textAlign = this.align();

        // Create size control (left size, without label)
        const sizeControl = document.createElement('div');
        sizeControl.style.display = 'flex';
        sizeControl.style.alignItems = 'center';
        sizeControl.style.justifyContent = 'center';
        sizeControl.style.width = '50px';
        sizeControl.style.height = '100%';

        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '8';
        sizeInput.max = '100';
        sizeInput.value = this.fontSize();
        sizeInput.style.width = '45px';
        sizeInput.style.padding = '2px';
        sizeInput.style.border = '1px solid #ccc';
        sizeInput.style.borderRadius = '3px';
        sizeInput.style.fontSize = '11px';
        sizeInput.style.textAlign = 'center';

        sizeControl.appendChild(sizeInput);

        // Add elements to the container
        editContainer.appendChild(sizeControl);
        editContainer.appendChild(textarea);

        // Rotate the container if text is rotated
        const rotation = this.rotation();
        if (rotation) {
            editContainer.style.transform = 'rotateZ(' + rotation + 'deg)';
            editContainer.style.transformOrigin = 'left top';
        }

        // Select all the text
        textarea.focus();
        textarea.select();

        // FUNCTION TO MEASURE THE REAL TEXT WIDTH
        const measureTextWidth = (text, fontSize, fontFamily) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = `${fontSize}px ${fontFamily}`;
            return ctx.measureText(text).width;
        };

        // FUNCTION TO AUTO-RESIZE HORIZONTAL TEXTAREA
        const autoResizeTextarea = () => {
            const textWidth = measureTextWidth(textarea.value, this.fontSize(), this.fontFamily());
            const padding = 10; // Padding extra para comodidad
            const newWidth = Math.max(Math.min(textWidth + padding + 20, 400), 100); // Entre 100px y 400px

            textarea.style.width = newWidth + 'px';
        };

        // Apply auto-resize when starting
        autoResizeTextarea();

        // FUNCTIONS TO UPDATE SIZE
        const updateFontSize = () => {
            const newSize = parseInt(sizeInput.value);
            if (newSize >= 8 && newSize <= 100) {
                this.fontSize(newSize);
                textarea.style.fontSize = newSize + 'px';
                layer.draw();
                // Re-apply auto-resize with new font
                setTimeout(autoResizeTextarea, 0);
            }
        };

        // Event to change size
        sizeInput.addEventListener('input', updateFontSize);
        sizeInput.addEventListener('change', updateFontSize);

        // Event to auto-resize the textarea while writing
        textarea.addEventListener('input', autoResizeTextarea);

        // FUNCTIONS TO FINALIZE EDITION
        const removeEditContainer = () => {
            document.body.removeChild(editContainer);
            window.removeEventListener('click', handleOutsideClick);
            this.hide(); //Hide text temporarily
        };

        // When press Enter or Escape
        const handleKeyDown = (e) => {
            if (e.keyCode === 13 && !e.shiftKey) { // Enter (sin shift para nueva línea)
                this.text(textarea.value);
                updateFontSize(); // Apply last size change
                removeEditContainer();
                this.show(); // Show updated text
            }
            if (e.keyCode === 27) { // Escape
                removeEditContainer();
                this.show(); // Show text without changes
            }
        };

        // When clicking outside the container
        const handleOutsideClick = (e) => {
            if (!editContainer.contains(e.target)) {
                this.text(textarea.value);
                updateFontSize(); // Apply the last change
                removeEditContainer();
                this.show();
            }
        };

        // Configure event listeners
        textarea.addEventListener('keydown', handleKeyDown);
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        // Actualizar tamaño del textarea cuando se redimensiona
        // Update the size of textarea when is redimentionated
        let resizeObserver;
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                // Here we could adjus the text size base on the testarea size
                // For now we keep the manual control
            });
            resizeObserver.observe(textarea);
        }
    });

    // EVENT: PRESS DELETE TO ELIMINATE
    textNode.on('keydown', function(event) {
        if (event.keyCode === 46 || event.keyCode === 8) { // Delete or Backspace
            this.destroy(); // Eliminate element
            layer.draw(); // Re-draw layer
        }
    });

    // ENABLE EVENT KEYBOARD LISTENING
    textNode.on('focus', function() {
        // When the element has focus, listen keys
        document.addEventListener('keydown', handleKeyDown);
    });

    textNode.on('blur', function() {
        // Cuando pierde focus, dejar de escuchar
        // When loss foco, stop listening
        document.removeEventListener('keydown', handleKeyDown);
    });

    // Auxiliar function to manage keys
    const handleKeyDown = (event) => {
        if (event.keyCode === 46 || event.keyCode === 8) { // Delete or Backspace
            textNode.destroy();
            layer.draw();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };

    // ADD THE TEXT TO LAYER AND RE-DRAW
    layer.add(textNode);
    layer.draw();

    console.log(`Text created: "${text}" on position (${x}, ${y})`);
}
// =============================================================================
// MODULE 2.6: INTERACTIVE IMAGE ELEMENT MANAGEMENT
// =============================================================================

/**
 * SETS UP THE IMAGE UPLOAD AND MANIPULATION SYSTEM
 * ================================================
 *
 * Allows users to upload images from local files and creates draggable
 * and resizable elements on the canvas.
 * Features:
 * - Upload images using a file input
 * - Drag elements across the canvas
 * - Resize using visual transformers/handles
 * - Delete elements using the Delete key
 * - Automatic positioning to prevent overlap
 */

function setupImageControls() {
    // Obtain the references to the other elements on the DOM
    const addImageBtn = document.getElementById('add-image-btn');
    const imageInput = document.getElementById('image-input');
    const imageStatus = document.getElementById('image-status');

    if (!addImageBtn || !imageInput || !imageStatus) {
        console.error('Control elements of image not found on the DOM');
        return;
    }

    // COUNTER TO NAME THE ELEMENTS UNIQUELY
    let imageCounter = 0;

    // EVENT LISTENER: OPEN FILE SELECTOR
    addImageBtn.addEventListener('click', function() {
        imageInput.click(); // Simulate click on input file hided
    });

    // EVENT LISTENER: PROCESS SELECTED FILE
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (!file) {
            imageStatus.textContent = 'File not selected';
            return;
        }

        // VALIDATE FILE TYPE
        if (!file.type.startsWith('image/')) {
            imageStatus.textContent = '⚠️ Only images allowed';
            alert('Please select an valid image file');
            return;
        }

        // VALIDATE SIZE (Max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            imageStatus.textContent = '⚠️ Image too large (máx. 5MB)';
            alert('The image is too large. Max 5MB allowed');
            return;
        }

        imageStatus.textContent = '⏳ Proccesing image...';

        // PROCESS THE IMAGE
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            createDraggableImage(imageUrl, file.name, 150 + (imageCounter * 50), 150 + (imageCounter * 30));
            imageCounter++;
            imageStatus.textContent = '✅ Image added: ' + file.name;
            setTimeout(() => {
                imageStatus.textContent = '';
            }, 3000);
        };

        reader.onerror = function() {
            imageStatus.textContent = '❌ Error loading the image';
            console.error('Error while reading the image file');
        };

        reader.readAsDataURL(file);
    });

    console.log('Constrol system of images configured');
}

/**
 * SETS UP THE GLOBAL CANVAS INTERACTION SYSTEM
 * ===========================================
 *
 * Handles global events, such as clicks on empty areas, to
 * deactivate the editing modes of interactive elements.
 */

function setupCanvasInteraction() {
    // EVENT: CLICK ON SEVERAL VOID AREAS DEACTIVATE ALL THE TRANSFORMERS
    stage.on('click tap', function(e) {
        // If the click was on an image, do not do anything (let the event manage itself)
        if (e.target !== stage && e.target.name() !== 'pdf-background') {
            // The click was on an element (like an image), do not do anything
            return;
        }

        // The click was on the stage or the background (void area)
        // REMOVE ALL THE ACTIVE TRANSFORMERS
        layer.find('Transformer').forEach(transformer => {
            transformer.destroy();
        });
        layer.draw();

        console.log('Edition mode deactivated - transformers removed');
    });

    console.log('Interaction global system of canvas configured');
}
/**
 * CREATES A DRAGGABLE AND RESIZABLE IMAGE ELEMENT
 * ===============================================
 *
 * @param {string} imageUrl - Image data URL (base64)
 * @param {string} fileName - Original file name
 * @param {number} x - Initial X position
 * @param {number} y - Initial Y position
 */

function createDraggableImage(imageUrl, fileName, x = 150, y = 150) {
    // CREATE HTML ELEMENT IMAGE TO MEASURE DIMENTIONS
    const img = new Image();

    img.onload = function() {
        // CALCULATE MAX DIMENTIONS TO AVOID IMAGES TOO LARGE
        const maxWidth = 400;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        // SCALE IF NECESSARY
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        // CREATE IMAGE NODE ON KONVAJS
        const imageNode = new Konva.Image({
            x: x,
            y: y,
            image: img,
            width: width,
            height: height,
            draggable: true,
            name: 'draggable-image',
            id: 'image-' + Date.now() // ID único
        });

        // ADD VISUAL EFFECTS FOR THE INTERACTION
        // While hover
        imageNode.on('mouseover', function() {
            document.body.style.cursor = 'move';
            // Add soft border
            this.stroke('#007bff');
            this.strokeWidth(2);
            layer.draw();
        });

        // When taking off the cursor
        imageNode.on('mouseout', function() {
            document.body.style.cursor = 'default';
            this.stroke(null);
            this.strokeWidth(0);
            layer.draw();
        });

        // EVENT: DOUBLE CLICK TO ACTIVATE TRANSFORMER
        imageNode.on('dblclick dbltap', function() {
            // REMOVE EXISTING TRANSFORMERS
            layer.find('Transformer').forEach(transformer => transformer.destroy());

            // CREATE NEW TRANSFORMER FOR THIS IMAGE
            const transformer = new Konva.Transformer({
                node: imageNode,
                enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center'],
                rotateEnabled: true,
                borderEnabled: true,
                borderStroke: '#007bff',
                borderStrokeWidth: 2,
                anchorFill: '#ffffff',
                anchorStroke: '#007bff',
                anchorStrokeWidth: 2,
                anchorSize: 8
            });

            layer.add(transformer);
            layer.draw();

            // SAVE REFERENCE WHEN TRANSFORMING
            imageNode.transformer = transformer;
        });

        // EVENT: PRESS DELETE TO ELIMINATE
        imageNode.on('keydown', function(event) {
            if (event.keyCode === 46 || event.keyCode === 8) { // Delete o Backspace
                // Remove transformer if exists
                if (this.transformer) {
                    this.transformer.destroy();
                }
                this.destroy(); // Eliminate the image
                layer.draw(); // Re-draw the layer
            }
        });

        // ENABLE KEYBOARD EVENTS LISTENING
        imageNode.on('focus', function() {
            document.addEventListener('keydown', handleKeyDown);
        });

        imageNode.on('blur', function() {
            document.removeEventListener('keydown', handleKeyDown);
        });

        // Auxiliar function to manage keys
        const handleKeyDown = (event) => {
            if (event.keyCode === 46 || event.keyCode === 8) { // Delete or Backspace
                if (imageNode.transformer) {
                    imageNode.transformer.destroy();
                }
                imageNode.destroy();
                layer.draw();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };

        // EVENT: WHEN FINISH DRAGGING, REMOVE THE TRANSFORMER IF IS NOT SELECTED
        imageNode.on('dragend', function() {
            // Optional: remove transformer when finish dragging
            // For now we keep it, so the user can keep redimentionating
        });

        // ADD THE IMAGE TO THE LAYER AND RE-DRAW
        layer.add(imageNode);
        layer.draw();

        console.log(`Image created: "${fileName}" (${width}x${height}px) on position (${x}, ${y})`);
    };

    img.onerror = function() {
        console.error('Error while loading the image:', fileName);
        alert('Error while loading the image. Try with other file.');
    };

    // ESTABLISH THE IMAGE SOURCE
    img.src = imageUrl;
}




// =============================================================================
// MODULE 3: EXPORT TO PDF USING JSPDF
// =============================================================================

/**
 * MODULE 3: FINAL PDF EXPORT
 * ================================
 *
 * Converts the complete KonvaJS scene (manipulated PDF + added elements)
 * into a downloadable PDF file using the jsPDF library.
 *
 * Process: Separate Text → Separate Images → Rasterize Scene → Combine into PDF
 *
 * ADVANCED PROCESSING:
 * - Text: Processed individually with font, size, and rotation
 * - Images: Processed individually with scaling, rotation, and transformation
 * - Complete Scene: Rendered as a background image with a high pixelRatio
 */

function setupPdfExport() {
    // Get reference to the export button from the DOM
    const saveButton = document.getElementById('save-pdf-btn');

    if (!saveButton) {
        console.error('Save button PDF not found on the DOM');
        return;
    }

    // CONFIGURE EVENT LISTENER FOR EXPORT
    saveButton.addEventListener('click', function (event) {
        event.preventDefault();
        console.log('Initialize PDF exportation...');

        // DEPENDENCY VALIDATION
        if (typeof jsPDF === 'undefined') {
            console.error('jsPDF is not loaded');
            alert('Error: jsPDF library is not available');
            return;
        }

        try {
            // STEP 1: JSPDF INITIALIZATION
            // Create PDF document with landscape orientation ('l'), units in pixels ('px')
            // Dimensions based on the KonvaJS stage

            const pageOrientation = stage.width() > stage.height() ? 'l' : 'p';

            const pdf = new jsPDF(pageOrientation, 'px', [stage.width(), stage.height()]);

            // Configure default text color
            pdf.setTextColor('#000000');

            // STEP 2: EXPORT TEXT SEPARATELY
            // KonvaJS does not natively export text to PDF, so we process each Text node
            console.log('Exportando textos...');

            // stage.find('Text') finds all Konva.Text type nodes in the scene
            stage.find('Text').forEach((textNode) => {
                // UNIT CONVERSION
                // jsPDF uses points (1/72 inch), Konva uses pixels
                // Approximate conversion factor: 1px ≈ 0.75pt
                const fontSizeInPoints = textNode.fontSize() / 0.75;
                pdf.setFontSize(fontSizeInPoints);
                // EXTRACT NODE PROPERTIES
                const textContent = textNode.text();
                const x = textNode.x();
                const y = textNode.y();

                // ROTATION HANDLING
                // jsPDF uses positive rotation in a clockwise direction
                // KonvaJS uses positive rotation in a counter-clockwise direction
                // getAbsoluteRotation() gets the total rotation including ancestors

                const rotation = -textNode.getAbsoluteRotation();

                // ADD TEXT TO PDF
                // baseline: 'top' ensures correct positioning from the top edge

                pdf.text(textContent, x, y, {
                    baseline: 'top',
                    angle: rotation,
                });
            });

            // STEP 2.5: EXPORT IMAGES SEPARATELY
            // Images also require individual processing to preserve rotation and scaling
            console.log('Exporting images...');

            // stage.find('Image') finds all Konva.Image type nodes in the scene
            // We exclude the PDF background image (which has name: 'pdf-background')
            stage.find('Image').forEach((imageNode) => {
                // SALTAR LA IMAGEN DE FONDO DEL PDF
                if (imageNode.name() === 'pdf-background') {
                    return; // Continue with the next image
                }

                try {
                    // EXTRACT NODE PROPERTIES
                    const x = imageNode.x();
                    const y = imageNode.y();
                    const width = imageNode.width();
                    const height = imageNode.height();

                    // ROTATION AND SCALE HANDLING
                    // getAbsoluteRotation() gets the total rotation including ancestors
                    const rotation = imageNode.getAbsoluteRotation();
                    const scaleX = imageNode.scaleX();
                    const scaleY = imageNode.scaleY();

                    // CALCULATE SCALED DIMENSIONS
                    const scaledWidth = width * scaleX;
                    const scaledHeight = height * scaleY;

                    // CONVERT IMAGE TO BASE64
                    // Use toDataURL() on the underlying HTML Image element
                    const imageElement = imageNode.image();
                    if (imageElement && imageElement.toDataURL) {
                        const imageDataURL = imageElement.toDataURL('image/png');

                        // ADD IMAGE TO PDF
                        // jsPDF handles rotation and scaling automatically
                        pdf.addImage(
                            imageDataURL,     // Image Base64 format
                            'PNG',
                            x,
                            y,
                            scaledWidth,
                            scaledHeight,
                            undefined,
                            'FAST'
                        );

                        // APPLY ROTATION IF NECESSARY
                        if (rotation !== 0) {


                            // jsPDF rotates positive clockwise
                            // KonvaJS rotates positive counter-clockwise
                            const pdfRotation = -rotation;

                            // Calculate the center of rotation
                            const centerX = x + scaledWidth / 2;
                            const centerY = y + scaledHeight / 2;

                            // Apply rotation around the center
                            pdf.text('', centerX, centerY, {
                                angle: pdfRotation
                            });
                        }

                        console.log(`Image exported: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}px on (${x.toFixed(0)}, ${y.toFixed(0)})`);
                    }
                } catch (imageError) {
                    console.warn('Error while processing the individual image:', imageError);
                    // Continue with other images
                }
            });

            // STEP 3: EXPORT COMPLETE SCENE AS IMAGE
            console.log('Exporting stage as an image...');


            // stage.toDataURL() converts the entire KonvaJS canvas to a Base64 image
            // pixelRatio: 2 doubles the resolution for retina/high-density displays
            const canvasDataURL = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'  // PNG format by default
            });

            const DPI_FACTOR = 1.3333;

            // ADD IMAGE TO PDF
            // Position (0,0) covers the entire PDF page
            pdf.addImage(
                canvasDataURL,     // backgruond image Base64 format
                'PNG',
                0,
                0,
                stage.width()/DPI_FACTOR,
                stage.height()/DPI_FACTOR
            );

            // STEP 4: FILE DOWNLOAD
            // Show save file dialog to the user
            pdf.save('canvas.pdf');

            console.log('PDF exported successfully');

        } catch (error) {
            console.error('Error while the PDF exportation:', error);
            alert('Error when exporting PDF: ' + error.message);
        }
    });

    console.log('PDF exportation system configured');
}
