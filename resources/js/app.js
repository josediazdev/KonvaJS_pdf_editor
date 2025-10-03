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


const stage = new Konva.Stage({
    height: window.innerHeight,
    width: window.innerWidth,
    container: "konva-holder",
});

const layer = new Konva.Layer();
stage.add(layer);

/// EVENT SYSTEM FOR COORDINATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando sistema...');

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
        console.log('Dependencias verificadas, cargando PDF...');
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
    console.log('PDF cargado exitosamente - listo para edición');
});



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
        console.log('No hay datos Base64 del PDF disponibles');
        return;
    }

    // Verify that PDF.js is globally available/
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js no está cargado');
        return;
    }

    console.log('Convirtiendo PDF a imagen para KonvaJS...');

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

        console.log('PDF cargado, total páginas:', pdf.numPages);

        // STEP 3: GETTING THE FIRST PAGE
        // PDFs can have multiple pages, here we process only the first one
        // getPage(1) returns page 1 (numbering starts at 1, not 0)
        const page = await pdf.getPage(1);

        // STEP 4: VIEWPORT CONFIGURATION
        // The viewport defines rendering dimensions and scale
        // scale: 1 = original PDF size (no scaling)
        const viewport = page.getViewport({ scale: 1 });

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

        console.log('PDF renderizado en canvas temporal:', tempCanvas.width, 'x', tempCanvas.height);

        // STEP 7: CANVAS CONVERSION TO HTML IMAGE
        // Create a native browser <img> element
        const pdfImage = new Image();

        // STEP 8: CALLBACK WHEN THE IMAGE IS READY
        // This callback executes when the image is fully loaded
        pdfImage.onload = function() {
            console.log('Imagen del PDF lista para KonvaJS');

            // ADJUST STAGE DIMENSIONS
            // The KonvaJS stage must have the same dimensions as the PDF image
            // so that the content displays correctly
            stage.width(pdfImage.width);
            stage.height(pdfImage.height);

            // STEP 9: KONVA.IMAGE NODE CREATION
            // Convert the HTML image into a manipulable KonvaJS node
            const konvaPdfImage = new Konva.Image({
                x: 0,
                y: 0,
                image: pdfImage,
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

            console.log('PDF integrado exitosamente en KonvaJS como imagen');

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
        console.error('Error al convertir PDF a imagen:', error);

        const statusIndicator = document.getElementById('pdf-status');
        if (statusIndicator) {
            statusIndicator.textContent = 'Error al cargar PDF';
            statusIndicator.style.color = '#e53e3e';
        }

        alert('Error al cargar el PDF. Por favor, intenta con otro archivo.');
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
    console.log('Configurando sistema de drag & drop...');

    // CONTADORES PARA ELEMENTOS ÚNICOS
    let textCounter = 0;
    let imageCounter = 0;

    // OBTENER ELEMENTOS ARRASTRABLES
    const textDraggable = document.querySelector('.text-draggable');
    const imageDraggable = document.querySelector('.image-draggable');
    const imageInput = document.getElementById('image-input');
    const imageStatus = document.getElementById('image-status');

    if (!textDraggable || !imageDraggable) {
        console.error('Elementos arrastrables no encontrados');
        return;
    }

    // CONFIGURAR EVENTOS PARA ELEMENTO DE TEXTO
    textDraggable.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'text-element');
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
        console.log('Iniciando arrastre de elemento texto');
    });

    textDraggable.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        console.log('Finalizando arrastre de elemento texto');
    });

    // CONFIGURAR EVENTOS PARA ELEMENTO DE IMAGEN
    imageDraggable.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'image-element');
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
        console.log('Iniciando arrastre de elemento imagen');
    });

    imageDraggable.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        console.log('Finalizando arrastre de elemento imagen');
    });

    // CONFIGURAR EVENTOS EN EL STAGE DE KONVAJS
    const stageContainer = stage.container();

    // PREVENIR COMPORTAMIENTO POR DEFECTO
    stageContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    // MANEJAR LA CAÍDA DE ELEMENTOS
    stageContainer.addEventListener('drop', function(e) {
        e.preventDefault();

        const draggedType = e.dataTransfer.getData('text/plain');
        console.log('Elemento soltado:', draggedType);

        if (!draggedType) return;

        // CALCULAR POSICIÓN RELATIVA AL CANVAS
        const stageBox = stageContainer.getBoundingClientRect();
        const scale = stage.scaleX(); // Considerar zoom si existe
        const x = (e.clientX - stageBox.left) / scale;
        const y = (e.clientY - stageBox.top) / scale;

        console.log(`Posición de caída: (${x.toFixed(0)}, ${y.toFixed(0)})`);

        if (draggedType === 'text-element') {
            // CREAR ELEMENTO DE TEXTO
            const defaultText = 'add text...';
            createDraggableText(defaultText, x, y);
            textCounter++;

            console.log(`Texto creado por drag & drop: "${defaultText}" en (${x.toFixed(0)}, ${y.toFixed(0)})`);

        } else if (draggedType === 'image-element') {
            // ABRIR SELECTOR DE ARCHIVOS INMEDIATAMENTE AL SOLTAR
            if (imageInput) {
                imageStatus.textContent = '📂 Selecciona una imagen...';
                imageStatus.style.color = '#fd7e14';

                // Abrir selector de archivos
                imageInput.click();
                console.log('Abriendo selector de archivos para imagen');
            } else {
                console.error('Input de imagen no encontrado');
            }
        }
    });

    // CONFIGURAR EVENT LISTENER PARA IMAGEN (CUANDO SE SELECCIONA ARCHIVO)
    if (imageInput && imageStatus) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];

            if (!file) {
                // Usuario canceló la selección
                imageStatus.textContent = '';
                // Resetear el input para que pueda volver a abrirse
                imageInput.value = '';
                console.log('Selección de imagen cancelada');
                return;
            }

            // VALIDAR TIPO DE ARCHIVO
            if (!file.type.startsWith('image/')) {
                imageStatus.textContent = '⚠️ Solo se permiten imágenes';
                // Resetear el input para futuras selecciones
                imageInput.value = '';
                alert('Por favor selecciona un archivo de imagen válido');
                return;
            }

            // VALIDAR TAMAÑO (máximo 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                imageStatus.textContent = '⚠️ Imagen demasiado grande (máx. 5MB)';
                // Resetear el input para futuras selecciones
                imageInput.value = '';
                alert('La imagen es demasiado grande. Máximo 5MB permitido.');
                return;
            }

            imageStatus.textContent = '⏳ Procesando imagen...';

            // PROCESAR LA IMAGEN
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;

                // CREAR IMAGEN EN LA POSICIÓN DONDE SE SOLTÓ EL ELEMENTO
                // Usar una posición por defecto ya que no podemos rastrear la posición exacta de drop para imágenes
                const defaultX = 200 + (imageCounter * 60);
                const defaultY = 200 + (imageCounter * 40);

                createDraggableImage(imageUrl, file.name, defaultX, defaultY);
                imageCounter++;
                imageStatus.textContent = '✅ Imagen agregada: ' + file.name;
                // Resetear el input para futuras selecciones
                imageInput.value = '';
                setTimeout(() => {
                    imageStatus.textContent = '';
                }, 3000);

                console.log(`Imagen creada por drag & drop: "${file.name}" en (${defaultX}, ${defaultY})`);
            };

            reader.onerror = function() {
                imageStatus.textContent = '❌ Error al cargar imagen';
                // Resetear el input para futuras selecciones
                imageInput.value = '';
                console.error('Error al leer el archivo de imagen');
            };

            reader.readAsDataURL(file);
        });
    }

    console.log('Sistema de drag & drop configurado exitosamente');
}

/**
 * CREA UN ELEMENTO DE TEXTO ARRASTRABLE Y EDITABLE
 * ================================================
 *
 * @param {string} text - El texto a mostrar
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 *
 * Características de edición avanzada:
 * - Doble clic abre editor en posición precisa del texto
 * - Control numérico de tamaño de fuente (8-100px)
 * - Textarea redimensionable visualmente
 * - Actualización en tiempo real del tamaño
 * - Mantiene posición y rotación del texto original
 */
function createDraggableText(text, x = 100, y = 100) {
    // CREAR NODO DE TEXTO EN KONVAJS
    const textNode = new Konva.Text({
        text: text,
        x: x,
        y: y,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        draggable: true,           // HABILITAR ARRASTRE
        name: 'draggable-text',    // NOMBRE PARA IDENTIFICACIÓN
        padding: 5,               // ESPACIO INTERNO PARA MEJOR SELECCIÓN
        align: 'left'
    });

    // AGREGAR EFECTOS VISUALES PARA INTERACCIÓN
    // Al pasar el mouse por encima
    textNode.on('mouseover', function() {
        document.body.style.cursor = 'move';
        this.fill('#007bff'); // Cambiar color
    });

    // Al quitar el mouse
    textNode.on('mouseout', function() {
        document.body.style.cursor = 'default';
        this.fill('#000000'); // Volver al color original
    });

    // EVENTO: DOBLE CLIC PARA EDITAR TEXTO
    textNode.on('dblclick dbltap', function() {
        // CREAR CONTENEDOR HTML TEMPORAL PARA EDICIÓN
        const textPosition = this.absolutePosition();

        // Calcular posición más precisa y congruente
        const stageBox = stage.container().getBoundingClientRect();
        const areaPosition = {
            x: stageBox.left + textPosition.x - 10, // Pequeño offset para mejor alineación
            y: stageBox.top + textPosition.y - 5,   // Pequeño offset para mejor alineación
        };

        // Crear contenedor principal para edición con layout horizontal
        const editContainer = document.createElement('div');
        editContainer.style.position = 'absolute';
        editContainer.style.left = areaPosition.x + 'px';
        editContainer.style.top = areaPosition.y + 'px';
        editContainer.style.zIndex = '1000';
        editContainer.style.display = 'flex';        // Layout horizontal
        editContainer.style.alignItems = 'flex-start'; // Alinear al inicio
        editContainer.style.gap = '8px';            // Espacio entre elementos
        document.body.appendChild(editContainer);

        // Crear textarea para edición de texto
        const textarea = document.createElement('textarea');
        textarea.value = this.text();
        textarea.className = 'text-edit-textarea'; // ← USAR CLASE CSS

        // Solo configurar propiedades dinámicas
        const initialTextWidth = Math.max(this.width() - this.padding() * 2, 100);
        textarea.style.width = initialTextWidth + 'px';
        textarea.style.fontSize = this.fontSize() + 'px';
        textarea.style.fontFamily = this.fontFamily();
        textarea.style.textAlign = this.align();

        // Crear control de tamaño (al lado izquierdo, sin etiqueta)
        const sizeControl = document.createElement('div');
        sizeControl.style.display = 'flex';
        sizeControl.style.alignItems = 'center';
        sizeControl.style.justifyContent = 'center';
        sizeControl.style.width = '50px';
        sizeControl.style.height = '100%'; // Para centrar verticalmente

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

        // Agregar elementos al contenedor
        editContainer.appendChild(sizeControl);
        editContainer.appendChild(textarea);

        // Rotar el contenedor si el texto está rotado
        const rotation = this.rotation();
        if (rotation) {
            editContainer.style.transform = 'rotateZ(' + rotation + 'deg)';
            editContainer.style.transformOrigin = 'left top';
        }

        // Seleccionar todo el texto
        textarea.focus();
        textarea.select();

        // FUNCIÓN PARA MEDIR EL ANCHO REAL DEL TEXTO
        const measureTextWidth = (text, fontSize, fontFamily) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = `${fontSize}px ${fontFamily}`;
            return ctx.measureText(text).width;
        };

        // FUNCIÓN PARA AUTO-RESIZE HORIZONTAL DEL TEXTAREA
        const autoResizeTextarea = () => {
            const textWidth = measureTextWidth(textarea.value, this.fontSize(), this.fontFamily());
            const padding = 10; // Padding extra para comodidad
            const newWidth = Math.max(Math.min(textWidth + padding + 20, 400), 100); // Entre 100px y 400px

            textarea.style.width = newWidth + 'px';
        };

        // Aplicar auto-resize inicialmente
        autoResizeTextarea();

        // FUNCIONES PARA ACTUALIZAR TAMAÑO
        const updateFontSize = () => {
            const newSize = parseInt(sizeInput.value);
            if (newSize >= 8 && newSize <= 100) {
                this.fontSize(newSize);
                textarea.style.fontSize = newSize + 'px';
                layer.draw();
                // Re-aplicar auto-resize con nueva fuente
                setTimeout(autoResizeTextarea, 0);
            }
        };

        // Evento para cambiar tamaño
        sizeInput.addEventListener('input', updateFontSize);
        sizeInput.addEventListener('change', updateFontSize);

        // Evento para auto-resize del textarea mientras se escribe
        textarea.addEventListener('input', autoResizeTextarea);

        // FUNCIONES PARA FINALIZAR EDICIÓN
        const removeEditContainer = () => {
            document.body.removeChild(editContainer);
            window.removeEventListener('click', handleOutsideClick);
            this.hide(); // Ocultar texto temporalmente
        };

        // Al presionar Enter o Escape
        const handleKeyDown = (e) => {
            if (e.keyCode === 13 && !e.shiftKey) { // Enter (sin shift para nueva línea)
                this.text(textarea.value);
                updateFontSize(); // Aplicar último cambio de tamaño
                removeEditContainer();
                this.show(); // Mostrar texto actualizado
            }
            if (e.keyCode === 27) { // Escape
                removeEditContainer();
                this.show(); // Mostrar texto sin cambios
            }
        };

        // Al hacer clic fuera del contenedor
        const handleOutsideClick = (e) => {
            if (!editContainer.contains(e.target)) {
                this.text(textarea.value);
                updateFontSize(); // Aplicar último cambio de tamaño
                removeEditContainer();
                this.show();
            }
        };

        // Configurar event listeners
        textarea.addEventListener('keydown', handleKeyDown);
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        // Actualizar tamaño del textarea cuando se redimensiona
        let resizeObserver;
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                // Aquí podríamos ajustar el tamaño del texto basado en el tamaño del textarea
                // Por ahora mantenemos el control manual
            });
            resizeObserver.observe(textarea);
        }
    });

    // EVENTO: PRESIONAR DELETE PARA ELIMINAR
    textNode.on('keydown', function(event) {
        if (event.keyCode === 46 || event.keyCode === 8) { // Delete o Backspace
            this.destroy(); // Eliminar el elemento
            layer.draw(); // Redibujar la capa
        }
    });

    // HABILITAR ESCUCHA DE EVENTOS DE TECLADO
    textNode.on('focus', function() {
        // Cuando el elemento tiene foco, escuchar teclas
        document.addEventListener('keydown', handleKeyDown);
    });

    textNode.on('blur', function() {
        // Cuando pierde foco, dejar de escuchar
        document.removeEventListener('keydown', handleKeyDown);
    });

    // Función auxiliar para manejar teclas
    const handleKeyDown = (event) => {
        if (event.keyCode === 46 || event.keyCode === 8) { // Delete o Backspace
            textNode.destroy();
            layer.draw();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };

    // AGREGAR EL TEXTO A LA CAPA Y REDIBUJAR
    layer.add(textNode);
    layer.draw();

    console.log(`Texto creado: "${text}" en posición (${x}, ${y})`);
}

// =============================================================================
// MÓDULO 2.6: GESTIÓN DE ELEMENTOS DE IMAGEN INTERACTIVOS
// =============================================================================

/**
 * CONFIGURA EL SISTEMA DE CARGA Y MANIPULACIÓN DE IMÁGENES
 * ========================================================
 *
 * Permite subir imágenes desde archivos y crear elementos arrastrables
 * y redimensionables en el canvas.
 * Funcionalidades:
 * - Subir imágenes desde input file
 * - Arrastrar elementos por el canvas
 * - Redimensionar con transformadores visuales
 * - Eliminar elementos con tecla Delete
 * - Posicionamiento automático para evitar solapamiento
 */
function setupImageControls() {
    // Obtener referencias a los elementos del DOM
    const addImageBtn = document.getElementById('add-image-btn');
    const imageInput = document.getElementById('image-input');
    const imageStatus = document.getElementById('image-status');

    if (!addImageBtn || !imageInput || !imageStatus) {
        console.error('Elementos de control de imagen no encontrados en el DOM');
        return;
    }

    // CONTADOR PARA NOMBRAR ELEMENTOS ÚNICAMENTE
    let imageCounter = 0;

    // EVENT LISTENER: ABRIR SELECCIONADOR DE ARCHIVOS
    addImageBtn.addEventListener('click', function() {
        imageInput.click(); // Simula clic en input file oculto
    });

    // EVENT LISTENER: PROCESAR ARCHIVO SELECCIONADO
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (!file) {
            imageStatus.textContent = 'No se seleccionó archivo';
            return;
        }

        // VALIDAR TIPO DE ARCHIVO
        if (!file.type.startsWith('image/')) {
            imageStatus.textContent = '⚠️ Solo se permiten imágenes';
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // VALIDAR TAMAÑO (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            imageStatus.textContent = '⚠️ Imagen demasiado grande (máx. 5MB)';
            alert('La imagen es demasiado grande. Máximo 5MB permitido.');
            return;
        }

        imageStatus.textContent = '⏳ Procesando imagen...';

        // PROCESAR LA IMAGEN
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            createDraggableImage(imageUrl, file.name, 150 + (imageCounter * 50), 150 + (imageCounter * 30));
            imageCounter++;
            imageStatus.textContent = '✅ Imagen agregada: ' + file.name;
            setTimeout(() => {
                imageStatus.textContent = '';
            }, 3000);
        };

        reader.onerror = function() {
            imageStatus.textContent = '❌ Error al cargar imagen';
            console.error('Error al leer el archivo de imagen');
        };

        reader.readAsDataURL(file);
    });

    console.log('Sistema de control de imágenes configurado');
}

/**
 * CONFIGURA EL SISTEMA DE INTERACCIÓN GLOBAL DEL CANVAS
 * ===================================================
 *
 * Maneja eventos globales como clics en áreas vacías para
 * desactivar modos de edición de elementos interactivos.
 */
function setupCanvasInteraction() {
    // EVENTO: CLIC EN ÁREAS VACÍAS DESACTIVA TODOS LOS TRANSFORMADORES
    stage.on('click tap', function(e) {
        // Si el clic fue en una imagen, no hacer nada (dejar que el evento de la imagen se maneje)
        if (e.target !== stage && e.target.name() !== 'pdf-background') {
            // El clic fue en un elemento (como una imagen), no hacer nada
            return;
        }

        // El clic fue en el stage o en el fondo (área vacía)
        // REMOVER TODOS LOS TRANSFORMADORES ACTIVOS
        layer.find('Transformer').forEach(transformer => {
            transformer.destroy();
        });
        layer.draw();

        console.log('Modo edición desactivado - transformers removidos');
    });

    console.log('Sistema de interacción global del canvas configurado');
}

/**
 * CREA UN ELEMENTO DE IMAGEN ARRASTRABLE Y REDIMENSIONABLE
 * =======================================================
 *
 * @param {string} imageUrl - URL de datos de la imagen (base64)
 * @param {string} fileName - Nombre original del archivo
 * @param {number} x - Posición X inicial
 * @param {number} y - Posición Y inicial
 */
function createDraggableImage(imageUrl, fileName, x = 150, y = 150) {
    // CREAR ELEMENTO HTML IMAGE PARA MEDIR DIMENSIONES
    const img = new Image();

    img.onload = function() {
        // CALCULAR DIMENSIONES MÁXIMAS PARA EVITAR IMÁGENES DEMASIADO GRANDES
        const maxWidth = 400;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        // ESCALAR SI ES NECESARIO
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        // CREAR NODO DE IMAGEN EN KONVAJS
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

        // AGREGAR EFECTOS VISUALES PARA INTERACCIÓN
        // Al pasar el mouse por encima
        imageNode.on('mouseover', function() {
            document.body.style.cursor = 'move';
            // Agregar borde sutil
            this.stroke('#007bff');
            this.strokeWidth(2);
            layer.draw();
        });

        // Al quitar el mouse
        imageNode.on('mouseout', function() {
            document.body.style.cursor = 'default';
            this.stroke(null);
            this.strokeWidth(0);
            layer.draw();
        });

        // EVENTO: DOBLE CLIC PARA ACTIVAR TRANSFORMADOR
        imageNode.on('dblclick dbltap', function() {
            // REMOVER TRANSFORMADORES EXISTENTES
            layer.find('Transformer').forEach(transformer => transformer.destroy());

            // CREAR NUEVO TRANSFORMADOR PARA ESTA IMAGEN
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

            // GUARDAR REFERENCIA AL TRANSFORMADOR
            imageNode.transformer = transformer;
        });

        // EVENTO: PRESIONAR DELETE PARA ELIMINAR
        imageNode.on('keydown', function(event) {
            if (event.keyCode === 46 || event.keyCode === 8) { // Delete o Backspace
                // Remover transformador si existe
                if (this.transformer) {
                    this.transformer.destroy();
                }
                this.destroy(); // Eliminar la imagen
                layer.draw(); // Redibujar la capa
            }
        });

        // HABILITAR ESCUCHA DE EVENTOS DE TECLADO
        imageNode.on('focus', function() {
            document.addEventListener('keydown', handleKeyDown);
        });

        imageNode.on('blur', function() {
            document.removeEventListener('keydown', handleKeyDown);
        });

        // Función auxiliar para manejar teclas
        const handleKeyDown = (event) => {
            if (event.keyCode === 46 || event.keyCode === 8) { // Delete o Backspace
                if (imageNode.transformer) {
                    imageNode.transformer.destroy();
                }
                imageNode.destroy();
                layer.draw();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };

        // EVENTO: AL TERMINAR DE ARRASTRAR, REMOVER TRANSFORMADOR SI NO ESTÁ SELECCIONADO
        imageNode.on('dragend', function() {
            // Opcional: remover transformador al terminar de arrastrar
            // Por ahora lo mantenemos para que el usuario pueda seguir redimensionando
        });

        // AGREGAR LA IMAGEN A LA CAPA Y REDIBUJAR
        layer.add(imageNode);
        layer.draw();

        console.log(`Imagen creada: "${fileName}" (${width}x${height}px) en posición (${x}, ${y})`);
    };

    img.onerror = function() {
        console.error('Error al cargar la imagen:', fileName);
        alert('Error al cargar la imagen. Intenta con otro archivo.');
    };

    // ESTABLECER LA FUENTE DE LA IMAGEN
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
        console.error('Botón de guardar PDF no encontrado en el DOM');
        return;
    }

    // CONFIGURE EVENT LISTENER FOR EXPORT
    saveButton.addEventListener('click', function (event) {
        event.preventDefault(); // Prevenir cualquier comportamiento por defecto
        console.log('Iniciando exportación a PDF...');

        // DEPENDENCY VALIDATION
        if (typeof jsPDF === 'undefined') {
            console.error('jsPDF no está cargado');
            alert('Error: jsPDF library no está disponible');
            return;
        }

        try {
            // STEP 1: JSPDF INITIALIZATION
            // Create PDF document with landscape orientation ('l'), units in pixels ('px')
            // Dimensions based on the KonvaJS stage
            const pdf = new jsPDF('l', 'px', [stage.width(), stage.height()]);

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
            console.log('Exportando imágenes...');

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

                        console.log(`Imagen exportada: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}px en (${x.toFixed(0)}, ${y.toFixed(0)})`);
                    }
                } catch (imageError) {
                    console.warn('Error al procesar imagen individual:', imageError);
                    // Continue with other images
                }
            });

            // STEP 3: EXPORT COMPLETE SCENE AS IMAGE
            console.log('Exportando escena como imagen...');

            // stage.toDataURL() converts the entire KonvaJS canvas to a Base64 image
            // pixelRatio: 2 doubles the resolution for retina/high-density displays
            const canvasDataURL = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'  // Formato PNG por defecto
            });

            // ADD IMAGE TO PDF
            // Position (0,0) covers the entire PDF page
            pdf.addImage(
                canvasDataURL,     // backgruond image Base64 format
                'PNG',
                0,
                0,
                stage.width(),
                stage.height()
            );

            // STEP 4: FILE DOWNLOAD
            // Show save file dialog to the user
            pdf.save('canvas.pdf');

            console.log('PDF exportado exitosamente');

        } catch (error) {
            console.error('Error durante la exportación a PDF:', error);
            alert('Error al exportar PDF: ' + error.message);
        }
    });

    console.log('Sistema de exportación a PDF configurado');
}
