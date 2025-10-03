<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;


class ProfileController extends Controller
{
    public function show(){

        $user = Auth::user();

        return view('profile.show', ['user' => $user]);
    }

    public function save(){

        request()->validate([
            'email' => [
                'required',
                'email',
                // make sure the email is unique, ignoring current email
                Rule::unique('users')->ignore(Auth::id()),
            ],
            // use the rule CurrentPassword to verify identity
            'current_password' => ['required', 'current_password'],
        ]);
        // If the validation is successful, the entered password matches the user's password.

        // we update the email
        $user = Auth::user();

        $user->update([
            'email' => request('email')
        ]);

        return view('profile.show', ['user' => $user]);
    }


    public function update(){

        request()->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::min(6)->letters()->numbers(), 'confirmed'],
            // use the rule CurrentPassword to verify identity
        ]);



        // update the password
        $user = Auth::user();

        $user->update([
            'password' => request('password')
        ]);

        return view('profile.show', ['user' => $user]);
    }

    public function destroy(){

        // delete the user
        $user = Auth::user();

        $user->delete();

        return redirect('/');
    }
}
