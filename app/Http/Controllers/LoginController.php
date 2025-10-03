<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Controller for handling user authentication.
 * Manages login, logout, and rate limiting for security.
 */
class LoginController extends Controller
{
    /**
     * Handle user login with validation, rate limiting, and authentication.
     * Prevents brute force attacks and redirects on success.
     *
     */
    public function login(Request $request)
    {
        // Validate the login form inputs
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        // Generate a unique key for rate limiting based on email and IP
        $key = $this->throttleKey($request);

        // Check if the user has exceeded the login attempt limit (5 attempts)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors([
                'email' => 'Too many login attemps, please try again in '.RateLimiter::availableIn($key).' seconds'
            ])->onlyInput('email');
        }

        // Extract credentials and remember flag
        $credentials = $request->only('email','password');
        $remember = (bool) $request->boolean('remember');

        // Attempt authentication
        if (! auth()->attempt($credentials, $remember)) {
            // Increment the rate limiter on failure
            RateLimiter::hit($key, 60);
            return back()->withErrors([
                'email' => 'The provided credentials are incorrect'
            ])->onlyInput('email');
        }

        // Clear the rate limiter on successful login
        RateLimiter::clear($key);

        // Regenerate the session for security
        $request->session()->regenerate();

        // Redirect to home
        return redirect()->route('home');

    }

    /**
     * Handle user logout by invalidating the session and regenerating CSRF token.
     * Redirects to the login page.
     */
    public function logout(Request $request)
    {
        // Log out the authenticated user
        auth()->logout();
        // Invalidate the current session
        $request->session()->invalidate();

        // Regenerate the CSRF token for security
        $request->session()->regenerateToken();

        // Redirect to the login page
        return redirect()->route('login.show');

    }

    /**
     * Generate a unique throttle key for rate limiting based on email and IP.
     * Used to track login attempts per user/IP combination.
     */
    protected function throttleKey(Request $request): string
    {
        // Create a key combining lowercase email and IP address
        return Str::lower($request->input('email')).'|'.$request->ip();
    }

}
