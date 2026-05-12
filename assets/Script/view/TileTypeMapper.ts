import { ItemType, Tile } from "../gameplay/types";

export function getItemType(tile: Tile): ItemType {
  if (tile.type) {
    switch (tile.type) {
      case "bomb":
        return ItemType.BOMB;

      case "big_bomb":
        return ItemType.BIG_BOMB;

      case "rocket_h":
        return ItemType.ROCKET_H;

      case "rocket_v":
        return ItemType.ROCKET_V;
    }
  }

  const colorMap: {
    [key: string]: ItemType;
  } = {
    B: ItemType.BLUE,
    G: ItemType.GREEN,
    R: ItemType.RED,
    Y: ItemType.YELLOW,
    P: ItemType.PURPLE,
  };

  return colorMap[tile.color] ?? ItemType.BLUE;
}
