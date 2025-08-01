# VibeWare Microgame Generator

Automated microgame generation using AI (LiteLLM) for the VibeWare game collection.

## Setup

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

Or manually:
```bash
pip install litellm
```

### 2. Set API Key
You need to set an API key for your chosen AI provider:

```bash
# For OpenAI (GPT-4, GPT-3.5)
export OPENAI_API_KEY='your-api-key-here'

# For Anthropic (Claude)
export ANTHROPIC_API_KEY='your-api-key-here'
```

## Usage

The generator supports two modes:

### 1. Wizard Mode (Interactive)

Run the generator without arguments for interactive mode:

```bash
python generate_microgame.py
```

This will prompt you for:
- Game class name (e.g., `ClickGame`)
- Player prompt (e.g., `CLICK!`)
- Game description
- Controls description
- Detailed game concept
- AI model selection

### 2. Auto Mode (Automatic Generation)

Run with the `--auto` flag to automatically generate game ideas and create one:

```bash
python generate_microgame.py --auto
```

You can also specify a model:

```bash
python generate_microgame.py --auto --model gpt-4o
```

In auto mode:
- The AI generates 10 creative WarioWare-style microgame ideas
- Displays all generated ideas with their prompts and descriptions
- Randomly selects one game to implement
- Automatically generates the complete game code

This mode is perfect for rapid prototyping and getting inspiration!

## How It Works

1. **Context Loading**: The generator loads all necessary files:
   - `BaseMicrogame.ts` - The abstract base class
   - Example games (CatchGame, TypeGame, DodgeGame)
   - Game configuration files
   - Implementation instructions

2. **AI Generation**: Using LiteLLM, it sends the context and your game specifications to the AI model

3. **Code Generation**: The AI generates complete TypeScript code for your microgame

4. **Auto-Registration**: The script automatically:
   - Saves the game to `src/scenes/microgames/[YourGame].ts`
   - Updates `src/main.ts` to import and register the scene
   - Updates `src/GameConfig.ts` to add the game metadata

5. **Validation**: Runs the validation script to ensure:
   - All required methods are implemented
   - Class name matches the scene key
   - Win/fail states are handled
   - Event listeners are cleaned up
   - Game is properly registered

6. **Retry Logic**: If validation fails, it will retry up to 3 times, providing the AI with the validation errors to fix

## Testing Your Generated Game

After successful generation:

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the game in your browser and press 'D' on the title screen to access the debug menu

4. Select your newly generated game to test it

## Troubleshooting

### "litellm is not installed"
Run: `pip install litellm`

### "No API key found"
Set your API key as an environment variable (see Setup section)

### Validation Failures
- Check the validation output for specific errors
- Common issues:
  - Missing win/fail state calls
  - Empty cleanupControls method
  - Class name doesn't match scene key
  
### TypeScript Compilation Errors
After generation, run `npm run build` to check for any TypeScript errors that the validator might have missed

## Supported Models

- **GPT-4** (default, best results)
- **GPT-3.5-turbo** (faster, cheaper)
- **Claude-2** (Anthropic)
- Any model supported by LiteLLM

## Tips for Better Results

1. **Be Specific**: Provide detailed game concepts and clear control schemes
2. **Keep It Simple**: Remember, microgames last only 3-5 seconds
3. **Single Objective**: Focus on one clear goal (click, dodge, catch, etc.)
4. **Clear Prompts**: Use action words ending with "!" (CLICK!, DODGE!, CATCH!)

## Example Game Ideas

- **ClickGame**: "CLICK!" - Click targets before they disappear
- **AvoidGame**: "AVOID!" - Don't let your mouse touch the moving obstacles
- **MatchGame**: "MATCH!" - Click matching pairs of colors
- **CountGame**: "COUNT!" - Click the right number of objects
- **TimingGame**: "STOP!" - Stop the moving bar in the target zone 