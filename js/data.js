const COLLECTIONS = [
  {
    id: 1,
    artist: "0xNova",
    avatar: "images/avatar_nova.png",
    bio: "Digital surrealist exploring the intersection of AI and human consciousness.",
    wallet: "0x1a2b3c4d5e6f...9a0b",
    totalEarnings: 48.72,
    followers: 3210,
    items: [
      { id: 101, name: "Neon Genesis #1", price: 2.5, image: "images/art_surreal.png", category: "Art", likes: 142, sold: false },
      { id: 102, name: "Fractured Reality", price: 1.8, image: "images/art_glitch.png", category: "Art", likes: 98, sold: true },
      { id: 103, name: "Void Walker", price: 3.2, image: "images/art_metaverse.png", category: "3D", likes: 201, sold: false },
      { id: 104, name: "Pulse Signal", price: 0.9, image: "images/art_photo.png", category: "Animation", likes: 67, sold: false },
      { id: 105, name: "Cyber Cityscape", price: 3.1, image: "images/art1.jpeg", category: "Art", likes: 85, sold: true },
      { id: 106, name: "Ethereal Dreamer", price: 1.5, image: "images/art_photo.png", category: "Photography", likes: 124, sold: true },
      { id: 107, name: "Neon Glitch World", price: 2.0, image: "images/art2.jpeg", category: "Glitch", likes: 140, sold: true },
      { id: 108, name: "Abstract Fluid", price: 4.5, image: "images/art_obsidian.png", category: "3D", likes: 95, sold: true },
      { id: 109, name: "Retro Wave", price: 1.2, image: "images/art3.jpeg", category: "Pixel Art", likes: 62, sold: true },
      { id: 110, name: "Synth Horizon", price: 2.8, image: "images/art_surreal.png", category: "Art", likes: 110, sold: false }
    ]
  },
  {
    id: 2,
    artist: "CryptoMuse",
    avatar: "images/avatar_muse.png",
    bio: "Collector of rare moments, sculptor of digital dreams.",
    wallet: "0x2b3c4d5e6f7a...0b1c",
    totalEarnings: 91.4,
    followers: 7840,
    items: [
      { id: 201, name: "Ethereal Dawn", price: 5.0, image: "images/art_photo.png", category: "Photography", likes: 320, sold: false },
      { id: 202, name: "Digital Alchemy", price: 7.5, image: "images/art_hero.png", category: "Art", likes: 415, sold: true },
      { id: 203, name: "Muse Protocol", price: 2.2, image: "images/art_metaverse.png", category: "Music", likes: 189, sold: false },
    ]
  },
  {
    id: 3,
    artist: "GlitchGod",
    avatar: "images/avatar_glitch.png",
    bio: "Error is the new aesthetic. Breaking pixels since 2019.",
    wallet: "0x3c4d5e6f7a8b...1c2d",
    totalEarnings: 29.15,
    followers: 1560,
    items: [
      { id: 301, name: "404 Mind", price: 1.1, image: "images/art_glitch.png", category: "Glitch", likes: 88, sold: false },
      { id: 302, name: "Corrupted Eden", price: 1.6, image: "images/art_surreal.png", category: "Glitch", likes: 102, sold: false },
      { id: 303, name: "Stack Overflow", price: 0.75, image: "images/art_photo.png", category: "Animation", likes: 54, sold: true },
      { id: 304, name: "Segfault Dreams", price: 2.0, image: "images/art_metaverse.png", category: "3D", likes: 77, sold: false },
      { id: 305, name: "RAM Reaper", price: 1.3, image: "images/art_glitch.png", category: "Glitch", likes: 60, sold: false },
    ]
  },
  {
    id: 4,
    artist: "PixelSaint",
    avatar: "images/avatar_saint.png",
    bio: "Pixel perfectionist. Every dot is intentional.",
    wallet: "0x4d5e6f7a8b9c...2d3e",
    totalEarnings: 63.88,
    followers: 5120,
    items: [
      { id: 401, name: "Holy Pixel", price: 4.0, image: "images/art_pixel.png", category: "Pixel Art", likes: 260, sold: false },
      { id: 402, name: "8-Bit Heaven", price: 3.5, image: "images/art_pixel.png", category: "Pixel Art", likes: 198, sold: true },
      { id: 403, name: "Sprite Spirit", price: 2.8, image: "images/art_pixel.png", category: "Pixel Art", likes: 174, sold: false },
    ]
  },
  {
    id: 5,
    artist: "MetaVera",
    avatar: "images/avatar_vera.png",
    bio: "Building worlds inside worlds. Metaverse architect.",
    wallet: "0x5e6f7a8b9c0d...3e4f",
    totalEarnings: 112.5,
    followers: 11200,
    items: [
      { id: 501, name: "World Zero", price: 12.0, image: "images/art_metaverse.png", category: "3D", likes: 540, sold: false },
      { id: 502, name: "Genesis Block", price: 8.0, image: "images/art_hero.png", category: "Art", likes: 390, sold: true },
      { id: 503, name: "Infinite Lobby", price: 5.5, image: "images/art_metaverse.png", category: "3D", likes: 310, sold: false },
      { id: 504, name: "Respawn Point", price: 3.0, image: "images/art_surreal.png", category: "Animation", likes: 220, sold: false },
    ]
  },
  {
    id: 6,
    artist: "DarkChain",
    avatar: "images/avatar_dark.png",
    bio: "Shadows encoded on-chain. Darkness as a medium.",
    wallet: "0x6f7a8b9c0d1e...4f5a",
    totalEarnings: 37.6,
    followers: 2890,
    items: [
      { id: 601, name: "Shadow Mint", price: 2.1, image: "images/art_obsidian.png", category: "Dark Art", likes: 130, sold: false },
      { id: 602, name: "Obsidian Drop", price: 1.9, image: "images/art_obsidian.png", category: "Dark Art", likes: 115, sold: false },
      { id: 603, name: "Abyss Protocol", price: 3.8, image: "images/art_metaverse.png", category: "3D", likes: 167, sold: true },
    ]
  }
];

// Logged-in artist (simulated session)
const CURRENT_ARTIST_ID = 1;
