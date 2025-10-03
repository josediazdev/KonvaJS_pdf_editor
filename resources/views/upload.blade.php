@extends('components.layout')
@section('title', 'PDF Upload')
@section('content')
<div class="upload-container">
    <div class="upload-wrapper">
        <header class="upload-header">
            <h1 class="upload-title">PDF Editor</h1>
            <p class="upload-subtitle">Upload your PDF file to start editing it</p>
        </header>

        <div class="upload-form-container">
            <form action="/render" method="POST" enctype="multipart/form-data" class="upload-form">
                @csrf

                <div class="form-group">
                    <label for="pdf_upload" class="form-label">Select the PDF file</label>
                    <div class="file-input-wrapper">
                        <input
                            type="file"
                            name="pdf_file"
                            id="pdf_upload"
                            accept=".pdf"
                            class="file-input file-input-visible"
                            required
                        >
                        <div class="file-input-display">
                            <span class="file-placeholder">Click to select PDF</span>
                            <span class="file-name" id="file-name-display"></span>
                        </div>
                        <button type="button" class="file-select-btn" id="file-select-btn">
                            📎 Select PDF
                        </button>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="upload-btn" id="upload-btn">
                        🚀 Start Editing
                    </button>
                </div>

                <div class="error-container">
                    @error('pdf_file')
                        <div class="error-message">
                            <span class="error-icon">⚠️</span>
                            <span class="error-text">{{ $message }}</span>
                        </div>
                    @enderror
                </div>
            </form>
        </div>

        <footer class="upload-footer">
            <div class="upload-features">
                <div class="feature-item">
                    <span class="feature-icon">📝</span>
                    <span class="feature-text">Add text</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🖼️</span>
                    <span class="feature-text">Insert images</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📄</span>
                    <span class="feature-text">Export PDF</span>
                </div>
            </div>
        </footer>
    </div>
</div>
@endsection
