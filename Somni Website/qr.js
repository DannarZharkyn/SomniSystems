const form = document.querySelector("#qr-form");
const input = document.querySelector("#site-url");
const preview = document.querySelector("#qr-preview");

const params = new URLSearchParams(window.location.search);
const initialUrl = params.get("url") || "https://somni-systems.vercel.app/";

if (initialUrl) {
  input.value = initialUrl;
  renderQr(initialUrl);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderQr(input.value.trim());
});

function renderQr(url) {
  if (!url) return;

  const qrUrl = new URL("https://api.qrserver.com/v1/create-qr-code/");
  qrUrl.searchParams.set("size", "640x640");
  qrUrl.searchParams.set("margin", "24");
  qrUrl.searchParams.set("data", url);

  preview.replaceChildren();

  const image = document.createElement("img");
  image.src = qrUrl.toString();
  image.alt = `QR code for ${url}`;

  const download = document.createElement("a");
  download.className = "button primary";
  download.href = qrUrl.toString();
  download.download = "somni-qr-code.png";
  download.textContent = "Download QR";

  preview.append(image, download);
}
