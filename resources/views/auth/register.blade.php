@extends('components.layout')
@section('title', 'Register')
@section('content')

<!-- Navigation Bar -->
<nav class="navbar navbar-expand-lg auth-navbar">
    <div class="container-fluid">
        <a class="navbar-brand" href="/">PDF Editor</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="{{ route('login.show') }}">Login</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<div class="auth-container">
    <div class="auth-wrapper">
        <header class="auth-header">
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Join us to start editing your PDFs</p>
        </header>

        <div class="auth-form-container">
            <form action="{{ route('register') }}" method="POST" class="auth-form">
                @csrf

                <div class="auth-form-group">
                    <label for="name" class="auth-form-label">Username</label>
                    <input type="text" id="name" name="name" value="{{ old('name') }}" class="auth-form-input" required>
                    @error('name')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div class="auth-form-group">
                    <label for="email" class="auth-form-label">Email Address</label>
                    <input type="email" id="email" name="email" value="{{ old('email') }}" class="auth-form-input" required>
                    @error('email')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div class="auth-form-group">
                    <label for="password" class="auth-form-label">Password</label>
                    <input type="password" id="password" name="password" class="auth-form-input" required>
                    @error('password')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div class="auth-form-group">
                    <label for="password_confirmation" class="auth-form-label">Confirm Password</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" class="auth-form-input" required>
                    @error('password_confirmation')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <button type="submit" class="auth-btn">Sign Up</button>
            </form>
        </div>

        <div class="auth-links">
            <p>Already have an account? <a href="{{ route('login.show') }}">Sign in here</a></p>
        </div>
    </div>
</div>

@endsection
