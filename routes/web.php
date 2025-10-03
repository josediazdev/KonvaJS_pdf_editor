<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfEditController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfileController;


Route::middleware('guest')->group(function () {
    Route::view('/register', 'auth.register')->name('register.show');
    Route::post('/register', [RegisterController::class, 'store'])->name('register');

    Route::view('/login', 'auth.login')->name('login.show');
    Route::post('/login', [LoginController::class, 'login'])->name('login');

    Route::view('/forgot-password', 'auth.forgot')->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendLink'])->name('password.email');

    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showReset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.update');

});




Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    // email verification once the user is signed
    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware('signed')
        ->name('verification.verify');

    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])->middleware('throttle:6,1')
        ->name('verification.send');

    Route::view('/', 'upload')->middleware('verified')->name('home');
    Route::post('/render', [PdfEditController::class, 'edit'])->middleware('verified');

    Route::get('/profile', [ProfileController::class, 'show'])->middleware('verified');
    Route::post('/profile', [ProfileController::class, 'save'])->middleware('verified');
    Route::patch('/profile', [ProfileController::class, 'update'])->middleware('verified');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->middleware('verified');
});
