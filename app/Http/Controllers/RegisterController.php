<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Auth\Events\Registered;

/**
 * Controller for handling user registration.
 * Validates data, creates user, triggers verification, and logs in the user.
 */
class RegisterController extends Controller
{
    /**
     * Handle user registration by validating data and creating a new user.
     * Triggers email verification event and logs in the user.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        // Create the new user with validated data (lowercased)
        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
        ]);

        // Trigger the Registered event to send verification email
        event(new Registered($user));

        // Log in the newly registered user
        auth()->login($user);

        // Regenerate the session
        $request->session()->regenerate();


        return redirect()->route('verification.notice');

    }
}
