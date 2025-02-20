// Ref: https://api-vt.geolonia.com/altitude.html
const GEOID_HEIGHT_API = "https://api-vt.geolonia.com/api/altitude";

type Result = {
  lat: number;
  lng: number;
  geoid: number | "NaN";
  altitude: number | "NaN";
};

export function getGeoidHeight(lng: number, lat: number): Promise<number | undefined> {
  if (lat === undefined || lng === undefined) return Promise.resolve(undefined);
  return fetch(`${GEOID_HEIGHT_API}?lat=${lat}&lng=${lng}`)
    .then(res => {
      return res.json().then((result: Result) => {
        const geoid = result.geoid;
        return geoid === "NaN" ? undefined : Number(geoid);
      });
    })
    .catch(e => {
      console.warn("Failed to fetch geoid height", e);
      return undefined;
    });
}
