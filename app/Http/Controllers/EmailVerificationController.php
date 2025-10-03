<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmailVerificationMail;

/**
 * Controller for handling email verification processes.
 * Manages displaying verification notices, sending verification emails, and verifying emails.
 */
class EmailVerificationController extends Controller
{
    /**
     * Display the email verification notice page.
     * Redirects verified users to home; otherwise, shows the verification page.
     *
     */
    public function notice()
    {
        // Check if the authenticated user has already verified their email
        if (auth()->user()?->hasVerifiedEmail()) {
            return redirect()->route('home');
        }

        return view('auth.verify-email');
    }

    /**
     * Send a new email verification link to the authenticated user.
     * Generates a temporary signed URL and sends it via email.
     */
    public function send(Request $request)
    {
        // Get the authenticated user
        $user = $request->user();
        // Abort if no user is authenticated (should not happen due to middleware)
        abort_if(!$user, 403);

        // Generate a temporary signed URL for verification (valid for 60 minutes)
        // Uses user ID and a hash of the email for security
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1($user->email)]

        );

        // Send the verification email using the Mailable class
        Mail::to($user->email)->send(new EmailVerificationMail($url, $user));

        // Redirect back with a success status message
        return back()->with('status', 'verification-link-sent');
    }

    /**
     * Verify the user's email using the signed URL.
     * Checks the hash, marks email as verified if valid, and redirects to home.
     *
     */
    public function verify(Request $request, $id, $hash)
    {

        $user = \App\Models\User::findOrFail($id);

        // Verify the hash matches the user's email; abort if invalid
        abort_unless(hash_equals((string) $hash, sha1($user->email)), 403);

        // If the email is not already verified, set the verification timestamp
        if (! $user->hasVerifiedEmail()) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return redirect()->route('home')->with('status', 'Email verified!');
    }
}
