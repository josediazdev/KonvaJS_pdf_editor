<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfEditController;


Route::view('/', 'upload');
Route::post('/render', [PdfEditController::class, 'edit']);
