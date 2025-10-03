@extends('components.layout')
@section('title', 'Login')
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
                    <a class="nav-link" href="{{ route('register.show') }}">Register</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<div class="auth-container">
    <div class="auth-wrapper">
        <header class="auth-header">
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Sign in to your account to continue</p>
        </header>

        <div class="auth-form-container">
            <form action="{{ route('login') }}" method="POST" class="auth-form">
                @csrf

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

                <button type="submit" class="auth-btn">Sign In</button>
            </form>
        </div>

        <div class="auth-links">
            <p>Don't have an account? <a href="{{ route('register.show') }}">Sign Up here</a></p>
            <p><a href="{{ route('password.request') }}">Forgot Password?</a></p>
        </div>
    </div>
</div>

@endsection
