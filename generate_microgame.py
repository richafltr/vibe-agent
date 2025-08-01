#!/usr/bin/env python3
"""
Improved Microgame Generator for VibeWare
Uses a cleaner registry system instead of regex editing
"""

import os
import sys
import subprocess
import argparse
import random
import json
from pathlib import Path
from typing import Dict, Tuple, List
import litellm
import agentops
from agentops.sdk.decorators import trace, agent, operation, tool

agentops.init(trace_name="VibeWare Microgame Generator")


@agent
class MicrogameGenerator:
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.base_path = Path(__file__).parent
        self.context_files = self._load_context_files()

    def _load_context_files(self) -> Dict[str, str]:
        """Load all necessary context files"""
        files_to_load = {
            "base_microgame": "src/scenes/BaseMicrogame.ts",
            "example_catch": "src/scenes/microgames/CatchGame.ts",
            "instructions": "microgame_instructions.md"
        }

        context = {}
        for key, filepath in files_to_load.items():
            full_path = self.base_path / filepath
            if full_path.exists():
                with open(full_path, 'r') as f:
                    context[key] = f.read()
        return context

    def _create_system_prompt(self) -> str:
        """Create the system prompt with all context"""
        prompt = """You are an expert TypeScript/Phaser game developer creating microgames for VibeWare.

CONTEXT FILES:

=== BaseMicrogame.ts (MUST EXTEND THIS) ===
{base_microgame}

=== Example: CatchGame.ts ===
{example_catch}

=== Instructions ===
{instructions}

CRITICAL REQUIREMENTS:
1. Output ONLY the TypeScript code for the microgame class
2. Class name MUST match the key passed to super()
3. MUST have a constructor that calls super({{ key: 'ClassName' }}) where ClassName is your game class name
4. MUST implement all abstract methods from BaseMicrogame
5. MUST call setWinState() or setFailState() based on game outcome
6. MUST clean up ALL event listeners in cleanupControls()
7. Use GAME_WIDTH (800) and GAME_HEIGHT (600) for positioning
8. Keep it simple - players have only 3-5 seconds
9. Import Phaser like this: import Phaser from 'phaser'
10. Import from correct paths: import BaseMicrogame from '../BaseMicrogame'
11. BaseMicrogame extends Phaser.Scene, so after extending it you have access to all Phaser.Scene properties like this.add, this.physics, this.input, this.tweens, this.time, this.cameras, etc.
12. MUST implement resetGameState() method (can be empty: resetGameState(): void {{}})
13. Follow the exact pattern shown in the CatchGame.ts example for constructor and imports
14. When using physics groups or arcade physics, cast the body type appropriately: (object.body as Phaser.Physics.Arcade.Body)
15. TypeScript knows about Phaser properties through inheritance - you DON'T need to declare properties like 'add', 'physics', etc. They come from Phaser.Scene
16. When creating game objects, always specify their types: e.g., private mySprite!: Phaser.GameObjects.Sprite
17. All of this code is within a single file, so don't expect to import anything from other files as part of this creation process
18. The Sprites, and graphics of this game must all be created within the file. Make sure they look good.
19. We don't have textures, so you'll need to draw graphics yourself.
20. Upon winning a game, there should be some kind of victory animation or gag related to the game. Something funny and creative, not generic like a confetti explosion. Same thing for losing.

Do not include any explanations, comments outside the code, or markdown code blocks. 
Just output the pure TypeScript code."""

        return prompt.format(
            base_microgame=self.context_files.get('base_microgame', ''),
            example_catch=self.context_files.get('example_catch', ''),
            instructions=self.context_files.get('instructions', '')
        )

    def _escape_typescript_string(self, text: str) -> str:
        """Escape quotes for TypeScript string literals"""
        # Replace single quotes with escaped single quotes
        # Also escape backslashes to prevent issues
        return text.replace('\\', '\\\\').replace("'", "\\'")

    def _update_registry(self, game_name: str, game_info: Dict[str, str]) -> bool:
        """Update the registry file with the new game"""
        try:
            registry_path = self.base_path / "src/scenes/microgames/registry.ts"

            with open(registry_path, 'r') as f:
                content = f.read()

            # Save original content for rollback
            original_content = content

            # Check if game already exists
            if f"import {game_name}" in content:
                print(
                    f"⚠️  {game_name} already exists in registry, skipping...")
                return False

            # Add game to MICROGAME_SCENES array
            content = content.replace(
                "// NEW_GAME_MARKER - Do not remove this comment",
                f"{game_name},\n    // NEW_GAME_MARKER - Do not remove this comment"
            )

            # Add the import after the last import
            import_line = f"import {game_name} from './{game_name}';"
            last_import_pos = content.rfind("import")
            if last_import_pos != -1:
                end_of_line = content.find('\n', last_import_pos)
                content = content[:end_of_line+1] + \
                    import_line + '\n' + content[end_of_line+1:]

            # Check if metadata already exists
            if f"key: '{game_name}'" in content:
                print(
                    f"⚠️  Metadata for {game_name} already exists, skipping metadata addition...")
            else:
                # Add metadata at the marker
                metadata_entry = f"""    {{
        key: '{game_name}',
        name: '{self._escape_typescript_string(game_info['name'])}',
        prompt: '{self._escape_typescript_string(game_info['prompt'])}',
        description: '{self._escape_typescript_string(game_info['description'])}',
        controls: '{self._escape_typescript_string(game_info['controls'])}'
    }},"""

                content = content.replace(
                    "    // NEW_METADATA_MARKER - Do not remove this comment",
                    f"{metadata_entry}\n    // NEW_METADATA_MARKER - Do not remove this comment"
                )

            with open(registry_path, 'w') as f:
                f.write(content)

            print(f"✅ Updated registry with {game_name}")
            return True

        except Exception as e:
            print(f"❌ Error updating registry: {e}")
            return False

    def _rollback_registry(self, game_name: str) -> None:
        """Remove game from registry (used on validation failure)"""
        try:
            registry_path = self.base_path / "src/scenes/microgames/registry.ts"

            with open(registry_path, 'r') as f:
                content = f.read()

            # Remove the import
            import_line = f"import {game_name} from './{game_name}';\n"
            content = content.replace(import_line, '')

            # Remove from MICROGAME_SCENES array
            content = content.replace(f"{game_name},\n    ", '')

            # Remove metadata - this is trickier as we need to find the full block
            lines = content.split('\n')
            new_lines = []
            skip_lines = 0

            for i, line in enumerate(lines):
                if skip_lines > 0:
                    skip_lines -= 1
                    continue

                # Look for entries with the key field OR entries with the game name (handling both cases)
                display_name = game_name.replace('Game', ' Game')
                formatted_name = ' '.join(
                    word.capitalize() for word in display_name.replace('_', ' ').split())

                if (f"key: '{game_name}'" in line or
                    (f"name: '{formatted_name}'" in line and i + 1 < len(lines) and
                     "prompt:" in lines[i + 1])):
                    # Find the start of this metadata block (go back to find the opening brace)
                    j = i
                    while j >= 0 and '{' not in lines[j]:
                        j -= 1
                    # Find the end of this metadata block
                    k = i
                    brace_count = 0
                    while k < len(lines):
                        brace_count += lines[k].count('{') - \
                            lines[k].count('}')
                        if brace_count == 0 and '}' in lines[k]:
                            # Skip the comma after the closing brace if present
                            if k + 1 < len(lines) and lines[k + 1].strip() == ',':
                                skip_lines = k - i + 1
                            else:
                                skip_lines = k - i
                            break
                        k += 1
                else:
                    new_lines.append(line)

            content = '\n'.join(new_lines)

            with open(registry_path, 'w') as f:
                f.write(content)

            print(f"↩️  Rolled back registry changes for {game_name}")

        except Exception as e:
            print(f"⚠️  Warning: Could not rollback registry: {e}")

    @tool
    def _validate_game(self, game_name: str) -> Tuple[bool, str]:
        """Run validation script on the generated game"""
        try:
            result = subprocess.run(
                ['node', 'validateGames.cjs', game_name],
                capture_output=True,
                text=True,
                check=False
            )

            success = result.returncode == 0
            output = result.stdout + result.stderr

            return success, output

        except Exception as e:
            return False, f"Validation error: {e}"

    @operation
    def generate_microgame(self,
                           name: str,
                           prompt: str,
                           description: str,
                           controls: str,
                           game_idea: str,
                           model: str = "gpt-4o") -> bool:
        """Generate a new microgame based on the provided details"""

        # Create initial user prompt
        initial_prompt = f"""Create a microgame called {name} with the following specifications:

Game Name: {name}
Prompt (shown to player): {prompt}
Description: {description}
Controls: {controls}
Game Concept: {game_idea}

Generate the complete TypeScript code for this microgame. The class name should be {name}."""

        print(f"\n🎮 Generating {name} using {model}...")

        # Initialize messages array
        messages = [
            {"role": "system", "content": self._create_system_prompt()},
            {"role": "user", "content": initial_prompt}
        ]

        for attempt in range(1, self.max_retries + 1):
            print(f"\n📝 Attempt {attempt}/{self.max_retries}")

            try:
                # Generate code using LiteLLM
                response = litellm.completion(
                    model=model,
                    messages=messages
                )

                # Extract content from response
                generated_code = ""
                try:
                    # Try to get content from choices (OpenAI format)
                    if hasattr(response, 'choices') and len(response.choices) > 0:  # type: ignore
                        # type: ignore
                        generated_code = response.choices[0].message.content
                except:
                    pass

                # If that didn't work, try direct content access
                if not generated_code:
                    try:
                        generated_code = response.content  # type: ignore
                    except:
                        generated_code = str(response)

                if not generated_code:
                    print("❌ No code generated in response")
                    continue

                generated_code = generated_code.strip()

                # Clean up code if wrapped in markdown
                if "```typescript" in generated_code:
                    generated_code = generated_code.split(
                        "```typescript")[1].split("```")[0]
                elif "```" in generated_code:
                    generated_code = generated_code.split(
                        "```")[1].split("```")[0]

                # Save the generated code
                output_path = self.base_path / \
                    f"src/scenes/microgames/{name}.ts"
                with open(output_path, 'w') as f:
                    f.write(generated_code)

                print(f"✅ Code generated and saved to {output_path}")

                # Validate the game BEFORE updating registry
                print("\n🔍 Running validation...")
                success, validation_output = self._validate_game(name)
                print(validation_output)

                if success:
                    # Only update registry if validation passed
                    print("\n✅ Validation passed! Updating registry...")

                    # Format the display name
                    display_name = name.replace('Game', ' Game')
                    display_name = ' '.join(
                        word.capitalize() for word in display_name.replace('_', ' ').split())

                    game_info = {
                        "name": display_name,
                        "prompt": prompt,
                        "description": description,
                        "controls": controls
                    }

                    if self._update_registry(name, game_info):
                        print(
                            f"\n✅ {name} successfully generated and validated!")
                        print(
                            "\n🎮 You can now test your game by running: npm run dev")
                        print(
                            "   Then press 'D' on the title screen to access the debug menu")
                        return True
                    else:
                        print("❌ Failed to update registry")
                        # Delete the generated file since registry update failed
                        if output_path.exists():
                            output_path.unlink()
                            print(f"🗑️  Deleted generated file: {output_path}")
                        continue
                else:
                    print(f"\n❌ Validation failed, cleaning up and retrying...")

                    # Delete the generated file
                    if output_path.exists():
                        output_path.unlink()
                        print(f"🗑️  Deleted failed file: {output_path}")

                        # Reset messages for a fresh one-shot attempt (no error context)
                    messages = [
                        {"role": "system", "content": self._create_system_prompt()},
                        {"role": "user", "content": initial_prompt}
                    ]

                    print(f"🔄 Starting fresh generation attempt...")
                    continue

            except Exception as e:
                print(f"❌ Error: {e}")
                if "api_key" in str(e).lower():
                    print(
                        "\n💡 Tip: Make sure you have set your API key as an environment variable:")
                    print("   export OPENAI_API_KEY='your-key-here'")
                    return False

        print(
            f"\n❌ Failed to generate valid {name} after {self.max_retries} attempts")
        return False

    @operation
    def generate_game_ideas(self, model: str = "gpt-4o", count: int = 1) -> List[Dict[str, str]]:
        """Generate creative game ideas using AI"""

        prompt = f"""We are making our own version of Wario Ware. Please generate {count} unique microgame idea{"s" if count > 1 else ""} with the following:
- Controls (we're using PC, so keyboard and mouse are the main options). You can be creative with the input types
- Game objective - How do you win or lose?
- What is the prompt that appears on the screen? At the beginning of the game, there should be a prompt that instructs the player what to do. i.e. Jump, Clean, Survive, etc.

The games should all be very short in nature. i.e. 3-10 seconds. Clearly detail the description, style, and humor of the games. For style, name a color palette i.e. pixel art, classic, 3d, n64 graphics, etc.

Format your response as {"an array of JSON objects" if count > 1 else "a JSON object"} with the following fields:
{"[" if count > 1 else ""}{{
  "name": "GameNameGame",
  "prompt": "ACTION!",
  "description": "Brief description of what happens",
  "controls": "How to control (e.g., Mouse, Keyboard, Arrow Keys)",
  "game_idea": "Detailed game concept including visual style, objective, and mechanics",
  "style": "Visual style and color palette"
}}{"]" if count > 1 else ""}

IMPORTANT: 
- Each name must end with "Game" and be a valid TypeScript class name (no spaces)
- Prompts should be 1-2 words ending with !
- Be creative and humorous like WarioWare games
- Keep mechanics simple - remember players only have 3-5 seconds!
{"- Make sure each game idea is unique and different from the others" if count > 1 else ""}"""

        print(
            f"🎨 Generating {count} creative game idea{'s' if count > 1 else ''}...")

        try:
            response = litellm.completion(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a creative game designer specializing in quick, funny microgames like WarioWare. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
            )

            # Get content from response - handle different response formats
            if hasattr(response, 'choices'):
                content = response.choices[0].message.content  # type: ignore
            else:
                content = str(response)
            if not content:
                raise ValueError("No content generated")

            # Clean up the response if it has markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            # Parse the JSON
            game_ideas = json.loads(content.strip())

            # Handle single game idea (convert to list for compatibility)
            if isinstance(game_ideas, dict):
                game_ideas = [game_ideas]
            else:
                game_ideas = game_ideas

            if not isinstance(game_ideas, list) or len(game_ideas) == 0:
                raise ValueError("Invalid response format")

            print(f"✅ Generated {len(game_ideas)} game idea(s)!")
            return game_ideas

        except Exception as e:
            print(f"❌ Error generating game ideas: {e}")
            raise


def main():
    """Microgame generator with wizard and auto modes"""

    # Set up argument parser
    parser = argparse.ArgumentParser(
        description='VibeWare Microgame Generator')
    parser.add_argument('--auto', action='store_true',
                        help='Auto mode: Generate game ideas automatically')
    parser.add_argument('--model', type=str, default='gpt-4o',
                        help='AI model to use (default: gpt-4o)')
    parser.add_argument('-n', '--count', type=int, default=1,
                        help='Number of games to generate (default: 1, only works with --auto)')
    args = parser.parse_args()

    print("🎮 VibeWare Microgame Generator")
    print("=" * 40)

    # Validate arguments
    if args.count > 1 and not args.auto:
        print("\n❌ Error: --count/-n can only be used with --auto mode")
        print("   Example: python generate_microgame.py --auto -n 3")
        return

    if args.count < 1:
        print("\n❌ Error: --count must be at least 1")
        return

    if args.count > 10:
        print("\n⚠️  Warning: Generating more than 10 games at once may take a long time.")
        confirm = input(
            "Are you sure you want to continue? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return

    # Check for API key
    if not os.environ.get('OPENAI_API_KEY') and not os.environ.get('ANTHROPIC_API_KEY') and not os.environ.get('GOOGLE_API_KEY'):
        print("\n⚠️  Warning: No API key found in environment variables.")
        print("Set one of the following:")
        print("  export OPENAI_API_KEY='your-key-here' (for GPT-4o)")
        print("  export ANTHROPIC_API_KEY='your-key-here' (for Claude)")
        print("  export GOOGLE_API_KEY='your-key-here' (for Gemini)")
        print("\nOr you can set a custom model that doesn't require these keys.\n")

    generator = MicrogameGenerator()

    if args.auto:
        # AUTO MODE
        print("\n🤖 Running in AUTO mode")
        print("Generating creative game ideas...\n")

        # Generate game ideas
        game_ideas = generator.generate_game_ideas(args.model, args.count)

        # Display all generated ideas
        print("\n📋 Generated Game Ideas:")
        print("-" * 60)
        for i, idea in enumerate(game_ideas, 1):
            print(f"\n{i}. {idea['name']}")
            print(f"   Prompt: {idea['prompt']}")
            print(f"   Description: {idea['description']}")
            print(f"   Style: {idea.get('style', 'Not specified')}")

        # Generate the games
        if args.count == 1:
            # Select a random game for single generation
            selected_game = random.choice(game_ideas)
            print(f"\n🎲 Randomly selected: {selected_game['name']}")
            print(f"   {selected_game['description']}")

            # Generate the selected game
            print("\n" + "=" * 60)
            print(f"🎮 Generating {selected_game['name']}...")
            print("=" * 60)

            success = generator.generate_microgame(
                name=selected_game['name'],
                prompt=selected_game['prompt'],
                description=selected_game['description'],
                controls=selected_game['controls'],
                game_idea=selected_game['game_idea'],
                model=args.model
            )

            if success:
                print(f"\n🎉 Auto-generated game complete!")
                print(f"\nGame Details:")
                print(f"- Name: {selected_game['name']}")
                print(f"- Prompt: {selected_game['prompt']}")
                print(f"- Description: {selected_game['description']}")
                print(f"- Controls: {selected_game['controls']}")
                print(
                    f"- Style: {selected_game.get('style', 'Not specified')}")
        else:
            # Generate all games when count > 1
            print(f"\n🎮 Generating {len(game_ideas)} games...")
            print("=" * 60)

            successful_games = []
            failed_games = []

            for i, game in enumerate(game_ideas, 1):
                print(f"\n[{i}/{len(game_ideas)}] Generating {game['name']}...")
                print("-" * 40)

                success = generator.generate_microgame(
                    name=game['name'],
                    prompt=game['prompt'],
                    description=game['description'],
                    controls=game['controls'],
                    game_idea=game['game_idea'],
                    model=args.model
                )

                if success:
                    successful_games.append(game['name'])
                else:
                    failed_games.append(game['name'])

            # Summary
            print("\n" + "=" * 60)
            print("🎯 GENERATION SUMMARY")
            print("=" * 60)
            print(f"\n✅ Successfully generated: {len(successful_games)} games")
            if successful_games:
                for game in successful_games:
                    print(f"   - {game}")

            if failed_games:
                print(f"\n❌ Failed to generate: {len(failed_games)} games")
                for game in failed_games:
                    print(f"   - {game}")

            print(
                f"\n🎉 Batch generation complete! ({len(successful_games)}/{len(game_ideas)} successful)")

    else:
        # WIZARD MODE (existing interactive mode)
        print("\n🧙 Running in WIZARD mode")
        print("Enter microgame details interactively...\n")

        # Get game details from user
        name = input("Game class name (e.g., ClickGame): ").strip()
        if not name:
            print("❌ Name is required")
            return

        # Ensure name ends with "Game" for consistency
        if not name.endswith("Game"):
            name += "Game"
            print(f"📝 Updated name to: {name}")

        prompt = input("Player prompt (e.g., CLICK!): ").strip().upper()
        if not prompt.endswith("!"):
            prompt += "!"

        description = input("Game description: ").strip()
        controls = input("Controls (e.g., Mouse: Click on targets): ").strip()
        game_idea = input("Detailed game concept: ").strip()

        # Model selection
        print("\nSelect AI model:")
        print("1. GPT-4o (default, requires OPENAI_API_KEY)")
        print("2. Claude 3.7 Sonnet (requires ANTHROPIC_API_KEY)")
        print("3. Gemini 2.5 Pro (requires GOOGLE_API_KEY)")
        print("4. Custom (enter your own)")

        model_choice = input("\nChoice [1]: ").strip() or "1"

        model_map = {
            "1": "gpt-4o",
            "2": "claude-3-7-sonnet-latest",
            "3": "gemini-2.5-pro-exp-03-25",
            "4": None
        }

        model = model_map.get(model_choice)
        if model is None and model_choice == "4":
            model = input("Enter model name: ").strip()
        elif model is None:
            model = "gpt-4o"

        # Generate the game
        generator.generate_microgame(
            name, prompt, description, controls, game_idea, model)


if __name__ == "__main__":
    main()
