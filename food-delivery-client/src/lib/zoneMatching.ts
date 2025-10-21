// Утилита для сопоставления адреса текстовой зоне доставки

export type ZonesDict = Record<string, any>;

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Пытается найти идентификатор зоны по вхождению названия зоны в адресе.
 * Если совпадений нет — возвращает id зоны с минимальной стоимостью.
 */
export function matchAddressToZone(address: string | undefined, zones: ZonesDict): string | null {
  if (!zones || Object.keys(zones).length === 0) return null;

  const normalizedAddress = normalize(address || '');

  let bestMatchId: string | null = null;
  let bestMatchScore = 0; // длина совпадения

  for (const [zoneId, zoneData] of Object.entries(zones)) {
    const zoneName: string = zoneData?.name || '';
    const normalizedZoneName = normalize(zoneName);
    if (!normalizedZoneName) continue;

    if (normalizedAddress.includes(normalizedZoneName)) {
      const score = normalizedZoneName.length;
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchId = zoneId;
      }
    }
  }

  if (bestMatchId) return bestMatchId;

  // Фолбэк: ближайшая по «стоимости» зона — минимальная цена
  let cheapestId: string | null = null;
  let cheapestCost = Number.POSITIVE_INFINITY;
  for (const [zoneId, zoneData] of Object.entries(zones)) {
    const cost = typeof zoneData?.cost === 'number' ? zoneData.cost : Number.POSITIVE_INFINITY;
    if (cost < cheapestCost) {
      cheapestCost = cost;
      cheapestId = zoneId;
    }
  }

  return cheapestId;
}


