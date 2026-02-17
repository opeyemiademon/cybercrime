# Digital Evidence Integrity and Chain-of-Custody Management System

A comprehensive web application for managing digital evidence in cybercrime investigations with complete chain-of-custody tracking and integrity verification.

## Features

### Core Functionality
- **Case Management**: Create and manage investigation cases with detailed metadata
- **Evidence Registration**: Upload and register digital evidence with automatic hash generation
- **Hash Verification**: SHA-256 hash generation and integrity verification
- **Chain-of-Custody Logging**: Complete audit trail of all evidence handling
- **Role-Based Access Control**: Admin, Investigator, and Reviewer roles
- **Report Generation**: Export chain-of-custody reports in CSV format

### Security Features
- Automatic SHA-256 hash generation on evidence upload
- Integrity verification with pass/fail status
- Immutable audit trail (append-only logs)
- Hash-chaining for tamper-evident logging
- Role-based access control (RBAC)

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **QR Codes**: qrcode library

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (redirects to login)
│   ├── globals.css              # Global styles
│   ├── login/                   # Authentication
│   │   └── page.tsx
│   ├── dashboard/               # Dashboard with layout
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── cases/                   # Case management
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx         # Case detail with evidence
│   ├── audit-trail/             # Chain-of-custody logs
│   │   └── page.tsx
│   └── users/                   # User management
│       └── page.tsx
├── components/                   # Reusable components
│   ├── Sidebar.tsx              # Navigation sidebar
│   └── Header.tsx               # Page header
├── lib/                         # Utilities and data
│   ├── utils.ts                 # Helper functions
│   └── mockData.ts              # Mock data for demo
├── types/                       # TypeScript definitions
│   └── index.ts
└── package.json
```

## Pages Overview

### 1. Login Page (`/login`)
- User authentication
- Demo credentials provided
- Secure session management

### 2. Dashboard (`/dashboard`)
- Overview statistics
- Recent cases
- Recent activity feed
- System alerts

### 3. Cases (`/cases`)
- List all investigation cases
- Search and filter functionality
- Create new cases
- View case details

### 4. Case Detail (`/cases/[id]`)
- Case information
- Evidence items list
- Upload new evidence
- Verify evidence integrity
- Chain-of-custody events
- Generate reports

### 5. Audit Trail (`/audit-trail`)
- Complete chain-of-custody log
- Search and filter events
- Export to CSV
- Hash chain verification
- Tamper-evident logging

### 6. Users (`/users`)
- User management (Admin only)
- Add/edit/delete users
- Role assignment
- User statistics

## Key Features Implementation

### Evidence Upload & Hashing
- Automatic SHA-256 hash generation on file upload
- Real-time hash calculation feedback
- File metadata capture (size, type, source device)
- Optional MD5 hash for legacy compatibility

### Integrity Verification
- Re-upload file for verification
- Compare with stored hash
- Pass/Fail status display
- Verification timestamp logging

### Chain-of-Custody
- Append-only event logging
- Multiple action types (Collected, Transferred, Analyzed, etc.)
- Performer and recipient tracking
- Purpose documentation
- Hash-chaining for tamper detection

### Reporting
- CSV export of audit trail
- Case-specific reports
- Evidence-specific chain-of-custody
- Comprehensive metadata inclusion

## Database Schema (Backend Reference)

### Users Table
- id, name, email, role, password_hash, created_at

### Cases Table
- id, case_id, title, description, created_by, created_at, status

### Evidence Table
- id, evidence_id, case_id, filename, file_type, source_device
- sha256_hash, md5_hash, size, captured_at, uploaded_by, stored_path

### CustodyLog Table
- id, evidence_id, action, performed_by, performed_to
- purpose, timestamp, prev_log_hash, log_hash

## Testing Scenarios

1. **Upload Evidence**: Upload file → hash generated → stored correctly
2. **Integrity Check**: Modify file → verification fails
3. **Custody Transfer**: Record transfer → appears in audit trail
4. **Access Control**: Unauthorized user → action blocked

## Demo Credentials

- **Email**: admin@evidence.sys
- **Password**: password

## Future Enhancements

- QR code generation for evidence labels
- Digital signatures for custody events
- Full disk imaging support
- Live memory acquisition
- Mobile extraction automation
- PDF report generation with jsPDF
- Real-time notifications
- Advanced search and filtering
- Multi-language support

## Security Considerations

- All passwords should be hashed (bcrypt recommended)
- Implement JWT or session-based authentication
- Enable HTTPS in production
- Implement rate limiting
- Add CSRF protection
- Sanitize all user inputs
- Implement file upload size limits
- Validate file types

## License

This project is developed for educational and professional use in cybercrime investigation.

## Support

For issues and questions, please refer to the project documentation or contact the development team.
