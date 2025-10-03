# 🚀 PDF Editor - Futuristic PDF Annotation Tool

[![Laravel](https://img.shields.io/badge/Laravel-12.x-red.svg)](https://laravel.com)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-blue.svg)](https://getbootstrap.com)
[![Konva.js](https://img.shields.io/badge/Konva.js-10.x-orange.svg)](https://konvajs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A cutting-edge web application for uploading, viewing, and annotating PDF documents with a sleek, futuristic UI. Built with Laravel and modern frontend technologies for a seamless user experience.

## ✨ Features

### 🔐 **Authentication System**
- **User Registration & Login**: Secure authentication with email verification
- **Email Verification**: Automated email sending with custom-styled templates
- **Password Reset**: Secure password recovery with tokenized links
- **Session Management**: Manual logout and Laravel session handling

### 👤 **User Profile Management**
- **Profile Editing**: Update email address with current password verification
- **Password Change**: Secure password update with confirmation
- **Account Deletion**: Permanently delete user account and all associated data

### 📄 **PDF Management**
- **PDF Upload**: Click-to-upload functionality
- **PDF Viewing**: Integrated PDF.js for high-quality document rendering
- **Annotation Tools**: Draw, highlight, and annotate PDFs using Konva.js
- **Interactive Editing**: Interactive canvas for precise annotations
- **Export Options**: Save edited PDFs with jsPDF integration

### 🎨 **Futuristic UI/UX**
- **Dark Theme Navbar**: Sleek black gradient with neon accents
- **Responsive Design**: Mobile-first approach with Bootstrap 5
- **Interactive Forms**: Password visibility toggles, focus indicators
- **Gradient Backgrounds**: Radial gradients for immersive experience
- **Email Templates**: Modern, branded email designs for notifications

### 🛡️ **Security & Performance**
- **CSRF Protection**: Laravel's built-in security measures
- **Input Validation**: Server-side and client-side validation
- **File Upload Security**: Restricted file types and size limits
- **Optimized Assets**: Vite bundling for fast loading

## 🛠️ Tech Stack

### Backend
- **Laravel 12.x**: PHP framework for robust backend development
- **MySQL/SQLite**: Database for user and file storage
- **Composer**: PHP dependency management

### Frontend
- **Bootstrap 5.3**: Responsive CSS framework
- **Konva.js 10.x**: 2D canvas library for PDF annotations
- **PDF.js 3.x**: PDF rendering and manipulation
- **jsPDF 1.5**: PDF generation and export
- **Vite**: Modern build tool for assets

### Additional Tools
- **Mailtrap/SMTP**: Email service for notifications
- **Font Awesome/Bootstrap Icons**: Icon library
- **SCSS**: Custom styling with CSS variables

## 🚀 Quick Start

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js & NPM
- MySQL or SQLite
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pdf-editor.git
   cd pdf-editor
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database Configuration**
   - Update `.env` with your database credentials
   - Run migrations:
     ```bash
     php artisan migrate
     ```

6. **Build Assets**
   ```bash
   npm run build
   # or for development
   npm run dev
   ```

7. **Start the Development Server**
   ```bash
   php artisan serve
   ```

8. **Access the Application**
   - Open `http://localhost:8000` in your browser
   - Register a new account or login

## 📖 Usage Guide

### For Users
1. **Register/Login**: Create an account with email verification
2. **Upload PDF**: Use the "Upload New PDF" button to select a file
3. **Manage Profile**: Access the Profile section to update your email, change password, or delete your account
4. **Annotate**: Use drawing tools to add notes or images
5. **Save/Export**: Download the edited PDF with your annotations

### For Developers
- **Routes**: Check `routes/web.php` for available endpoints
- **Controllers**: Authentication in `Http/Controllers/Auth/`
- **Views**: Blade templates in `resources/views/`
- **Assets**: SCSS/JS in `resources/` compiled with Vite

## 🔧 Configuration

### Email Settings
Update `.env` for email configuration:
```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
```

### File Upload
Configure upload limits in `php.ini` or `.env`:
```env
FILESYSTEM_DISK=local
MAX_FILE_SIZE=10240  # KB
```

## 📁 Project Structure

```
pdf-editor/
├── app/
│   ├── Http/Controllers/
│   │   ├── Auth/          # Authentication controllers
│   │   ├── ProfileController.php  # User profile management
│   │   └── PdfEditController.php
│   ├── Mail/             # Email classes
│   └── Models/           # Eloquent models
├── resources/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── views/            # Blade templates
├── routes/
│   └── web.php           # Route definitions
├── public/               # Public assets
├── storage/              # File storage
└── database/
    └── migrations/       # Database schemas
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The PHP framework
- [Bootstrap](https://getbootstrap.com) - CSS framework
- [Konva.js](https://konvajs.org) - Canvas library
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering

**Made with ❤️ for seamless PDF editing experiences**
