# Smart Gallery

A modern, AI-enhanced photo gallery app built with React Native and Expo, featuring a sleek, premium design with smooth animations and transitions.

## Features

- **Modern & Premium UI**: Minimalistic design with soft shadows, rounded edges, and glassmorphism effects
- **Adaptive Light & Dark Mode**: Beautiful interface in both light and dark themes with neon accents
- **Smooth Transitions & Animations**: Micro-interactions and fluid animations for a polished user experience
- **AI-Powered Features**: Smart categorization and search capabilities
- **Local Gallery Integration**: Access and manage photos from your device

## Design Highlights

### Enhanced Bottom Navigation
- Sleek, floating bottom navigation bar with soft shadows
- Modern, minimalistic icons for each section
- Active state highlights with subtle glow and color change

### Improved Home Page Layout
- Modern, rounded square sections that blend seamlessly with the design
- Soft gradient backgrounds with subtle shadow effects for depth
- Larger, centered text and icons for better readability

### Enhanced Image Grid Display
- Masonry layout with uniform card-based design
- Light hover effects and rounded borders for a premium feel
- Well-spaced images maintaining a clean, uniform look

### Refined Search Bar
- Sleek, pill-shaped search bar with search icon
- Subtle glassmorphism effect for a modern feel
- Placeholder text in light gray for subtle contrast

### Interactions & Animations
- Smooth page transitions with subtle fade effects
- Hover and tap effects for a more engaging experience
- Micro-interactions on icon clicks for a premium feel

### Color & Style
- Dark mode with semi-transparent, glass-like elements
- Clean typography using system fonts
- Neon blue highlights for accents

## App Structure

### Home / Gallery Page (Main Screen)

- **App Bar (Header)**
  - Title: "Smart Gallery"
  - Profile Icon: For user settings & profile access
  - Search Bar: AI-powered search input

- **Category Tabs (Scrollable)**
  - All Photos 📸 (Default selected)
  - Favorites ❤️
  - People 🧑‍🤝‍🧑 (AI-based face classification)
  - Recently Deleted 🗑️
  - Albums 📂 (For custom-created folders)

- **Image Grid View (Main Content)**
  - Responsive masonry grid layout
  - Rounded square thumbnails with animations
  - Lazy loading for smooth performance

- **Floating Action Button (FAB)**
  - Import Image (from device/gallery)
  - AI-Powered Image Q&A
  - Open Camera

- **Bottom Navigation Bar**
  - Gallery (Active state)
  - Search
  - People
  - Favorites
  - Settings

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/smart-gallery.git
cd smart-gallery
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following content:
```
OPENAI_API_KEY=your_openai_api_key_here
```
Replace `your_openai_api_key_here` with your actual OpenAI API key. You can get an API key by signing up at [OpenAI's platform](https://platform.openai.com/).

4. Start the development server
```
npm start
```

5. Open the app on your device using the Expo Go app or run on an emulator

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Media Library
- Expo Image Picker
- Animated API for smooth animations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by SF Symbols
- Design inspiration from modern mobile UI/UX trends
