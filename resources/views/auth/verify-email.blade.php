@extends('components.layout')
@section('title', 'Verify Email')
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
            <h1 class="auth-title">Verify Your Email</h1>
            <p class="auth-subtitle">We've sent a verification link to your email address</p>
        </header>

        <div class="auth-form-container">
            <div class="text-center">
                <p class="mb-4">Please check your inbox and click the link to verify your account.</p>

                @if (session('status') == 'verification-link-sent')
                    <div class="auth-success mb-4">
                        A new verification email has been sent to your email address.
                    </div>
                @endif

                <form method="POST" action="{{ route('verification.send') }}" class="d-inline">
                    @csrf
                    <button type="submit" class="auth-btn">Resend Verification Link</button>
                </form>

                <form method="POST" action="{{ route('logout') }}" class="d-inline ms-3">
                    @csrf
                    <button type="submit" class="auth-btn auth-btn-secondary">Log Out</button>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection
