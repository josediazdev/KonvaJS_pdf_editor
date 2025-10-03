@extends('components.layout')
@section('title', 'Forgot Password')
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
            <h1 class="auth-title">Forgot Password</h1>
            <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>
        </header>

        <div class="auth-form-container">
            <form method="POST" action="{{ route('password.email') }}" class="auth-form">
                @csrf

                <div class="auth-form-group">
                    <label for="email" class="auth-form-label">Email Address</label>
                    <input type="email" name="email" value="{{ old('email') }}" class="auth-form-input" required autocomplete="off">
                    @error('email')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <button type="submit" class="auth-btn">Send Reset Link</button>
            </form>
        </div>
    </div>
</div>

@endsection
