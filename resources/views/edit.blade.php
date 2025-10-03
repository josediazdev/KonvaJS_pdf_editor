@extends('components.layout')
@section('title', 'Editing')
@section('content')

<div class="editor-container">
    <!-- left panel -->
    <aside class="editor-sidebar">
        <header class="sidebar-header">
            <h2 class="sidebar-title">Tools</h2>
            <p class="sidebar-subtitle">Edit your PDF</p>
        </header>

        <nav class="sidebar-nav">
            <!-- text module -->
            <div class="tool-module" id="text-module">
                <h3 class="module-title">Text</h3>
                <div class="module-content">
                    <!-- draggable text item -->
                    <div class="draggable-item text-draggable" draggable="true" data-type="text">
                        <div class="drag-icon">📝</div>
                        <div class="drag-label">Text</div>
                        <div class="drag-hint">Drag to the PDF</div>
                    </div>
                    <div class="module-info">
                        <small>Drag the square to add to the PDF</small>
                    </div>
                </div>
            </div>

            <!-- image module -->
            <div class="tool-module" id="image-module">
                <h3 class="module-title">Image</h3>
                <div class="module-content">
                    <!-- draggable image item -->
                    <div class="draggable-item image-draggable" draggable="true" data-type="image">
                        <div class="drag-icon">🖼️</div>
                        <div class="drag-label">Image</div>
                        <div class="drag-hint">Drag to the PDF</div>
                    </div>
                    <input type="file" id="image-input" class="file-input file-input-hidden" accept="image/*" />
                    <div id="image-status" class="status-message"></div>
                    <div class="module-info">
                        <small>Drag the square to add to the PDF and select the image</small>
                    </div>
                </div>
            </div>

            <!-- exportation module -->
            <div class="tool-module" id="export-module">
                <h3 class="module-title">Export</h3>
                <div class="module-content">
                    <button id="save-pdf-btn" class="action-btn success-btn">
                        <span class="btn-icon">📄</span>
                        <span class="btn-text">Save PDF</span>
                    </button>
                    <div class="module-info">
                        <small>Export the final PDF with all the elements</small>
                    </div>
                </div>
            </div>
        </nav>

        <footer class="sidebar-footer">
            <div class="sidebar-info">
                <small>PDF Editor v1.0</small>
            </div>
        </footer>
    </aside>

    <!-- main worspace -->
    <main class="editor-workspace">
        <header class="workspace-header">
            <div class="workspace-info">
                <h1 class="workspace-title">PDF Editor</h1>
                <div class="workspace-status">
                    <span class="status-indicator" id="pdf-status">Loading PDF...</span>
                </div>
            </div>
        </header>

        <div class="canvas-container">
            <div id="konva-holder" class="canvas-holder"></div>
        </div>

        <footer class="workspace-footer">
            <div class="footer-info">
                <!-- add footer info -->
            </div>
        </footer>
    </main>
</div>

<script>
    // definition of a global variable containing the $pdfBase64 data
    window.pdfBase64Data = "{{ $pdfBase64 }}";
</script>

@endsection
