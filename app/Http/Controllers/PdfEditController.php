<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PdfEditController extends Controller
{
    public function edit(Request $request)
    {
        // validate the PDF file
        $request->validate([
            'pdf_file' => 'required|mimes:pdf|max:10240',
            // make sure it's a PDF, max 10MB
        ]);

        $file = $request->file('pdf_file');

        // read the file content as binary data using file_get_contents() function and return string
        $pdf_content = file_get_contents($file->getRealPath());

        // transform the binary data into ascii text to be send to the view on the frontend
        $pdf_data_base64 = base64_encode($pdf_content);


        return view('edit', ['pdfBase64' => $pdf_data_base64]);
    }
}
