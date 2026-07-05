import type { Character, CharacterTrait } from "./supabase";

export function buildPortraitPrompt(
  character: Character,
  traits: CharacterTrait[]
): string {
  const parts: string[] = [];

  parts.push("portrait of a person");

  if (character.gender) {
    const genderMap: Record<string, string> = {
      男性: "male",
      女性: "female",
      男: "male",
      女: "female",
    };
    const gender = genderMap[character.gender] ?? character.gender;
    parts.push(gender);
  }

  if (character.age) {
    parts.push(`${character.age} years old`);
  }

  if (character.occupation) {
    parts.push(`occupation: ${character.occupation}`);
  }

  if (character.hair_color) {
    parts.push(`${character.hair_color} hair`);
  }
  if (character.eye_color) {
    parts.push(`${character.eye_color} eyes`);
  }
  if (character.height_cm) {
    const heightDesc =
      character.height_cm >= 180
        ? "tall stature"
        : character.height_cm <= 155
        ? "short stature"
        : "average height";
    parts.push(heightDesc);
  }

  const personalities = traits
    .filter((t) => t.trait_type === "personality")
    .map((t) => t.content);
  if (personalities.length > 0) {
    parts.push(`character traits: ${personalities.join(", ")}`);
  }

  parts.push(
    "detailed character illustration",
    "fantasy RPG art style",
    "dramatic lighting",
    "high quality",
    "detailed face",
    "cinematic composition"
  );

  return parts.join(", ");
}
