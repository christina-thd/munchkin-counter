// Tablets and TVs get the start page and dashboard; phones are sent to their own controls.
// A plain (non-module) script, loaded first in <head> so a phone never renders the dashboard.
//
//   TV:     recognised by its browser name, never redirected
//           (TVs often report a small screen, e.g. 960×540 for 1080p, but have no touch screen)
//   Phone:  a phone browser, or a small touch screen (under 600px on its short side;
//           tablets start around 740px)
//   Any device can be kept on the dashboard by opening the app once with ?dashboard
//   (and back to automatic with ?auto).
(function () {
  var KEY = 'munchkinDevice';
  var params = new URLSearchParams(location.search);
  try {
    if (params.has('dashboard')) localStorage.setItem(KEY, 'dashboard');
    if (params.has('auto')) localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) === 'dashboard') return;
  } catch (e) {
    if (params.has('dashboard')) return;   // storage blocked: honour the parameter for this visit
  }

  var ua = navigator.userAgent;
  var tv = /SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|BRAVIA|Android ?TV|Google ?TV|CrKey|\bAFT[A-Z]|HbbTV|Roku|Viera|VIDAA|Hisense|PhilipsTV|\bTV\b/i.test(ua);
  if (tv) return;

  var phoneBrowser = /iPhone|iPod|Android.+Mobile|Windows Phone|Mobi/i.test(ua);
  var touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
  var smallScreen = Math.min(screen.width, screen.height) < 600;
  if (phoneBrowser || (touch && smallScreen)) location.replace('join');
})();
