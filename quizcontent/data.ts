export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
  imageUrls?: string[]; // for questions that might have images as options or question image
}

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does "NPC" stand for?',
    options: [
      "Non-Playable Character",
      "New Player Character",
      "Network Play Controller",
      "Normal Play Class"
    ],
    correctAnswerIndex: 0,
    points: 1
  },
  {
    id: 2,
    question: "What is the name of Thor's enchanted hammer in Marvel?",
    options: [
      "Stormbreaker",
      "Mjolnir",
      "Gungnir",
      "Jarnbjorn"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 3,
    question: "In the context of game development and PC hardware, what is a GPU primarily responsible for?",
    options: [
      "Storing saved game data",
      "Processing audio and sound effects",
      "Rendering graphics and images",
      "Connecting to online multiplayer servers"
    ],
    correctAnswerIndex: 2,
    points: 1
  },
  {
    id: 4,
    question: "In Pac-Man, what is the player's main objective?",
    options: [
      "Defeat dragons",
      "Collect dots while avoiding ghosts",
      "Build cities",
      "Race cars"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 5,
    question: "Which iconic fictional character is the green-armored super soldier protagonist and hero of Microsoft’s flagship Halo video game series?",
    options: [
      "Commander Shepard",
      "Doom Slayer",
      "Master Chief",
      "Samus Aran"
    ],
    correctAnswerIndex: 2,
    points: 1
  },
  {
    id: 6,
    question: "In Attack of Titan, which wall was breached at the very beginning of the story?",
    options: [
      "Wall Rose",
      "Wall Sina",
      "Wall Maria",
      "Wall Sheena"
    ],
    correctAnswerIndex: 2,
    points: 1
  },
  {
    id: 7,
    question: "What was Anakin Skywalker's Jedi Master's name?",
    options: [
      "Qui-Gon Jinn",
      "Obi-Wan Kenobi",
      "Mace Windu",
      "Yoda"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 8,
    question: "In the massive mobile hit Angry Birds, what are the birds trying to recover from the green pigs?",
    options: [
      "Their gold",
      "Their eggs",
      "Their nests",
      "Their feathers"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 9,
    question: 'What does "FPS" usually stand for in gaming?',
    options: [
      "Frames Per Second",
      "Fast Processing System",
      "Full Power Screen",
      "Final Play Session"
    ],
    correctAnswerIndex: 0,
    points: 1
  },
  {
    id: 10,
    question: "Hidetaka Miyazaki is the famous game director behind which notoriously difficult, genre-defining action RPG?",
    options: [
      "Dark Souls",
      "The Legend of Zelda: Breath of the Wild",
      "Final Fantasy VII",
      "Metal Gear Solid"
    ],
    correctAnswerIndex: 0,
    points: 1
  },
  {
    id: 11,
    question: 'Which game popularized the "battle royale" genre worldwide?',
    options: [
      "League of Legends",
      "PUBG",
      "Minecraft",
      "Overwatch"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 12,
    question: "Which Lantern Corps in DC Comics is powered by Fear?",
    options: [
      "Blue Lantern Corps",
      "Green Lantern Corps",
      "Yellow Lantern Corps",
      "Red Lantern Corps"
    ],
    correctAnswerIndex: 2,
    points: 1
  },
  {
    id: 13,
    question: "In the deep lore of FromSoftware’s dark fantasy masterpiece Elden Ring, what was the name of the catastrophic event involving the shattering of the titular ring that triggered a massive war among the demigod offspring of Queen Marika?",
    options: [
      "The Long Night",
      "The Shattering",
      "The Eclipse",
      "The Great Rupture"
    ],
    correctAnswerIndex: 1,
    points: 1
  },
  {
    id: 14,
    question: "Which of these is Lara Croft?",
    options: [
      "/quizcontent/q14/1.png",
      "/quizcontent/q14/2.png",
      "/quizcontent/q14/3.png",
      "/quizcontent/q14/4.png"
    ],
    correctAnswerIndex: 2, // 3.png is index 2
    points: 1
  },
  {
    id: 15,
    question: "Which character is the Hokage of the Hidden Leaf at the beginning of Naruto?",
    options: [
      "/quizcontent/q15/1.png",
      "/quizcontent/q15/2.png",
      "/quizcontent/q15/3.png",
      "/quizcontent/q15/4.png"
    ],
    correctAnswerIndex: 2, // 3.png is index 2
    points: 1
  }
];
