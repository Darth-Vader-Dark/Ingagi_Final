# Ingagi - Smart Dining & Hospitality Platform

A comprehensive ERP + POS system for restaurants and hotels in Rwanda, built with Next.js 15, JWT authentication, and MongoDB Atlas.

## 🚀 Features

- **Multi-Role User System**: Super Admin, Restaurant Admin, Manager, Waiter, Kitchen, Receptionist, Inventory
- **Restaurant Management**: Registration, approval workflow, menu management, order processing
- **JWT Authentication**: Secure, stateless authentication system
- **MongoDB Integration**: Scalable database with proper indexing and data models
- **Payment Integration**: MTN Money and Airtel Money mobile payment support (ready for API integration)
- **QR Code Menus**: Digital menu access via QR codes
- **Role-Based Dashboards**: Specialized interfaces for each user type
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Authentication**: JWT with bcrypt password hashing
- **Database**: MongoDB Atlas with proper indexing
- **Payment**: Ready for MTN Money and Airtel Money API integration
- **Deployment**: Ready for Vercel, Netlify, or any Node.js hosting

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- npm, yarn, or pnpm

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Ingag_Final
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy the example environment file and configure it:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ingagi?retryWrites=true&w=majority

# JWT Secret Key (generate a strong random string for production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 4. Initialize the database

```bash
npm run init-db
```

This will:
- Create necessary database collections
- Set up proper indexes for performance


### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication System

The platform uses JWT (JSON Web Tokens) for secure, stateless authentication:

- **Login**: `/api/auth/login` - Authenticate users and return JWT token
- **Register**: `/api/auth/register` - Register new restaurant managers
- **Verify**: `/api/auth/verify` - Verify JWT token validity
- **Employee Registration**: `/api/auth/register-employee` - Managers can register staff

### Default Super Admin Account

After running `npm run init-db`, you'll have access to:

- **Email**: `superingagi@ingagi.com`
- **Password**: `admin123`
- **Role**: Super Admin

⚠️ **Important**: Change this password immediately after first login!

## 🗄️ Database Schema

### Collections

1. **users** - User accounts with role-based access
2. **restaurants** - Restaurant information and settings
3. **menuItems** - Menu items for each restaurant
4. **orders** - Customer orders and payment status

### Key Indexes

- Email uniqueness for users
- Restaurant ID lookups
- Role-based queries
- Performance optimization for common operations

## 🏗️ Project Structure

```
Ingag_Final/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── restaurants/   # Restaurant management
│   │   └── payment/       # Payment processing
│   ├── admin/             # Super admin dashboard
│   ├── manager/           # Restaurant manager dashboard
│   ├── waiter/            # Waiter interface
│   └── kitchen/           # Kitchen management
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── scripts/                # Database initialization
└── styles/                 # Global styles
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Restaurant registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/register-employee` - Employee registration

### Restaurants
- `GET /api/restaurants` - List restaurants (with filters)
- `POST /api/restaurants` - Create new restaurant
- `GET /api/restaurant/[id]` - Get restaurant details
- `PUT /api/restaurant/[id]` - Update restaurant

### Menus
- `GET /api/restaurant/[id]/menu` - Get restaurant menu
- `POST /api/restaurant/[id]/menu` - Add menu item

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
NEXTAUTH_URL=https://your-domain.com
```

## 🔒 Security Features

- JWT token expiration (7 days)
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting ready

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real MTN Money and Airtel Money API integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Inventory management system
- [ ] Customer loyalty programs
- [ ] Robot waiter integration
- [ ] Multi-language support (Kinyarwanda, French, English)

---

Built with ❤️ in Rwanda 🇷🇼
