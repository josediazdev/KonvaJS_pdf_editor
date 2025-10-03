/**
 * CANVAS.JS - Manipulación de PDFs con KonvaJS
 * ==============================================
 *
 * Sistema completo para cargar PDFs, manipularlos visualmente y exportarlos.
 * Utiliza PDF.js para renderizado y KonvaJS para manipulación interactiva.
 *
 * Arquitectura: PDF → Canvas Temporal → Konva.Image → Manipulación → PDF Export
 *
 * Dependencias requeridas:
 * - PDF.js (pdfjsLib global)
 * - KonvaJS (Konva global)
 * - jsPDF (jsPDF global)
 * - Variable global pdfBase64Data con datos del PDF en Base64
 * - Elemento DOM con id 'save-pdf-btn'
 *
 * Módulos principales:
 * 1. CARGA DEL PDF: Conversión Base64 → Canvas Temporal → Konva.Image
 * 2. MANIPULACIÓN: Agregado de nodos interactivos (texto, imágenes) sobre el canvas
 *    - Elementos arrastrables y editables
 *    - Sistema de herramientas en HTML para creación de contenido
 *    - Interacción intuitiva con mouse y teclado
 * 2.5. GESTIÓN DE TEXTOS: Creación, edición y eliminación de elementos de texto
 * 2.6. GESTIÓN DE IMÁGENES: Subida, manipulación y eliminación de elementos de imagen
 * 2.7. INTERACCIÓN GLOBAL: Gestión de eventos del canvas y modos de edición
 * 3. EXPORTACIÓN: Generación de PDF final con jsPDF
 * 4. EXPORTACIÓN DE IMÁGENES: Generación de imágenes PNG y JPEG de la escena
 */

// =============================================================================
// INICIALIZACIÓN Y CONFIGURACIÓN PRINCIPAL
// =============================================================================

/**
 * CONFIGURACIÓN PRINCIPAL DEL SISTEMA
 * ===================================
 * Inicializa KonvaJS, configura el stage/layer, y coordina la carga de módulos.
 */

// INICIALIZACIÓN DEL STAGE Y LAYER PRINCIPALES
// Stage: Contenedor principal del canvas de KonvaJS
// Layer: Capa donde se dibujan todos los elementos gráficos

const stage = new Konva.Stage({
    height: window.innerHeight,    // Alto de la ventana del navegador
    width: window.innerWidth,      // Ancho de la ventana del navegador
    container: "konva-holder",     // ID del elemento HTML contenedor
});

const layer = new Konva.Layer();
stage.add(layer);

// SISTEMA DE EVENTOS PARA COORDINACIÓN
// En lugar de setTimeout arbitrario, usamos eventos personalizados
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando sistema...');

    // ESPERAR A QUE LAS DEPENDENCIAS ESTÉN DISPONIBLES
    // Usar Promise para esperar a que pdfBase64Data esté disponible
    const checkDependencies = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (typeof window.pdfBase64Data !== 'undefined' && window.pdfBase64Data) {
                    resolve();
                } else {
                    // Reintentar en el siguiente ciclo de eventos
                    setTimeout(check, 10);
                }
            };
            check();
        });
    };

    // INICIALIZAR SISTEMA CUANDO TODO ESTÉ LISTO
    checkDependencies().then(() => {
        console.log('Dependencias verificadas, cargando PDF...');
        loadPdfAsImage();
    });

    // CONFIGURAR SISTEMA DE EXPORTACIÓN
    setupPdfExport();

    // CONFIGURAR SISTEMA DE DRAG & DROP
    setupDragDrop();

    // CONFIGURAR INTERACCIÓN GLOBAL DEL CANVAS
    setupCanvasInteraction();
});

// INICIALIZAR ELEMENTOS DEMO CUANDO EL PDF ESTÉ CARGADO
document.addEventListener('pdfLoaded', function() {
    console.log('PDF cargado exitosamente - listo para edición');
    // Los elementos demo fueron removidos ya que ahora tenemos drag & drop
    // setupDragDrop() ya está inicializado
});



// =============================================================================
// MÓDULO 1: CARGA DEL PDF COMO IMAGEN EN KONVAJS
// =============================================================================

/**
 * MÓDULO 1: CARGA Y CONVERSIÓN DEL PDF
 * ====================================
 *
 * Convierte un PDF (Base64) en una imagen manipulable dentro de KonvaJS.
 * Proceso: Base64 → PDF.js → Canvas Temporal → Imagen HTML → Konva.Image
 *
 * Esta función maneja todo el pipeline de conversión del PDF a un formato
 * que KonvaJS puede manipular como cualquier otra imagen.
 */
async function loadPdfAsImage() {

    // VALIDACIÓN DE DEPENDENCIAS
    // Verificar que tenemos los datos del PDF en Base64
    if (typeof window.pdfBase64Data === 'undefined' || !window.pdfBase64Data) {
        console.log('No hay datos Base64 del PDF disponibles');
        return;
    }

    // Verificar que PDF.js está disponible globalmente
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js no está cargado');
        return;
    }

    console.log('Convirtiendo PDF a imagen para KonvaJS...');

    try {
        // PASO 1: DECODIFICACIÓN BASE64
        // Convertir string Base64 a datos binarios que PDF.js puede procesar
        // atob() es función nativa del navegador para decodificación Base64
        const pdfData = atob(window.pdfBase64Data);

        // PASO 2: CARGA DEL DOCUMENTO PDF
        // PDF.js crea una tarea asíncrona para procesar el PDF
        // getDocument() retorna una Promise que se resuelve con el objeto PDF
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        console.log('PDF cargado, total páginas:', pdf.numPages);

        // PASO 3: OBTENCIÓN DE LA PRIMERA PÁGINA
        // Los PDFs pueden tener múltiples páginas, aquí procesamos solo la primera
        // getPage(1) retorna la página 1 (numeración comienza en 1, no en 0)
        const page = await pdf.getPage(1);

        // PASO 4: CONFIGURACIÓN DEL VIEWPORT
        // El viewport define dimensiones y escala de renderizado
        // scale: 1 = tamaño original del PDF (sin escalado)
        const viewport = page.getViewport({ scale: 1 });

        // PASO 5: CREACIÓN DE CANVAS TEMPORAL
        // Creamos un canvas HTML5 temporal (no visible) para renderizar el PDF
        // Este canvas existe solo en memoria durante el proceso de conversión
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');

        // Configurar dimensiones del canvas temporal según el viewport del PDF
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;

        // PASO 6: RENDERIZADO DEL PDF EN CANVAS TEMPORAL
        // PDF.js dibuja la página del PDF en el contexto 2D del canvas temporal
        // Esto convierte el PDF vectorial en un bitmap rasterizado
        await page.render({
            canvasContext: tempContext,
            viewport: viewport
        }).promise;

        console.log('PDF renderizado en canvas temporal:', tempCanvas.width, 'x', tempCanvas.height);

        // PASO 7: CONVERSIÓN DE CANVAS A IMAGEN HTML
        // Crear un elemento <img> nativo del navegador
        const pdfImage = new Image();

        // PASO 8: CALLBACK CUANDO LA IMAGEN ESTÁ LISTA
        // Este callback se ejecuta cuando la imagen se carga completamente
        pdfImage.onload = function() {
            console.log('Imagen del PDF lista para KonvaJS');

            // AJUSTAR DIMENSIONES DEL STAGE
            // El stage de KonvaJS debe tener las mismas dimensiones que la imagen del PDF
            // para que el contenido se vea correctamente
            stage.width(pdfImage.width);
            stage.height(pdfImage.height);

            // PASO 9: CREACIÓN DEL NODO KONVA.IMAGE
            // Convertir la imagen HTML en un nodo manipulable de KonvaJS
            const konvaPdfImage = new Konva.Image({
                x: 0,              // Posición X (esquina superior izquierda)
                y: 0,              // Posición Y (esquina superior izquierda)
                image: pdfImage,   // Imagen HTML nativa como fuente
                listening: false,  // No responde a eventos (es solo fondo)
                name: 'pdf-background' // Nombre para identificación
            });

            // PASO 10: INTEGRACIÓN EN LA ESCENA KONVAJS
            // Agregar el PDF como imagen de fondo en la capa
            layer.add(konvaPdfImage);

            // Asegurar que el PDF esté siempre al fondo (z-index más bajo)
            konvaPdfImage.moveToBottom();

            // PASO 11: REDIBUJAR LA ESCENA
            // Forzar el renderizado de todos los elementos en la capa
            layer.draw();

            console.log('PDF integrado exitosamente en KonvaJS como imagen');

            // ACTUALIZAR ESTADO EN EL HEADER
            const statusIndicator = document.getElementById('pdf-status');
            if (statusIndicator) {
                statusIndicator.textContent = 'PDF cargado correctamente';
                statusIndicator.style.color = '#48bb78';
            }

            // EMITIR EVENTO DE PDF CARGADO
            // Notificar a otros módulos que el PDF está listo para manipulación
            document.dispatchEvent(new CustomEvent('pdfLoaded'));
        };

        // PASO 7 CONTINUACIÓN: ASIGNAR FUENTE DE LA IMAGEN
        // Convertir el canvas temporal a una URL de datos Base64
        // Esto dispara automáticamente el evento onload de la imagen
        pdfImage.src = tempCanvas.toDataURL();

    } catch (error) {
        // MANEJO DE ERRORES
        // Capturar cualquier error durante el proceso de conversión
        // Errores comunes: PDF corrupto, memoria insuficiente, red
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
// MÓDULO 2: AGREGACIÓN DE NODOS MANIPULABLES
// =============================================================================

/**
 * MÓDULO 2: MANIPULACIÓN VISUAL - AGREGACIÓN DE NODOS
 * ===================================================
 *
 * Agrega elementos interactivos sobre el canvas del PDF.
 * Incluye texto editable, imágenes superpuestas y otros elementos gráficos.
 * Todos los elementos se pueden mover, rotar, escalar y eliminar.
 */

/**
 * INICIALIZACIÓN DEL TEXTO DEMO
 * =============================
 * Crea un nodo de texto de ejemplo que demuestra las capacidades de manipulación.
 * Este texto se puede mover, rotar y editar directamente en el canvas.
 */

// =============================================================================
// MÓDULO 2.5: GESTIÓN DE ELEMENTOS DE TEXTO INTERACTIVOS
// =============================================================================

// =============================================================================
// MÓDULO 2.5: SISTEMA DE DRAG & DROP DESDE SIDEBAR
// =============================================================================

/**
 * CONFIGURA EL SISTEMA DE DRAG & DROP PARA ELEMENTOS DEL SIDEBAR
 * ============================================================
 *
 * Permite arrastrar elementos desde el panel lateral directamente al canvas.
 * Funcionalidades:
 * - Arrastrar elementos visuales (texto/imagen) desde el sidebar
 * - Soltar en el canvas para crear elementos interactivos
 * - Auto-apertura del selector de archivos para imágenes
 * - Feedback visual durante el arrastre
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
            const defaultText = 'Nuevo texto';
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
// MÓDULO 3: EXPORTACIÓN A PDF CON JSPDF
// =============================================================================

/**
 * MÓDULO 3: EXPORTACIÓN FINAL A PDF
 * ================================
 *
 * Convierte la escena completa de KonvaJS (PDF manipulado + elementos agregados)
 * en un archivo PDF descargable usando la librería jsPDF.
 *
 * Proceso: Separar textos → Separar imágenes → Rasterizar escena → Combinar en PDF
 *
 * PROCESAMIENTO AVANZADO:
 * - Textos: Procesados individualmente con fuente, tamaño y rotación
 * - Imágenes: Procesadas individualmente con escala, rotación y transformación
 * - Escena completa: Renderizada como imagen de fondo con pixelRatio alto
 */
function setupPdfExport() {
    // Obtener referencia al botón de exportación desde el DOM
    const saveButton = document.getElementById('save-pdf-btn');

    if (!saveButton) {
        console.error('Botón de guardar PDF no encontrado en el DOM');
        return;
    }

    // CONFIGURAR EVENT LISTENER PARA EXPORTACIÓN
    saveButton.addEventListener('click', function (event) {
        event.preventDefault(); // Prevenir cualquier comportamiento por defecto
        console.log('Iniciando exportación a PDF...');

        // VALIDACIÓN DE DEPENDENCIAS
        if (typeof jsPDF === 'undefined') {
            console.error('jsPDF no está cargado');
            alert('Error: jsPDF library no está disponible');
            return;
        }

        try {
            // PASO 1: INICIALIZACIÓN DE JSPDF
            // Crear documento PDF con orientación horizontal ('l'), unidades en píxeles ('px')
            // Dimensiones basadas en el stage de KonvaJS
            const pdf = new jsPDF('l', 'px', [stage.width(), stage.height()]);

            // Configurar color de texto por defecto
            pdf.setTextColor('#000000');

            // PASO 2: EXPORTAR TEXTOS POR SEPARADO
            // KonvaJS no exporta texto nativamente a PDF, así que procesamos cada nodo Text
            console.log('Exportando textos...');

            // stage.find('Text') busca todos los nodos de tipo Konva.Text en la escena
            stage.find('Text').forEach((textNode) => {
                // CONVERSIÓN DE UNIDADES
                // jsPDF usa puntos (1/72 pulgada), Konva usa píxeles
                // Factor de conversión aproximado: 1px ≈ 0.75pt
                const fontSizeInPoints = textNode.fontSize() / 0.75;
                pdf.setFontSize(fontSizeInPoints);
                // EXTRAER PROPIEDADES DEL NODO
                const textContent = textNode.text();         // Contenido del texto
                const x = textNode.x();                     // Posición X
                const y = textNode.y();                     // Posición Y

                // MANEJO DE ROTACIÓN
                // jsPDF usa rotación positiva en sentido horario
                // KonvaJS usa rotación positiva en sentido antihorario
                // getAbsoluteRotation() obtiene la rotación total incluyendo ancestros
                const rotation = -textNode.getAbsoluteRotation();

                // AGREGAR TEXTO AL PDF
                // baseline: 'top' asegura posicionamiento correcto desde la parte superior
                pdf.text(textContent, x, y, {
                    baseline: 'top',
                    angle: rotation,
                });
            });

            // PASO 2.5: EXPORTAR IMÁGENES POR SEPARADO
            // Las imágenes también necesitan procesamiento individual para preservar rotación y escala
            console.log('Exportando imágenes...');

            // stage.find('Image') busca todos los nodos de tipo Konva.Image en la escena
            // Excluimos la imagen de fondo del PDF (que tiene name: 'pdf-background')
            stage.find('Image').forEach((imageNode) => {
                // SALTAR LA IMAGEN DE FONDO DEL PDF
                if (imageNode.name() === 'pdf-background') {
                    return; // Continuar con la siguiente imagen
                }

                try {
                    // EXTRAER PROPIEDADES DEL NODO
                    const x = imageNode.x();                      // Posición X
                    const y = imageNode.y();                      // Posición Y
                    const width = imageNode.width();              // Ancho
                    const height = imageNode.height();            // Alto

                    // MANEJO DE ROTACIÓN Y ESCALA
                    // getAbsoluteRotation() obtiene la rotación total incluyendo ancestros
                    const rotation = imageNode.getAbsoluteRotation();
                    const scaleX = imageNode.scaleX();
                    const scaleY = imageNode.scaleY();

                    // CALCULAR DIMENSIONES ESCALADAS
                    const scaledWidth = width * scaleX;
                    const scaledHeight = height * scaleY;

                    // CONVERTIR IMAGEN A BASE64
                    // Usar toDataURL() en el elemento HTML Image subyacente
                    const imageElement = imageNode.image();
                    if (imageElement && imageElement.toDataURL) {
                        const imageDataURL = imageElement.toDataURL('image/png');

                        // AGREGAR IMAGEN AL PDF
                        // jsPDF maneja rotación y escala automáticamente
                        pdf.addImage(
                            imageDataURL,     // Imagen en formato Base64
                            'PNG',           // Formato de la imagen
                            x,               // Posición X
                            y,               // Posición Y
                            scaledWidth,     // Ancho escalado
                            scaledHeight,    // Alto escalado
                            undefined,       // Sin alias
                            'FAST'          // Compresión rápida
                        );

                        // APLICAR ROTACIÓN SI ES NECESARIA
                        if (rotation !== 0) {
                            // jsPDF rota en sentido horario positivo
                            // KonvaJS rota en sentido antihorario positivo
                            const pdfRotation = -rotation;

                            // Calcular el centro de rotación
                            const centerX = x + scaledWidth / 2;
                            const centerY = y + scaledHeight / 2;

                            // Aplicar rotación alrededor del centro
                            pdf.text('', centerX, centerY, {
                                angle: pdfRotation
                            });
                        }

                        console.log(`Imagen exportada: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}px en (${x.toFixed(0)}, ${y.toFixed(0)})`);
                    }
                } catch (imageError) {
                    console.warn('Error al procesar imagen individual:', imageError);
                    // Continuar con otras imágenes
                }
            });

            // PASO 3: EXPORTAR ESCENA COMPLETA COMO IMAGEN
            console.log('Exportando escena como imagen...');

            // stage.toDataURL() convierte todo el canvas de KonvaJS a imagen Base64
            // pixelRatio: 2 duplica la resolución para calidad retina/displays de alta densidad
            const canvasDataURL = stage.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'  // Formato PNG por defecto
            });

            // AGREGAR IMAGEN AL PDF
            // Posición (0,0) cubre toda la página del PDF
            pdf.addImage(
                canvasDataURL,     // Imagen en formato Base64
                'PNG',            // Formato de la imagen
                0,                // Posición X
                0,                // Posición Y
                stage.width(),    // Ancho de la imagen
                stage.height()    // Alto de la imagen
            );

            // PASO 4: DESCARGA DEL ARCHIVO
            // Mostrar diálogo de guardar archivo al usuario
            pdf.save('canvas.pdf');

            console.log('PDF exportado exitosamente');

        } catch (error) {
            console.error('Error durante la exportación a PDF:', error);
            alert('Error al exportar PDF: ' + error.message);
        }
    });

    console.log('Sistema de exportación a PDF configurado');
}
