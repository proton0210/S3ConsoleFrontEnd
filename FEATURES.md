# S3Console - Feature Reference

A powerful desktop S3 client built with Electron, React, and the AWS SDK v3.

---

## 🔐 Authentication & Profiles

| Feature                           | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| **AWS Access Keys**               | Manual entry or select from `~/.aws/credentials`         |
| **AWS Session Token**             | Support for temporary credentials (STS) and manual entry |
| **AWS SSO / IAM Identity Center** | Full OAuth device authorization flow                     |
| **Multi-Profile Support**         | Create, switch, and manage multiple AWS profiles         |
| **Session Credentials**           | Automatic token refresh for SSO sessions                 |
| **License System**                | 7-day trial, license key activation                      |

---

## 📦 Bucket Operations

### Core

- List all S3 buckets (with refresh)
- Create bucket with advanced configuration
- Empty bucket (bulk delete all objects)
- Delete bucket (with optional force-empty)

### Create Bucket Options

| Option                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| Region                 | All AWS regions (excluding China)                |
| Versioning             | Enable/disable object versioning                 |
| Block Public Access    | 4 granular public access settings                |
| Encryption             | None, SSE-S3, or SSE-KMS (with custom key ARN)   |
| Object Lock            | WORM compliance (permanent, requires versioning) |
| Static Website Hosting | Index document, error document, auto-policy      |

### Bucket Insights

- **Cost Estimation** - Real-time monthly storage cost calculation based on Standard tier pricing

---

## 📁 Object Management

### Browsing

- Paginated object listing (100/page with next/prev)
- Folder navigation with breadcrumbs
- "Up" button for parent directory
- Sort by name, size, last modified

### Actions

| Action            | Description                                 |
| ----------------- | ------------------------------------------- |
| **Upload**        | Files & folders via button or drag-and-drop |
| **Download**      | Single file with save dialog                |
| **Delete**        | Single object or batch deletion             |
| **Delete Folder** | Recursive deletion of all contents          |
| **Create Folder** | New folder in current path                  |
| **Copy Object**   | Within same bucket (multipart for >5GB)     |
| **Preview**       | Inline preview for images & text            |
| **Copy ARN**      | Copy object ARN to clipboard                |

### Upload Features

- Progress tracking per file
- Cancel individual or all uploads
- Retry failed uploads
- Resume pending uploads on restart
- Background upload processing

---

## 🔗 Sharing & URLs

| Feature              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| **Presigned URLs**   | Generate time-limited shareable links (1 min - 7 days) |
| **Copy Website URL** | One-click copy for static website hosted buckets       |

---

## 🔒 Access Control

Unified modal with 5 tabs for comprehensive access management:

### 1. ACL (Access Control Lists)

- **Canned ACLs**: private, public-read, public-read-write, authenticated-read, etc.
- **Custom ACL**: Granular grants with:
  - Canonical User ID
  - Email address
  - Group URIs (AllUsers, AuthenticatedUsers, LogDelivery)
- Permissions: READ, WRITE, READ_ACP, WRITE_ACP, FULL_CONTROL

### 2. Bucket Policy

- JSON editor with syntax highlighting
- **Templates included**:
  - Public Read Access
  - Restricted IP Access
  - CloudFront OAI Access
  - Cross-Account Access
  - Enforce HTTPS
  - VPC Endpoint Access
- Format JSON button
- Create, update, delete policies

### 3. IAM Policy Generator

- Generate IAM policies for external use
- **Templates included**:
  - Read-Only Access
  - Read-Write Access
  - Full Admin Access
  - List Only
  - Upload Only
  - Delete Deny
- Copy to clipboard for IAM console

### 4. Public Access Block

| Setting                   | Description                        |
| ------------------------- | ---------------------------------- |
| Block new public ACLs     | Prevent new public ACL creation    |
| Ignore public ACLs        | Ignore all existing public ACLs    |
| Block new public policies | Prevent public bucket policies     |
| Restrict public buckets   | Ignore public/cross-account access |

### 5. CORS Configuration

- JSON editor for CORS rules
- Create, update, delete CORS config
- Syntax validation

---

## 📊 Storage Class

- View current storage class per bucket
- Modify storage class (Standard, Intelligent-Tiering, Glacier, etc.)

---

## 💻 Code Generation

Generate ready-to-use code in **TypeScript**, **JavaScript**, and **Python**.

### Supported Operations

| Operation            | Description                       |
| -------------------- | --------------------------------- |
| `listBucketObjects`  | List objects with optional prefix |
| `getObject`          | Download object to file           |
| `putObject`          | Upload file to S3                 |
| `deleteObject`       | Delete single or multiple objects |
| `copyObject`         | Copy between locations            |
| `getObjectUrl`       | Generate presigned URL            |
| `createBucket`       | Create new bucket                 |
| `deleteBucket`       | Delete bucket (with empty helper) |
| `getBucketPolicy`    | Retrieve bucket policy            |
| `putBucketPolicy`    | Set/update bucket policy          |
| `deleteBucketPolicy` | Remove bucket policy              |

### Code Execution

- Execute TypeScript/JavaScript/Python snippets directly
- AWS credentials auto-injected
- Console output captured

---

## 🖥️ AWS CLI Integration

Generate and execute AWS CLI commands.

### Supported Commands

| Command                           | Description             |
| --------------------------------- | ----------------------- |
| `aws s3 ls`                       | List buckets or objects |
| `aws s3 cp`                       | Upload/download files   |
| `aws s3 rm`                       | Delete objects          |
| `aws s3 sync`                     | Sync directories        |
| `aws s3 mb`                       | Create bucket           |
| `aws s3 rb`                       | Delete bucket           |
| `aws s3 presign`                  | Generate presigned URL  |
| `aws s3api head-object`           | Get object metadata     |
| `aws s3api list-object-versions`  | List versions           |
| `aws s3api put-bucket-versioning` | Set versioning          |
| `aws s3api get-bucket-location`   | Get bucket region       |

### Execution

- Run CLI commands with credentials injected as environment variables
- Output captured and displayed

---

## 🌐 CloudFront Integration

| Feature                 | Description                       |
| ----------------------- | --------------------------------- |
| **List Distributions**  | View all CloudFront distributions |
| **Create Distribution** | Create with S3 bucket origin      |
| **Update Distribution** | Modify configuration              |
| **Delete Distribution** | Remove distribution               |
| **Invalidate Cache**    | Create invalidation for paths     |

---

## 🎨 User Interface

| Feature               | Description                           |
| --------------------- | ------------------------------------- |
| Dark/Light Theme      | Toggle with system preference support |
| Collapsible Sidebar   | Expand/collapse bucket list           |
| Breadcrumb Navigation | Click-to-navigate path segments       |
| Toast Notifications   | Success, error, info feedback         |
| Loading Skeletons     | Graceful loading states               |
| Keyboard Accessible   | Tab navigation, Enter/Space actions   |
| Tooltips              | Contextual help throughout            |

---

## 🔄 Auto-Update

- Automatic update check on startup
- Download progress indicator
- "Quit & Install" prompt when ready
- GitHub Releases integration

---

## 📧 Support

- In-app support email form
- Attach files/screenshots
- Direct email to support team

---

## 🔐 Security

| Feature                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| Secure Storage         | Credentials stored via electron-store (encrypted) |
| Machine ID Binding     | License tied to hardware fingerprint              |
| Clock Tamper Detection | Prevents trial manipulation                       |
| Credential Validation  | Auto-detect invalid/expired credentials           |
| Context Isolation      | Secure IPC between main/renderer                  |

---

## 📱 Platform Support

| Platform    | Formats                         |
| ----------- | ------------------------------- |
| **macOS**   | DMG, ZIP (Universal, notarized) |
| **Windows** | NSIS Installer, ZIP             |
| **Linux**   | AppImage, DEB, RPM, ZIP         |

---

## 📂 File Preview

### Supported Preview Types

| Type   | Extensions                                  |
| ------ | ------------------------------------------- |
| Images | PNG, JPG, JPEG, GIF, WebP, AVIF, BMP, SVG   |
| Text   | TXT, JSON, XML, HTML, CSS, JS, TS, MD, etc. |

### Preview Features

- Metadata display (size, MIME, lastModified, ETag)
- Human-readable file sizes
- Text truncation for large files (2000 chars)
- Download from preview modal
- Share (presign) from preview modal
- Copy ARN from preview modal

---

## 🛠️ Tech Stack

- **Electron** 35.x
- **React** 19.x
- **TypeScript** 5.x
- **AWS SDK v3** (S3, STS, SSO, CloudFront, CloudWatch, DynamoDB)
- **TanStack Query** (React Query)
- **Zustand** (State management)
- **Tailwind CSS** + **shadcn/ui**
- **Vite** (Renderer bundling)

---

## 📁 Project Structure

```
s3Console/
├── packages/
│   ├── main/           # Electron main process
│   │   └── src/
│   │       ├── index.ts              # Main entry, IPC handlers
│   │       ├── preload.ts            # Context bridge API
│   │       ├── ssoAuth.ts            # SSO authentication
│   │       ├── cloudFrontService.ts  # CloudFront operations
│   │       ├── codeExecutorService.ts # Code execution
│   │       ├── licenseService.ts     # License management
│   │       └── ...
│   └── renderer/       # React frontend
│       └── src/
│           ├── components/           # UI components
│           ├── hooks/                # React Query hooks
│           ├── store/                # Zustand stores
│           └── lib/                  # Utilities, templates
├── scripts/            # Build scripts
└── package.json        # Root package
```

---

## Version

Current: **2.0.5**
