<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PDF Editor - @yield('title')</title>

    <!-- Bootstrap CSS for styling -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <style>
        /* Gradiente de fondo futurista para la app */
        body {
            background: radial-gradient(circle at top left, #667eea 0%, #764ba2 50%, #f0f4ff 100%);
            min-height: 100vh;
        }

        /* Estilos para inputs en formularios de auth */
        .auth-form input:focus {
            border-color: #00d4ff !important;
            box-shadow: 0 0 0 0.2rem rgba(0, 212, 255, 0.25) !important;
        }

        /* Toggle password visibility */
        .password-toggle {
            cursor: pointer;
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
    </style>


    <!-- KonvaJS CDN -->
    <script src="https://unpkg.com/konva@10.0.2/konva.js"></script>


    <!-- jsPDF CDN -->
    <script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js"
        integrity="sha384-NaWTHo/8YCBYJ59830LTz/P4aQZK1sS0SneOgAvhsIl3zBu8r9RevNg5lHCHAuQ/"
        crossorigin="anonymous">
    </script>


    <!-- PDFjs CDN to import and render the PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // setting up worker for PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    </script>

    @vite(['resources/css/app.css', 'resources/js/app.js', 'resources/js/konva_controller.js'])

</head>
<body>

    <!-- Barra de Navegación Futurista -->
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);">
        <div class="container-fluid">
            <!-- Logo/Nombre de la App - Futurista -->
            <a class="navbar-brand d-flex align-items-center" href="{{ route('home') }}" style="font-weight: 700; font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                <i class="bi bi-rocket-takeoff me-2" style="color: #00d4ff;"></i>
                PDF Editor
            </a>

            <!-- Botón Toggle para Mobile -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Menú de Navegación -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <!-- Estado Autenticado (Usuario Logueado) -->
                @auth
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link btn btn-outline-light me-2 px-3" href="#" style="border-color: #00d4ff; color: #00d4ff; transition: all 0.3s ease;">
                                <i class="bi bi-file-earmark-plus me-1"></i>
                                Upload New PDF
                            </a>
                        </li>
                        <li class="nav-item">
                            <form method="POST" action="{{ route('logout') }}" class="d-inline">
                                @csrf
                                <button type="submit" class="nav-link btn btn-outline-danger px-3" style="border-color: #ff4757; color: #ff4757; transition: all 0.3s ease;">
                                    <i class="bi bi-box-arrow-right me-1"></i>
                                    Logout
                                </button>
                            </form>
                        </li>
                    </ul>
                @endauth

                <!-- Estado Desautenticado (Usuario No Logueado) -->
                @guest
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link btn {{ request()->routeIs('login.show') ? 'btn-light' : 'btn-outline-light' }} me-2 px-3" href="{{ route('login.show') }}" style="{{ request()->routeIs('login.show') ? 'background-color: #00d4ff; border-color: #00d4ff; color: white;' : 'border-color: #00d4ff; color: #00d4ff;' }} transition: all 0.3s ease;">
                                <i class="bi bi-person-circle me-1"></i>
                                Login
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link btn {{ request()->routeIs('register.show') ? 'btn-light' : 'btn-outline-light' }} px-3" href="{{ route('register.show') }}" style="{{ request()->routeIs('register.show') ? 'background-color: #00d4ff; border-color: #00d4ff; color: white;' : 'border-color: #00d4ff; color: #00d4ff;' }} transition: all 0.3s ease;">
                                <i class="bi bi-person-plus me-1"></i>
                                Register
                            </a>
                        </li>
                    </ul>
                @endguest
            </div>
        </div>
    </nav>

    @yield('content')

    <!-- Bootstrap JS for interactive models -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

    <script>
        // Toggle password visibility
        document.addEventListener('DOMContentLoaded', function() {
            const toggles = document.querySelectorAll('.password-toggle');
            toggles.forEach(toggle => {
                toggle.addEventListener('click', function() {
                    const input = this.previousElementSibling;
                    const icon = this.querySelector('i');
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                });
            });
        });
    </script>
</body>
</html>
