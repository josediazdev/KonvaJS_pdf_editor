@extends('components.layout')
@section('title', 'Reset Password')
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
            <h1 class="auth-title">Reset Password</h1>
            <p class="auth-subtitle">Enter your new password</p>
        </header>

        <div class="auth-form-container">
            <form method="POST" action="{{ route('password.update') }}" class="auth-form">
                @csrf

                <input type="hidden" name="token" value="{{ $token }}">
                <input type="hidden" name="email" value="{{ $email ?? old('email') }}">

                <div class="auth-form-group">
                    <label for="password" class="auth-form-label">New Password</label>
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

                <button type="submit" class="auth-btn">Reset Password</button>
            </form>
        </div>
    </div>
</div>

@endsection
