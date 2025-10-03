@extends('components.layout')
@section('title', 'Profile')

@section('content')


    <div class="main-section-container profile-main">

        <div class="section-container profile-information">
            <h3>Profile Information</h3>
            <small>Full Name:</small>
            <p>{{ $user['first_name'] }} {{ $user['last_name'] }}</p>

            <form class="profile-form" action="/profile" method="POST">
                @csrf
                <label for="email">Email</label>
                <input name="email" type="email" id="email" value="{{ $user['email'] }}" required>
                <label for="current_password">Current Password</label>
                <input name="current_password" type="password" id="current_password" required>
                @error('current_password')
                    <small style="color: #FF0000; text-align: left">{{ $message }}</small>
                @enderror
                <small>To update your profile's email you need to insert your password</small>
                <button class="normal-button" type="submit">
                    <small style="color: white">Save</small>
                </button>
            </form>

        </div>

        <div class="section-container update-password">
            <form class="profile-form" method="POST" action="/profile">
                @csrf
                @method('PATCH')

                <label for="current_password">Current Password</label>
                <input name="current_password" type="password" id="current_password" required>

                <div class="one-field">
                    <label for="password">New Password</label>
                    <input name="password" type="password" id="password" required>
                @error('password')
                    <small style="color: #FF0000; text-align: left">{{ $message }}</small>
                @enderror
                </div>
                <div class="one-field">
                    <label for="password_confirmation">Password Confirmation</label>
                    <input name="password_confirmation" type="password" id="password" required>
                </div>
                <button class="normal-button" type="submit">
                    <small style="color: white">Update</small>
                </button>
            </form>
        </div>


        <div class="section-container delete-account">
            <small>Once your account is deleted, all your data is permanently deleted.</small>
            <button form="delete-form" class="cancel-button" type="submit">
                <small style="color: white">Delete account</small>
            </button>
        </div>
    </div>


    <form action="/profile" method="POST" style="visibility: hidden;" id="delete-form">
        @csrf
        @method('DELETE')
    </form>

@endsection
