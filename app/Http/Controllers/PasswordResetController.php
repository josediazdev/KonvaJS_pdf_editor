<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use App\Mail\PasswordResetMail;

/**
 * Controller for handling password reset processes.
 * Manages sending reset links, displaying reset forms, and updating passwords.
 */
class PasswordResetController extends Controller
{
    /**
     * Send a password reset link to the provided email.
     * Generates a token, stores it hashed, and sends an email with the reset link.
     */
    public function sendLink(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email']
        ]);

        // Find the user by email
        $user = \App\Models\User::where('email', $data['email'])->first();

        // If user does not exist, return with a generic message for security
        if (! $user) {
            return back()->with(
                'status', 'If the email exists, a reset link was sent'
            );
        }

        // Generate a random token for the reset link
        $rawToken = Str::random(64);

        // Hash the token for secure storage
        $hashed = hash('sha256', $rawToken);

        // Store or update the hashed token in the database with creation time
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => $hashed, 'created_at' => now()]
        );

        // Generate the reset URL with token and email as query param
        $url = route('password.reset', [
            'token' => $rawToken,
            'email' => $user->email
        ]);

        // Send the reset email using the Mailable class
        Mail::to($user->email)->send(new PasswordResetMail($url, $user));

        // Redirect back with success message
        return back()->with(
            'status',
            'If the email exists, a reset link was sent'
        );

    }

    /**
     * Display the password reset form.
     * Shows the form with the token and email pre-filled from the URL.
     *
     */
    public function showReset(Request $request, $token)
    {
        // Get the email from the query parameters
        $email = $request->query('email');

        // Return the reset password view with token and email
        return view('auth.reset', ['token' => $token, 'email' => $email]);
    }

    /**
     * Reset the user's password using the token and new password.
     * Validates the token, updates the password, deletes the token, and logs in the user.
     */
    public function reset(Request $request){

        // Validate the reset form data
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        // Retrieve the token record from the database
        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        // Abort if no record found
        abort_unless($record, 400);

        // Check if the token is valid and not expired (60 minutes)
        $valid = hash_equals($record->token, hash('sha256', $data['token']))
            && now()->diffInMinutes($record->created_at) <= 60;
        // Abort if token is invalid or expired
        abort_unless($valid, 400);

        // Update the user's password (hashed)
        $user = \App\Models\User::where('email', $data['email'])->firstOrFail();
        $user->forceFill(['password' => Hash::make($data['password'])])->save();

        // Delete the used token to prevent reuse
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        // Log in the user automatically
        auth()->login($user);
        //
        // Regenerate session for security
        $request->session()->regenerate();


        return redirect()->route('home')->with('status', 'Password updated.');

    }

}
