/** Official artwork lives next to the game sprite in the same pinned PokeAPI sprites repo. */
export function artworkUrl(sprite: string): string {
  return sprite.replace("/sprites/pokemon/", "/sprites/pokemon/other/official-artwork/");
}
