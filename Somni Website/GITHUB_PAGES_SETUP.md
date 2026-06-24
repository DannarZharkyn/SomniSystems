# GitHub Pages Setup

Keep the Somni Systems website files inside the `Somni Website/` folder.

## Required Repository Structure

The GitHub repository root should contain:

```text
index.html
Somni Website/
project/
```

The root `index.html` should be the redirect file. It sends visitors to:

```text
Somni Website/index.html
```

Inside `Somni Website/`, keep:

```text
Somni Website/index.html
Somni Website/styles.css
Somni Website/qr.html
Somni Website/qr.js
Somni Website/assets/somni-hero.svg
Somni Website/assets/somni-qr.png
```

## GitHub Pages Settings

1. Open `DannarZharkyn/DannarZharkyn.github.io` on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Set **Branch** to `main`.
6. Set **Folder** to `/ (root)`.
7. Click **Save**.
8. Wait a few minutes, then open:

```text
https://dannarzharkyn.github.io/
```

The root redirect will automatically open:

```text
https://dannarzharkyn.github.io/Somni%20Website/
```

## Notes

- Do not rename `styles.css`, `qr.html`, `qr.js`, or the `assets/` folder.
- The links inside `Somni Website/index.html` are relative and should work as long as the files stay together inside `Somni Website/`.
- The QR code file is `Somni Website/assets/somni-qr.png`.
- The waitlist form is a placeholder and does not collect emails yet.
