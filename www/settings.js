(function () {
  var KEY = "actp_theme";
  var THEMES = [
    { id: "dark",   name: "Dark Orange",  bg: "#121212", ac: "#ff9800", nav: "#1e1e1e", light: false },
    { id: "amoled", name: "AMOLED Black", bg: "#000000", ac: "#ff9800", nav: "#0a0a0a", light: false },
    { id: "ocean",  name: "Ocean Blue",   bg: "#0b1622", ac: "#29b6f6", nav: "#12263a", light: false },
    { id: "forest", name: "Forest Green", bg: "#0e1a12", ac: "#66bb6a", nav: "#16281c", light: false },
    { id: "light",  name: "Light",        bg: "#f4f4f4", ac: "#e65100", nav: "#ffffff", light: true }
  ];
  function current() {
    try { return localStorage.getItem(KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function bars(id) {
    try {
      var t = THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0];
      if (window.ACTBars && window.ACTBars.set) window.ACTBars.set(t.bg, t.nav, t.light);
    } catch (e) {}
  }
  function apply(id) {
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem(KEY, id); } catch (e) {}
    bars(id);
    render();
  }
  function render() {
    var box = document.getElementById("themeList");
    if (!box) return;
    var cur = current();
    box.innerHTML = "";
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "theme-card" + (t.id === cur ? " on" : "");
      b.innerHTML = '<span class="sw" style="background:' + t.bg + '"><i style="background:' + t.ac + '"></i></span>' +
        '<span class="nm">' + t.name + '</span><span class="ck">\u2713</span>';
      b.addEventListener("click", function () { apply(t.id); });
      box.appendChild(b);
    });
  }
  document.documentElement.setAttribute("data-theme", current());
  bars(current());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
