# 👁️ Intuit Battle

> **A decentralized community voting platform where members compete in epic battles, powered by blockchain technology and the Intuition Network.**

![Next.js](https://img.shields.io/badge/Next.js-19.2.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Web3](https://img.shields.io/badge/Web3-Wagmi-purple?logo=ethereum)

---

## ✨ Overview

Intuit Battle is a decentralized voting platform where community members stake TRUST tokens to vote in head-to-head battles. Built on the Intuition Network testnet, it combines wallet-based authentication with role-based access control for a fair and transparent voting experience.

### 🎯 Key Features

- 🔐 **Wallet Authentication** - Connect via WalletConnect/RainbowKit
- 🎭 **Role-Based Access** - Admins and regular users with distinct permissions
- 💎 **TRUST Token Staking** - Stake tokens to cast your vote
- ⚔️ **Battle System** - Watch community members compete in real-time
- 📊 **Battle Statistics** - Track wins, losses, and performance metrics
- 🎨 **Modern UI** - Clean, responsive design with dark theme

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+ and npm/yarn/pnpm
A Supabase account
A wallet with Intuition Network testnet access
```

### Installation

```bash
# Clone the repository
git clone https://github.com/ShabzyConcept/Intuits-Battle.git
cd Intuits-Battle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# (Copy scripts/021_add_user_roles.sql to Supabase SQL Editor and run)

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app! 🎉

---

## 🏗️ Architecture

### Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| **Frontend**   | Next.js 14, React 19, TypeScript |
| **Styling**    | Tailwind CSS, Shadcn/ui          |
| **Database**   | Supabase (PostgreSQL)            |
| **Blockchain** | Intuition Network Testnet        |
| **Web3**       | Wagmi 3.0, RainbowKit, Viem      |
| **State**      | React Hooks, Custom Hooks        |

### Project Structure

```
intuits-battle/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page with member grid
│   ├── battles/           # Battle pages
│   │   ├── page.tsx       # Battle list
│   │   └── create/        # Admin battle creation
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── battle-card.tsx    # Battle voting UI
│   ├── member-card.tsx    # Member display
│   └── ui/               # Shadcn UI components
├── hooks/                 # Custom React hooks
│   ├── useIntuitionClients.ts
│   └── useMemberBattleStats.ts
├── lib/                   # Utilities
│   ├── auth.ts           # Permission checks
│   ├── config.ts         # Chain configuration
│   └── supabase/         # Database clients
├── scripts/              # SQL migrations
│   └── 021_add_user_roles.sql
└── types/                # TypeScript definitions
```

---

## 🔑 Authentication & Roles

### User Roles

| Role             | Permissions                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| **Regular User** | • Create **1 member** only<br>• Vote in battles<br>• View all content        |
| **Admin**        | • Create **unlimited members**<br>• Create battles<br>• All user permissions |

## 🎮 How It Works

### For Regular Users

1. **Connect Wallet** → Click "Connect Wallet" in the header
2. **Create Member** → Create one community member (character)
3. **Watch Battles** → Browse ongoing battles
4. **Vote & Stake** → Stake TRUST tokens to vote for your favorite

### For Admins

1. **Create Members** → Unlimited member creation
2. **Create Battles** → Set up battles between any two members
3. **Manage System** → Full access to all features

### Voting Process

```mermaid
graph LR
    A[Connect Wallet] --> B[Select Battle]
    B --> C[Choose Side]
    C --> D[Enter TRUST Amount]
    D --> E[Stake & Vote]
    E --> F[Vote Recorded]
```

---

## 🗄️ Database Schema

### Core Tables

**`community_members`**

- Members participating in battles
- Tracks creator wallet address
- Stores atom IDs from Intuition Network

**`battles`**

- Head-to-head member competitions
- Real-time vote tracking
- Start/end timestamps

**`battle_votes`**

- One vote per wallet per battle
- Links to member choice
- Immutable vote records

**`admin_wallets`**

- Authorized admin addresses
- Role management system

### Key Functions

```sql
is_admin_wallet(wallet_addr)          -- Check admin status
can_create_member(wallet_addr)        -- Verify creation permission
get_member_battle_stats(member_id)    -- Fetch battle statistics
```

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌐 Blockchain Integration

### Intuition Network Testnet

```typescript
Chain ID: 13579
Network: Intuition Testnet
Currency: tTRUST
RPC: https://testnet.rpc.intuition.systems/
Explorer: https://testnet.explorer.intuition.systems
```

### TRUST Token Staking

Voting requires staking TRUST tokens on member atoms:

- Minimum stake: 1 TRUST
- Tokens are staked on the Intuition protocol
- Votes are recorded on-chain and in database

---

## 📊 Features Deep Dive

### Battle Statistics

- Total battles participated
- Win/loss record
- Win percentage calculation
- Active battles tracking
- Currently winning battles

### Vote Tracking

- Wallet-based authentication
- One vote per wallet per battle
- Real-time vote counting
- Duplicate vote prevention

### Member Management

- Atom creation via Intuition SDK
- Image and metadata storage
- Category-based organization
- Active/inactive states

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Test changes
chore: Build/tooling changes
```

---

## 📝 Documentation

- [Authentication Guide](./AUTH_GUIDE.md) - Complete auth system documentation
- [Setup Guide](./SETUP_AUTH.md) - Quick 5-minute setup
- [TypeScript Types](./types/database.ts) - Database type definitions

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with:

- [Intuition Network](https://intuition.systems) - Decentralized knowledge protocol
- [Supabase](https://supabase.com) - Backend infrastructure
- [Shadcn/ui](https://ui.shadcn.com) - UI components
- [RainbowKit](https://rainbowkit.com) - Wallet connection

---

<div align="center">

**[Website](https://intuits-battle.vercel.app)** • **[Documentation](./AUTH_GUIDE.md)** • **[Issues](https://github.com/ShabzyConcept/Intuits-Battle/issues)**

Made with ❤️ by the Intuition community

</div>
