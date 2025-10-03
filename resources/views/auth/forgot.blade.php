@extends('components.layout')
@section('title', 'Forgot Password')
@section('content')

<div class="auth-container">
    <div class="auth-wrapper">
        <header class="auth-header">
            <h1 class="auth-title">Forgot Password</h1>
            <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>
        </header>

        @if (session('status'))
            <div class="auth-success">
                {{ session('status') }}
            </div>
        @endif

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
