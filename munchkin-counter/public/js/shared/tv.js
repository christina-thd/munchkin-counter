// Whether this is a TV, recognised by its browser name (the same test as device-check.js, which is a plain script
// and can't share it). TVs have slow processors: the music plays lighter there (js/table/music.js).
export const IS_TV = /SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|BRAVIA|Android ?TV|Google ?TV|CrKey|\bAFT[A-Z]|HbbTV|Roku|Viera|VIDAA|Hisense|PhilipsTV|\bTV\b/i
  .test(navigator.userAgent);

/** decodeAudioData with callbacks: older TV browsers don't return a promise from it, so `await` gets nothing. */
export function decodeAudio(ctx, data) {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(data, resolve, (err) => reject(err ?? new Error('could not decode')));
    result?.catch?.(() => { /* reported through the callback */ });
  });
}
