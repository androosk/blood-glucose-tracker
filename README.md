# GlucoseMojo 🩸📱

A modern Progressive Web App (PWA) for tracking blood glucose levels with smart reminders and insightful analytics.

## ✨ Features

### 📊 Smart Tracking
- **Quick Entry**: Preset buttons for common glucose values (70-150 mg/dL)
- **Meal Context**: Track carbohydrates and meal timing
- **Flexible Timing**: Add readings with custom timestamps
- **Reading Types**: Fasting, pre-meal, post-meal (30/90 min), and random

### 🔔 Smart Reminders
- **Automated Notifications**: 30 and 90-minute post-meal reminders
- **Web Push API**: Native notifications across all devices
- **Customizable**: Configure reminder intervals in settings

### 📈 Data Visualization
- **Daily Timeline**: Today's readings with trend visualization
- **Weekly Overview**: 7-day glucose trends and patterns
- **Monthly Analysis**: Patterns by time of day
- **Color-Coded Ranges**: Visual feedback for target ranges
- **Statistics**: Daily averages, highs, lows, and reading counts

### 🌙 User Experience
- **Dark Mode**: Automatic system preference detection
- **PWA Installation**: Add to home screen for app-like experience
- **Mobile Optimized**: Designed for one-handed glucose monitoring
- **Offline Ready**: Service worker caching for reliable access
- **Export Data**: CSV export for healthcare providers

## 🚀 Live Demo

**Try it now**: [glucosemojo.com](https://glucosemojo.com)

### Installation
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android/Desktop**: Click install button or use browser menu

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **React 18** with modern hooks and patterns
- **Tailwind CSS** for responsive design and dark mode
- **Recharts** for data visualization
- **next-pwa** for Progressive Web App features
- **Lucide React** for consistent iconography

### Backend
- **Supabase** (PostgreSQL with real-time capabilities)
- **Row Level Security** for data isolation
- **Supabase Auth** for secure authentication
- **Web Push API** for notifications

### Deployment
- **Vercel** for hosting and CI/CD
- **Custom Domain** with SSL/TLS
- **Environment Variables** for secure configuration

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/androosk/blood-glucose-tracker.git
   cd blood-glucose-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL migrations from `LOCAL_TESTING.md`
   - Enable Email authentication

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Visit** `http://localhost:8000`

### Database Setup

The app requires these Supabase tables with Row Level Security:
- `profiles` - User settings and preferences
- `readings` - Blood glucose measurements
- `meals` - Meal tracking for post-meal reminders
- `notification_subscriptions` - Web push notification endpoints

See `LOCAL_TESTING.md` for complete SQL schema and policies.

## 🧪 Testing

### Local Testing
```bash
npm run build        # Test production build
npm run lint         # Check code quality
```

### PWA Testing
1. Build and serve locally: `npm run build && npm start`
2. Test in Chrome DevTools → Application → Service Workers
3. Verify manifest and icon loading
4. Test notification permissions

### User Testing Checklist
- [ ] Register new account
- [ ] Add glucose readings with different types
- [ ] Test preset buttons vs manual entry
- [ ] Verify post-meal reminders trigger
- [ ] Check data visualization accuracy
- [ ] Test PWA installation flow
- [ ] Verify offline functionality
- [ ] Test export to CSV
- [ ] Check dark mode toggle

## 🔒 Security & Privacy

### Data Protection
- **Row Level Security**: Users can only access their own data
- **Input Validation**: All form inputs validated and sanitized
- **HTTPS Everywhere**: Encrypted data transmission
- **No Email Exposure**: Feedback system uses Formspree

### Authentication
- **Supabase Auth**: Industry-standard email/password authentication
- **Session Management**: Secure token-based sessions
- **Route Protection**: Middleware enforces authentication

### Health Data Considerations
- Data stored in Supabase (PostgreSQL)
- User owns and controls their data
- Export functionality for data portability
- Consider HIPAA compliance for healthcare use

## 📱 Browser Support

### PWA Installation
- **Chrome/Edge**: Direct install prompts
- **Safari**: Add to Home Screen
- **iOS Chrome**: Redirect to Safari (limitation of iOS)
- **Android**: Full PWA support

### Notifications
- **Desktop**: Chrome, Firefox, Edge, Safari
- **Mobile**: iOS Safari, Android Chrome
- **Requirements**: HTTPS and user permission

## 🤝 Contributing

We welcome contributions! This is an open-source project with protected main branch.

### Contributing Guidelines
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Workflow
- Main branch is protected - all changes via PR
- TypeScript and ESLint must pass
- Test your changes locally first
- Include screenshots for UI changes

## 🐛 Issues & Feedback

- **Bug Reports**: [GitHub Issues](https://github.com/androosk/blood-glucose-tracker/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/androosk/blood-glucose-tracker/discussions)
- **Quick Feedback**: Use the in-app feedback button

## 🎯 Roadmap

### Future Enhancements
- 🔄 **Offline Data Entry**: IndexedDB with sync when online
- 📱 **React Native App**: Native iOS/Android companion
- 🔗 **CGM Integration**: Dexcom, Libre device connectivity
- 💉 **Insulin Tracking**: Dosage and timing correlations
- 🍎 **Health App Sync**: Apple Health / Google Fit integration
- 👨‍👩‍👧‍👦 **Family Sharing**: Caregiver access and monitoring
- 🤖 **AI Insights**: Pattern recognition and predictions
- 🍕 **Food Database**: Carb lookup and meal logging

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏥 Disclaimer

**Important**: This app is for tracking and informational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult with your healthcare provider about your diabetes management.

---

**Built with ❤️ for the diabetes community**

*GlucoseMojo helps you take control of your health with smart blood sugar monitoring.*
