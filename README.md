# SlotGameProgrammingTest
A slot game programming test for my job application at NTT Limited


// ----------------------------------------------------------------
// SETUP INSTRUCTIONS
// ----------------------------------------------------------------

1. Open project in Cocos Dashboard using Cocos Creator Version 3.8.4
2. In Cocos Creator, open the 'Main' scene located at 'assets/_ProjectSpecific/Scenes
3. Press play in Cocos Creator.
4. Enjoy! <3

// ----------------------------------------------------------------
// TECHNICAL NOTES
// ----------------------------------------------------------------

# Architecture approach used
- In this project, I utilized a Data-Driven and Component-Based architectural approach. Cocos was used to handle the UI and animations via modular, reusable components. To ensure clean separation of concerns, the core game assets are managed dynamically via an external JSON symbol configuration, while game results are decoupled from the UI and generated mock-server side through a local 'Results Generator' backend attached to the 'Reels' Node.

# Key design decisions
- In this project, I reflected my knowledge and experience as a front-end developer on slot machine games in Unity. It took quite a bit of a challenge due to time-constraints and my lack of experience using Cocos Creator and TypeScript. Although I was still able to produce every deliverables required with some additional modules (Stop spin function).

# Assumptions made during development
- During development of this test project, I assumed everything I have learned in the past regarding my knowledge in developing slot-machine games. From creating a separate 'local-backend', a JSON-based 'symbol config' (In Unity, we used ScriptableObjects), down to creating separate components (Reels, ReelsManager, Symbols, UI Controls, etc.)

# Any optional features or improvements implemented 
- Aside from the deliverables, I was able to provide Reel skip functionality, win values, and 'weighting' RNG approach for the spin results.
