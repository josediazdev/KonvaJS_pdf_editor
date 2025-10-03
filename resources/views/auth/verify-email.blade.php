@extends('components.layout')
@section('title', 'Verify Email')
@section('content')

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
