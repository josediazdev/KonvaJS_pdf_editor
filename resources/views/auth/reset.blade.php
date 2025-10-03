@extends('components.layout')
@section('title', 'Reset Password')
@section('content')

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
                    <div class="position-relative">
                        <input type="password" id="password" name="password" class="auth-form-input" required>
                        <span class="password-toggle">
                            <i class="bi bi-eye"></i>
                        </span>
                    </div>
                    @error('password')
                        <small class="text-danger">{{ $message }}</small>
                    @enderror
                </div>

                <div class="auth-form-group">
                    <label for="password_confirmation" class="auth-form-label">Confirm Password</label>
                    <div class="position-relative">
                        <input type="password" id="password_confirmation" name="password_confirmation" class="auth-form-input" required>
                        <span class="password-toggle">
                            <i class="bi bi-eye"></i>
                        </span>
                    </div>
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
